# Implementation Plan: 메인 페이지 이관

**Branch**: `006-main-page-migration` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-main-page-migration/spec.md`

## Summary

레거시 Electron 앱의 메인 페이지(대시보드)를 Tauri + React 앱으로 이관한다.
메인 전용 헤더, 2열 그리드 레이아웃(좌측 대시보드/우측 웹캠+러닝), 8개 핵심 패널, 독립 스크롤, 알림 모달, 웹캠 기본 상호작용을 레거시와 동일하게 복원한다.
복잡한 데이터 연동, 자세 분석 엔진 전환, 위젯 창 제어는 후속 단계로 분리한다.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19.1, Rust 2021 (Tauri 런타임)
**Primary Dependencies**: React Router DOM 7, Zustand 5, TanStack Query 5, Tailwind CSS 4.2.2, clsx + tailwind-merge, i18next 26, @tauri-apps/api 2
**Storage**: localStorage (accessToken, refreshToken, theme), sessionStorage (notification settings)
**Testing**: Vitest 4.1.4 + React Testing Library
**Target Platform**: Windows/macOS/Linux 데스크톱 (Tauri 2)
**Project Type**: 데스크톱 앱 (Tauri + React)
**Performance Goals**: 60fps 스크롤, 패널 독립 렌더링
**Constraints**: UI 스타일 변경 금지, 레거시 충실도 100%
**Scale/Scope**: 메인 페이지 1개 화면, 8개 패널 컴포넌트, 2개 모달

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 1. 레거시 존중 ✅ PASS
- `src/` 코드는 읽기 전용으로 분석만 수행
- 레거시 비즈니스 로직, 임계값, 분류 알고리즘은 동일하게 포팅
- PR에 원본 파일 경로와 라인 명시 예정

### 2. UI 충실도 보존 ✅ PASS
- 색상, 간격, 타이포그래피, 레이아웃, 애니메이션 레거시와 동일 유지
- 디자인 토큰은 레거시 CSS/Tailwind에서 추출하여 이관
- before/after 스크린샷으로 시각 검증 예정

### 3. Tauri 아키텍처 준수 ✅ PASS
- 웹 MediaPipe 자세 분석 파이프라인은 임의로 Python으로 전환하지 않음 (spec FR-010)
- 프론트엔드에서 직접 시스템 API 호출 없음
- 자세 분석 엔진 전환은 별도 스펙으로 분리

### 4. 점진적 마이그레이션 ✅ PASS
- 메인 페이지 단위로 이관 (기능 단위 포팅)
- Zustand 클라이언트 상태 → Zustand 유지
- TanStack Query 서버 상태 → TanStack Query 유지
- 의존성 그래프 기반 순서: 인증(003) → 공통 UI(004) → 앱 레이아웃(005) → 메인 페이지(006)

### 5. 품질 게이트 강제 ✅ PASS
- lint, typecheck, 빌드 실패 시 merge 불가
- 핵심 로직(레이아웃 조합, 패널 상태)은 회귀 위험에 따라 테스트 추가
- 단순 마크업 이관은 수동 검증으로 충분

**GATE RESULT**: ✅ ALL PASS — Phase 0 진행

## Project Structure

### Documentation (this feature)

```text
specs/006-main-page-migration/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
migration/src/
├── pages/
│   ├── main-page/              # 메인 페이지 진입점 (수정)
│   │   └── index.tsx
│   └── dashboard-page/         # 대시보드 페이지 (수정)
│       └── index.tsx
├── features/
│   ├── dashboard/              # 대시보드 기능 모듈 (신규)
│   │   ├── ui/
│   │   │   ├── MainContent.tsx          # 메인 2열 그리드 컨테이너
│   │   │   ├── LeftPanelArea.tsx        # 좌측 대시보드 스크롤 영역
│   │   │   └── RightPanelArea.tsx       # 우측 웹캠/러닝 스크롤 영역
│   │   └── model/
│   │       └── use-main-page.ts         # 메인 페이지 조합 훅
│   ├── main-panels/            # 메인 패널 컴포넌트 (신규)
│   │   ├── ui/
│   │   │   ├── AveragePosturePanel.tsx  # 평균 자세 점수
│   │   │   ├── AttendancePanel.tsx      # 출석 현황
│   │   │   ├── TotalDistancePanel.tsx   # 이동거리
│   │   │   ├── AverageGraphPanel.tsx    # 평균 그래프
│   │   │   ├── HighlightsPanel.tsx      # 하이라이트
│   │   │   ├── PosePatternPanel.tsx     # 자세 패턴
│   │   │   ├── WebcamPanel.tsx          # 웹캠
│   │   │   └── MiniRunningPanel.tsx     # 러닝 요약
│   │   └── model/
│   │       ├── use-camera-store.ts      # 웹캠 상태 스토어
│   │       └── types.ts                 # 패널 공통 타입
│   ├── layout/                 # 레이아웃 기능 (기존, 수정)
│   │   ├── ui/
│   │   │   └── DashboardHeader.tsx      # 대시보드 헤더 (수정)
│   │   └── model/
│   │       └── use-navigation-tabs.ts   # 네비게이션 탭 (기존)
│   └── notification-settings/  # 알림 설정 (기존, 재사용)
│       └── ui/
│           └── NotificationModal.tsx
├── shared/
│   ├── styles/
│   │   ├── scrollbar.css               # 커스텀 스크롤바 스타일 (신규)
│   │   ├── colors.css                  # 기존 색상 토큰 (필요시 보강)
│   │   ├── typography.css              # 기존 타이포그래피 (필요시 보강)
│   │   └── breakpoint.css              # 기존 브레이크포인트
│   └── ui/
│       ├── panel-header/               # 기존 패널 헤더 (재사용)
│       ├── modal/                      # 기존 모달 (재사용)
│       └── icons/                      # 기존 아이콘 (필요시 추가)
└── entities/
    ├── dashboard/              # 대시보드 데이터 엔티티 (신규/보강)
    │   ├── model/
    │   │   ├── use-average-score-query.ts
    │   │   ├── use-attendance-query.ts
    │   │   ├── use-level-query.ts
    │   │   ├── use-posture-graph-query.ts
    │   │   ├── use-highlight-query.ts
    │   │   └── use-posture-pattern-query.ts
    │   └── api/
    │       └── dashboard-api.ts
    └── session/                # 세션 엔티티 (신규/보강)
        ├── model/
        │   ├── use-create-session-mutation.ts
        │   ├── use-stop-session-mutation.ts
        │   ├── use-resume-session-mutation.ts
        │   └── use-pause-session-mutation.ts
        └── api/
            └── session-api.ts
```

**Structure Decision**: Feature-Sliced Design(FSD) 아키텍처를 따른다. 기존 마이그레이션 앱의 `features/`, `entities/`, `shared/`, `pages/` 구조를 그대로 확장한다. 메인 패널 컴포넌트는 `features/main-panels/`에 모아 관리하고, 대시보드 레이아웃 조합은 `features/dashboard/`에서 담당한다. 데이터 페칭은 `entities/dashboard/`와 `entities/session/`에 쿼리/뮤테이션으로 분리한다.

## Complexity Tracking

> 이번 스펙에서는 Constitution Check 위반이 없으므로 별도 기록 불필요.
