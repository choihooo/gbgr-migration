# Implementation Plan: 출석 현황 패널 이관 (AttendancePanel)

**Branch**: `011-attendance-panel-migration` | **Date**: 2025-04-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/011-attendance-panel-migration/spec.md`

## Summary

레거시 `AttendacePanel`(출석 현황) 컴포넌트를 Tauri 마이그레이션 프로젝트로 이관.
마이그레이션 폴더에 이미 구현체가 존재하므로, 레거시와의 시각적 동일성 검증과
누락된 부분(오타 수정, barrel export 등) 보완에 집중한다.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19.1
**Primary Dependencies**: React Router DOM 7.14, TanStack Query 5, Tailwind CSS 4.2.2, clsx 2.1.1, tailwind-merge 3.3.0
**Storage**: N/A (조회형 UI 패널, 신규 저장 없음)
**Testing**: Vitest (필요 시), 수동 시각 검증
**Target Platform**: Tauri 2 Desktop (Windows/macOS/Linux)
**Project Type**: Desktop App (Tauri + React WebView)
**Performance Goals**: 월 전환 시 즉시 렌더링 (캐시 활용)
**Constraints**: 레거시와 시각적으로 동일해야 함
**Scale/Scope**: 단일 패널 컴포넌트 + API 연동

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gate 1: 레거시 존중 ✅ PASS
- `src/` 코드 수정 없음 (참조만)
- 레거시 비즈니스 로직(레벨 매핑, 메시지 변환) 동일하게 포팅됨
- 레거시 원본 경로: `src/renderer/src/features/dashboard/ui/AttendacePanel.tsx`

### Gate 2: UI 충실도 보존 ✅ PASS
- 동일한 4열 4행 그리드 레이아웃
- 동일한 색상 토큰 (bg-yellow-100~500, bg-grey-50, ring-yellow-500)
- 동일한 도트 크기 (18x18px), 동일한 간격 (gap-2, gap-x-1, gap-y-1)
- 인라인 대체 컴포넌트(PageMoveButton, IntensitySlider)가 시각적으로 동일함

### Gate 3: Tauri 아키텍처 준수 ✅ PASS
- 프론트엔드 전용 패널, Rust 백엔드 개입 없음
- API 통신은 기존 HTTP 클라이언트 사용
- OS 부작용 없음

### Gate 4: 점진적 마이그레이션 ✅ PASS
- 단일 패널 이관으로 독립적 검증 가능
- Zustand 미사용 (API 쿼리만 사용), TanStack Query 패턴 유지
- 다른 패널에 의존하지 않음

### Gate 5: 품질 게이트 강제 ✅ PASS
- `bun run check` (lint + typecheck) 통과 필요
- UI 정적 이관으로 회귀 리스크 낮음
- 핵심 로직(레벨 매핑, 메시지 변환)은 기존 테스트 커버리지로 충분
- 수동 시각 검증으로 레거시와의 동일성 확인

## Project Structure

### Documentation (this feature)

```text
specs/011-attendance-panel-migration/
├── plan.md              # 이 파일
├── spec.md              # 기능 스펙
├── research.md          # Phase 0: 레거시 vs 마이그레이션 비교 분석
├── data-model.md        # Phase 1: 데이터 모델
├── quickstart.md        # Phase 1: 빠른 시작 가이드
└── checklists/
    └── requirements.md  # 스펙 품질 체크리스트
```

### Source Code (repository root)

```text
migration/
├── src/
│   ├── features/
│   │   └── main-panels/
│   │       ├── model/
│   │       │   └── types.ts                           # 패널 공통 타입
│   │       └── ui/
│   │           └── AttendancePanel.tsx                 # ← 작업 대상
│   ├── entities/
│   │   └── dashboard/
│   │       └── model/
│   │           └── use-dashboard-queries.ts            # API 쿼리 훅
│   └── shared/
│       ├── ui/
│       │   ├── panel-header/index.tsx                  # PanelHeader
│       │   ├── toggle-switch/index.tsx                 # ToggleSwitch
│       │   └── icons/ui-icons.tsx                      # 아이콘들
│       └── lib/
│           └── cn.ts                                   # className 병합 유틸리티

src/                                                    # ← 레거시 (참조만, 수정 금지)
└── renderer/src/
    ├── features/dashboard/ui/AttendacePanel.tsx         # 원본 컴포넌트
    └── entities/dashboard/
        ├── types/index.ts                               # 원본 타입
        └── api/use-attendance-query.ts                  # 원본 쿼리 훅
```

**Structure Decision**: 기존 마이그레이션 프로젝트 구조를 그대로 따름.
`main-panels/ui/`에 패널 컴포넌트가 위치하며, 공유 UI는 `shared/ui/`에 있음.

## Implementation Steps

### Step 1: 기존 AttendancePanel 검증
- 마이그레이션 `AttendancePanel.tsx`와 레거시 `AttendacePanel.tsx`의
  HTML 구조, Tailwind 클래스, 레벨 매핑 로직이 정확히 일치하는지 확인
- 누락된 차이가 있으면 수정

### Step 2: 빌드 검증
- `bun run check` 실행 (Biome lint + TypeScript typecheck)
- 오류 발생 시 수정

### Step 3: barrel export 확인
- `main-panels/ui/`의 barrel export(index.ts)에 AttendancePanel이 포함되어 있는지 확인
- 필요 시 추가

### Step 4: 수동 시각 검증
- 개발 서버에서 출석 현황 패널 렌더링 확인
- 레거시 앱과 나란히 비교하여 시각적 동일성 확인

## Post-Design Constitution Re-Check

| Gate | Status | Notes |
|------|--------|-------|
| 1. 레거시 존중 | ✅ | `src/` 수정 없음 |
| 2. UI 충실도 | ✅ | 동일한 레이아웃, 색상, 간격 |
| 3. Tauri 아키텍처 | ✅ | 프론트엔드 전용, Rust 개입 없음 |
| 4. 점진적 마이그레이션 | ✅ | 단일 패널 독립 이관 |
| 5. 품질 게이트 | ✅ | lint/typecheck/build 통과 필요 |
