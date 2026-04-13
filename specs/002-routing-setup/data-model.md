# Data Model: 라우팅 설정

**Feature**: 002-routing-setup | **Date**: 2026-04-13

## Entities

### RouteConfig

라우트 정의 데이터. React Router v7의 라우트 객체 구조.

| 필드 | 타입 | 설명 |
|------|------|------|
| path | string | URL 경로 (예: `/auth/login`) |
| element | React.LazyExoticComponent | lazy 로딩되는 페이지 컴포넌트 |
| loader | function | 라우트 진입 전 실행 (인증 가드 등) |
| children | RouteConfig[] | 중첩 라우트 |

### 라우트 계층

```
/                           → redirect /auth/login
/auth
  /login                    → LoginPage (공개)
  /signup                   → SignupPage (공개)
  /verify                   → EmailVerificationPage (공개)
  /verify-callback          → EmailVerificationCallbackPage (공개)
  /resend                   → ResendVerificationPage (공개)
/main                       → MainPage (인증 필요)
/onboarding
  /                         → OnboardingPage (인증 필요)
  /init                     → OnboardingInitPage (인증 필요)
  /calibration              → CalibrationPage (인증 필요)
  /completion               → OnboardingCompletionPage (인증 필요)
/widget                     → WidgetPage (공개, 독립 윈도우)
*                           → redirect / (404 폴백)
```

### AuthGuardState

인증 가드 판별에 사용되는 상태.

| 필드 | 타입 | 설명 |
|------|------|------|
| accessToken | string \| null | localStorage의 인증 토큰 |
| isAuthenticated | boolean | accessToken 존재 여부 |

### DeepLinkPayload

딥링크 이벤트 페이로드.

| 필드 | 타입 | 설명 |
|------|------|------|
| url | string | 딥링크 전체 URL (예: `gbgr://auth/verify-callback?token=xxx`) |
| pathname | string | URL 경로 부분 |
| searchParams | URLSearchParams | 쿼리 파라미터 |
