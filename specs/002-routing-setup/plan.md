# Implementation Plan: 라우팅 설정

**Branch**: `002-routing-setup` | **Date**: 2026-04-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-routing-setup/spec.md`

## Summary

레거시 Electron 앱의 React Router 설정을 Tauri + React 앱으로 이관한다. 11개 페이지 라우트, 인증 가드, lazy loading, 딥링크 처리를 구현한다. 레거시 라우터 설정(`src/renderer/src/shared/config/router.tsx`)을 기반으로 동일한 라우트 구조와 가드 로직을 `migration/`에 구축한다.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 19, React Router DOM 7, @tauri-apps/api, @tauri-apps/plugin-deep-link
**Storage**: localStorage (accessToken, refreshToken)
**Testing**: 수동 검증 (URL 접근, 리다이렉트 동작)
**Target Platform**: Tauri 2 데스크톱 (Windows, macOS)
**Project Type**: desktop-app
**Performance Goals**: lazy loading으로 초기 번들 최소화
**Constraints**: 레거시 라우트 구조와 1:1 대응
**Scale/Scope**: 11개 라우트, 5개 유저 스토리

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 상태 | 근거 |
|------|------|------|
| 1. 레거시 존중 | PASS | 레거시 router.tsx의 라우트 구조, 가드 로직, lazy loading 패턴을 그대로 이관 |
| 2. UI 충실도 보존 | PASS | 라우팅은 동작 계층이므로 UI 변경 없음 |
| 3. Tauri 아키텍처 준수 | PASS | 딥링크는 Tauri 플러그인 API 사용, 프론트엔드는 React Router |
| 4. 점진적 마이그레이션 | PASS | 라우팅은 모든 기능의 기반이므로 우선 이관 |
| 5. 품질 게이트 강제 | PASS | lint, typecheck, build 통과 필수 |

## Project Structure

### Documentation (this feature)

```text
specs/002-routing-setup/
├── plan.md              # 이 파일
├── research.md          # Phase 0 출력
├── data-model.md        # Phase 1 출력
├── quickstart.md        # Phase 1 출력
└── tasks.md             # Phase 2 출력 (/speckit.tasks)
```

### Source Code (repository root)

```text
migration/src/
├── app/
│   ├── layouts/
│   │   └── RootLayout.tsx          # 공통 레이아웃 (Suspense 포함)
│   └── providers/
│       └── router-provider.tsx     # BrowserRouter + 라우트 정의
├── pages/
│   ├── login-page/index.tsx        # /auth/login
│   ├── signup-page/index.tsx       # /auth/signup
│   ├── email-verification-page/index.tsx        # /auth/verify
│   ├── email-verification-callback-page/index.tsx # /auth/verify-callback
│   ├── resend-verification-page/index.tsx       # /auth/resend
│   ├── main-page/index.tsx         # /main
│   ├── calibration-page/index.tsx  # /onboarding/calibration
│   ├── onboarding-page/index.tsx   # /onboarding
│   ├── onboarding-init-page/index.tsx           # /onboarding/init
│   ├── onboarding-completion-page/index.tsx     # /onboarding/completion
│   └── widget-page/index.tsx       # /widget
├── shared/
│   ├── config/
│   │   └── router.tsx              # 라우트 설정, lazy import, 가드
│   └── lib/
│       └── deep-link.ts            # 딥링크 리스너 유틸
└── main.tsx                        # App 진입점
```

**Structure Decision**: FSD 레이어 구조 유지. 라우터 설정은 `shared/config/`, 페이지 컴포넌트는 `pages/`, 레이아웃과 프로바이더는 `app/`에 배치. 레거시와 동일한 구조.
