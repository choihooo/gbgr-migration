# Implementation Plan: PosePatternPanel 정적 패널 이관

**Branch**: `013-pose-pattern-panel-migration` | **Date**: 2026-04-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-pose-pattern-panel-migration/spec.md`

## Summary

PosePatternPanel을 레거시(`src/renderer/src/features/dashboard/ui/PosePatternPanel.tsx`)에서 마이그레이션(`migration/src/features/main-panels/ui/PosePatternPanel.tsx`)으로 픽셀 퍼펙트하게 이관한다. 마이그레이션 파일이 이미 존재하므로, 레거시와의 스타일 차이를 식별하고 동일하게 맞추는 작업이 핵심이다.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19.1
**Primary Dependencies**: React Router DOM 7.14, TanStack Query 5, Tailwind CSS 4.2.2, clsx 2.1.1, tailwind-merge 3.3.0
**Storage**: N/A (정적 UI 패널, API 조회만)
**Testing**: 시각적 비교 검증 (렌더링된 마이그레이션 패널 vs 레거시 스크린샷)
**Target Platform**: Tauri 2 데스크탑 앱 (webview)
**Project Type**: desktop-app
**Performance Goals**: N/A (정적 UI)
**Constraints**: 레거시와 픽셀 퍼펙트한 시각적 동일성
**Scale/Scope**: 단일 패널 컴포넌트 (PosePatternPanel 1개)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 상태 | 근거 |
|------|------|------|
| 1. 레거시 존중 | PASS | `src/` 코드를 읽기 전용으로 참조하여 마이그레이션 정합성 확보 |
| 2. UI 충실도 보존 | PASS | 레거시와 완전 동일한 스타일 유지 목표 (FR-001 픽셀 퍼펙트) |
| 3. Tauri 아키텍처 준수 | PASS | 프론트엔드 React 컴포넌트만 수정, Tauri 명령어 변경 없음 |
| 4. 점진적 마이그레이션 | PASS | 단일 패널 이관, 기존 마이그레이션된 컴포넌트 재사용 |
| 5. 품질 게이트 강제 | PASS | lint/typecheck/build 통과 필요, 정적 UI 패널로 테스트 부담 최소 |

**Violations**: 없음

## Project Structure

### Documentation (this feature)

```text
specs/013-pose-pattern-panel-migration/
├── plan.md              # 이 파일
├── research.md          # Phase 0 산출물
├── spec.md              # 기능 스펙
└── checklists/
    └── requirements.md  # 스펙 품질 체크리스트
```

### Source Code (repository root)

```text
migration/src/
├── features/main-panels/
│   ├── ui/
│   │   └── PosePatternPanel.tsx     # 수정 대상 (메인 컴포넌트)
│   └── model/types.ts               # PanelBaseProps 타입 (기존)
├── shared/ui/
│   ├── panel-header/index.tsx       # 재사용 (기존)
│   └── icons/ui-icons.tsx           # 재사용 (기존)
├── entities/dashboard/model/
│   └── use-dashboard-queries.ts     # 재사용 (기존)
└── shared/lib/cn.ts                 # 재사용 (기존)
```

**Structure Decision**: 기존 마이그레이션 디렉터리 구조를 그대로 따른다. 새 파일 생성 없이 `PosePatternPanel.tsx`만 수정한다.

## Phase 0: Research Results

See [research.md](./research.md) for full details.

**Key Findings:**
1. 마이그레이션 아이콘(ClockIcon, CalendarIcon, HourglassIcon, ThumbupIcon)에 이미 `fill="#EFEEED"` 원형 배경이 SVG 내장 → 레거시의 `bg-grey-50 rounded-full` 래퍼와 시각적으로 동일
2. 아이콘에 추가 CSS 래퍼를 적용하면 이중 배경이 되어 오히려 시각적 불일치 발생
3. 현재 마이그레이션 코드의 Tailwind 클래스는 이미 레거시와 동일하게 적용됨
4. `PanelBaseProps` + `cn()` 도입만으로 다른 마이그레이션 패널과 일관성 확보 가능

## Phase 1: Design Artifacts

- [data-model.md](./data-model.md) — PosePatternData 엔티티 및 PatternCard 내부 구조 정의
- [quickstart.md](./quickstart.md) — 개발 환경 설정 및 검증 방법

## Constitution Re-Check (Post-Design)

| 원칙 | 상태 | 근거 |
|------|------|------|
| 1. 레거시 존중 | PASS | 레거시 코드를 읽기 전용으로 분석, 수정 없음 |
| 2. UI 충실도 보존 | PASS | SVG 내장 배경 원으로 레거시와 시각적 동일성 확보 |
| 3. Tauri 아키텍처 준수 | PASS | 프론트엔드 컴포넌트만 수정 |
| 4. 점진적 마이그레이션 | PASS | 기존 패턴(PanelBaseProps, cn) 따름 |
| 5. 품질 게이트 강제 | PASS | typecheck/lint/build 검증, 정적 UI로 테스트 부담 최소 |

**Violations**: 없음

## Implementation Tasks (Preview)

단일 파일 수정으로 완료 가능:

1. `PosePatternPanel.tsx`에 `PanelBaseProps` + `cn()` 적용
2. 시각적 검증 (레거시 vs 마이그레이션 나란히 비교)
3. typecheck / lint / build 통과 확인

## Complexity Tracking

위반 사항 없음 — 테이블 불필요.
