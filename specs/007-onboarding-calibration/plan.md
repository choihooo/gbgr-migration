# Implementation Plan: 온보딩/보정 도메인 이관

**Branch**: `007-onboarding-calibration` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-onboarding-calibration/spec.md`

## Summary

레거시 Electron 앱의 온보딩/보정 흐름 4개 페이지(onboarding-init, onboarding, calibration, onboarding-completion)와 보정 상태 판별 로직(CalibrationGate)을 Tauri + React 마이그레이션 앱으로 이관한다. 자세 측정 파이프라인(MediaPipe)은 후속 스펙(008)에서 다루며, 이번에는 UI 컴포넌트, 화면 전환, 상태 관리, 라우팅 가드에 집중한다.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19.1, Rust 2021 (Tauri 런타임)
**Primary Dependencies**: React Router DOM 7, Zustand 5, TanStack Query 5, i18next 26, Tailwind CSS 4.2.2, clsx + tailwind-merge, react-webcam (신규 추가 필요)
**Storage**: localStorage (accessToken, refreshToken, calibration_gate_v1, calibration_result_v1, userId, sessionStartDistance, preferredCameraDeviceId, GA 관련 키)
**Testing**: Vitest 4.1.4 (회귀 리스크 높은 로직에 한해 단위 테스트)
**Target Platform**: Windows/macOS/Linux (Tauri 2 데스크톱 앱)
**Project Type**: Desktop App (Tauri + React)
**Performance Goals**: 레거시와 동등한 UI 응답성, 슬라이드 전환 애니메이션 60fps
**Constraints**: UI 스타일 변경 금지, 측정 엔진 미연결 시 버튼 비활성화
**Scale/Scope**: 4개 페이지, 약 15개 컴포넌트, 17개 에셋, 1개 공유 유틸리티

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 상태 | 비고 |
|------|------|------|
| 1. 레거시 존중 | PASS | `src/` 수정 없음, 레거시 로직/임계값 동일 포팅 |
| 2. UI 충실도 보존 | PASS | 레거시 CSS 클래스, 레이아웃, 에셋 그대로 이관 |
| 3. Tauri 아키텍처 준수 | PASS | 프론트엔드 UI만 이관, OS 부작용 없음, 측정 엔진 전환은 008에서 분리 |
| 4. 점진적 마이그레이션 | PASS | 온보딩/보정 기능 단위 이관, 이전 스펙(003~006) 의존 |
| 5. 품질 게이트 강제 | PASS | lint/typecheck/build 필수, 핵심 로직(CalibrationGate) 단위 테스트 |

**게이트 결과**: PASS. 위반 없음.

## Project Structure

### Documentation (this feature)

```text
specs/007-onboarding-calibration/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
migration/
├── src/
│   ├── app/
│   │   ├── providers/           # 기존: ThemeProvider, I18nProvider, RouterProvider
│   │   └── layouts/             # 기존: AppLayout, AuthLayout
│   ├── entities/
│   │   ├── session/             # 기존: use-session-mutations.ts (createSession)
│   │   ├── user/                # 기존: userId, userName
│   │   └── dashboard/           # 기존: useLevelQuery
│   ├── features/
│   │   ├── auth/                # 기존: use-auth-redirect.ts (수정 필요)
│   │   └── dashboard/           # 기존
│   ├── pages/
│   │   ├── onboarding-init-page/    # placeholder → 전체 구현
│   │   │   └── index.tsx
│   │   ├── onboarding-page/         # placeholder → 전체 구현
│   │   │   └── components/
│   │   │       ├── CameraPermissionButton.tsx
│   │   │       ├── FirstImageDescription.tsx
│   │   │       ├── ImageDescriptionPanel.tsx
│   │   │       └── InfoPanel.tsx
│   │   ├── calibration-page/        # placeholder → 전체 구현
│   │   │   └── components/
│   │   │       ├── MeasuringPanel.tsx
│   │   │       ├── WebcamView.tsx
│   │   │       └── WelcomePanel.tsx
│   │   └── onboarding-completion-page/  # placeholder → 전체 구현
│   │       └── index.tsx
│   ├── shared/
│   │   ├── config/
│   │   │   └── router.tsx           # 기존: onboarding 라우트 (CalibrationRouteGuard 래핑 필요)
│   │   ├── lib/
│   │   │   ├── calibration-gate.ts  # 신규: 보정 상태 판별 유틸리티
│   │   │   └── i18n/                # 기존: 번역 리소스 (키 추가)
│   │   ├── ui/                      # 기존: Button, Timer, NotificationMessage 등
│   │   └── styles/                  # 기존: 글로벌 스타일
│   └── assets/
│       └── onboarding/              # 신규: 레거시 에셋 복사
│           ├── images/              # 5단계 슬라이드 이미지 (light/dark)
│           └── icons/               # progress, prev, rock, giraffe, turtle SVG
└── src-tauri/                       # 변경 없음
```

**Structure Decision**: 기존 FSD(Feature-Sliced Design) 아키텍처를 그대로 따른다. 온보딩 관련 컴포넌트는 각 page 폴더 내 `components/`에 배치하고, 공유 유틸리티(calibration-gate)는 `shared/lib/`에 둔다.
