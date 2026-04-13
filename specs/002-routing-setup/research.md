# Research: 라우팅 설정

**Feature**: 002-routing-setup | **Date**: 2026-04-13

## R1: React Router DOM v7 마이그레이션

**Decision**: React Router DOM v7의 `createBrowserRouter` + `RouterProvider` 패턴 사용

**Rationale**: 레거시가 React Router DOM 7.9.5를 사용 중. v7에서는 `BrowserRouter` 대신 `createBrowserRouter` + `RouterProvider`가 권장 패턴이며, loader 기능으로 라우트 가드를 더 깔끔하게 구현할 수 있다. 하지만 레거시가 이미 v7을 사용 중이므로 동일한 API를 그대로 사용한다.

**Alternatives considered**:
- TanStack Router: 타입 안전성 좋지만 레거시와 다른 라우팅 방식. 마이그레이션 원칙 위반.
- React Router v6 호환 모드: v7 기능(loader 등)을 활용할 이유가 없음.

## R2: Lazy Loading 전략

**Decision**: `React.lazy` + `Suspense` 사용

**Rationale**: 레거시와 동일한 패턴. Vite가 동적 import를 자동으로 코드 스플리팅하므로 추가 설정 불필요.

**Implementation**:
```typescript
const LoginPage = lazy(() => import('@/pages/login-page'))
```
Suspense fallback은 LoadingSpinner 컴포넌트 사용.

## R3: 인증 가드 구현

**Decision**: React Router v7의 `loader` 함수로 구현

**Rationale**: 레거시가 `requireAuthLoader`를 loader로 구현. localStorage에서 accessToken을 확인하고, 없으면 `/auth/login`으로 redirect. 동일한 패턴 사용.

**Implementation**:
```typescript
export const requireAuthLoader = () => {
  const token = localStorage.getItem('accessToken')
  if (!token) return redirect('/auth/login')
  return null
}
```

## R4: Tauri 딥링크 설정

**Decision**: `@tauri-apps/plugin-deep-link` 사용, `gbgr://` 스킴 등록

**Rationale**: Tauri 2의 공식 딥링크 플러그인. 커스텀 URI 스킴을 등록하면 OS 수준에서 `gbgr://` 링크가 앱으로 라우팅된다.

**설정**:
1. `src-tauri/Cargo.toml`에 `tauri-plugin-deep-link` 의존성 추가
2. `src-tauri/tauri.conf.json`에 `plugins.deep-link.desktop.schemes: ["gbgr"]` 설정
3. `src-tauri/src/main.rs`에서 플러그인 등록
4. `src-tauri/capabilities/default.json`에 `deep-link:default` 권한 추가
5. 프론트엔드에서 `listen('deep-link://request')` 이벤트 수신 후 router.navigate

## R5: 404 폴백 처리

**Decision**: 루트 경로(`/`)로 리다이렉트

**Rationale**: 레거시의 동작 방식과 동일. 존재하지 않는 경로는 로그인 페이지로 유도하여 자연스러운 플로우 제공.

## R6: 경로 Alias 설정

**Decision**: `@/` prefix로 src 디렉토리 매핑

**Rationale**: 레거시에서 `@ui`, `@shared` 등의 alias를 사용. 마이그레이션에서는 `@/` 단일 alias로 단순화하여 FSD의 모든 레이어에 일관되게 적용. tsconfig.json paths와 vite.config.ts resolve.alias에 설정.
