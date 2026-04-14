# Implementation Plan: 인증 도메인 정식 구현

**Branch**: `003-auth-domain-implementation` | **Date**: 2026-04-13 | **Spec**: [spec.md](/home/choiho/coding/FE-migration/specs/003-auth-domain-implementation/spec.md)
**Input**: Feature specification from `/specs/003-auth-domain-implementation/spec.md`

## Summary

`migration` 앱의 기존 인증 UI와 i18n 자산을 유지한 채, 임시 `localStorage` 토큰 처리와 단순 라우트 가드를 실제 인증 세션 복구 흐름으로 대체한다. 구현은 `features/auth`에 인증 API 호출, 사용자 액션, 화면 상태 전이를 모으고, `entities/user`와 `entities/session`에 사용자/세션 모델과 저장 복구 책임을 분리하며, 레거시 Electron 앱이 사용하던 인증 API 계약과 토큰 재발급 규칙을 기준으로 Tauri + React 구조에 맞는 얇은 페이지 구성을 완성한다.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19, Rust 2021(Tauri 런타임)  
**Primary Dependencies**: React Router 7, Zustand 5, TanStack Query 5, Axios 1.x, i18next 26, Tauri 2 플러그인  
**Storage**: 브라우저 `localStorage` 기반 클라이언트 저장소, 백엔드 인증 API, Tauri deep-link 진입 정보  
**Testing**: `biome check`, `tsc --noEmit`, 수동 인증 시나리오 검증, 신규 순수 로직/스토어 단위 테스트 추가를 전제로 한 Vitest 도입  
**Target Platform**: Tauri 2 기반 데스크톱 앱(macOS/Windows/Linux)  
**Project Type**: 데스크톱 프런트엔드 애플리케이션  
**Performance Goals**: 앱 재실행 후 인증 복구 판단을 3초 이내에 마치고, 보호 화면 선노출 없이 인증 상태를 확정한다  
**Constraints**: 레거시 UI 스타일 불변, 레거시 인증 API 계약 최대 유지, 페이지는 얇게 유지, OS 부작용은 Tauri 경계 밖으로 확장하지 않음  
**Scale/Scope**: 인증 공개 라우트 5개, 보호 라우트 진입 가드, 토큰 저장/복구, 이메일 인증 및 재발송, 사용자 기본 정보 복구

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- `1. 레거시 존중`: 통과. 레거시 `src/renderer/src/entities/user/api/*`, `src/renderer/src/shared/api/instance.ts`, `src/renderer/src/shared/config/router.tsx`를 기준으로 인증 정책과 에러 코드 의미를 재사용한다.
- `2. UI 충실도 보존`: 통과. 기존 `migration/src/features/auth/ui/**`와 i18n 문구를 그대로 사용하고, 이번 계획은 시각 요소 변경 없이 상태 연결만 추가한다.
- `3. Tauri 아키텍처 준수`: 통과. 인증 도메인은 프런트엔드 API 호출과 라우팅 상태에 머물며, 새 OS 권한이나 Rust 명령 추가가 필요하지 않다.
- `4. 점진적 마이그레이션`: 통과. 인증 도메인만 우선 완료하고, 이후 온보딩/대시보드 의존 흐름은 보호 라우트 계약만 유지한 채 다음 단계로 넘긴다.
- `5. 품질 게이트 강제`: 통과. lint/typecheck와 수동 인증 회귀 시나리오를 기본 게이트로 유지하고, 새 세션/가드 로직에는 단위 테스트 가능한 순수 함수와 스토어 경계를 둔다.

Phase 1 재검토 결과도 동일하게 통과 예상이다. 설계 산출물은 레거시 정합성, UI 불변, 점진적 이전 원칙과 충돌하지 않는다.

## Project Structure

### Documentation (this feature)

```text
specs/003-auth-domain-implementation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-http-contract.yaml
└── tasks.md
```

### Source Code (repository root)

```text
migration/
├── src/
│   ├── app/
│   │   ├── layouts/
│   │   └── providers/
│   ├── pages/
│   │   ├── login-page/
│   │   ├── signup-page/
│   │   ├── email-verification-page/
│   │   ├── email-verification-callback-page/
│   │   ├── resend-verification-page/
│   │   ├── main-page/
│   │   └── onboarding-*/
│   ├── features/
│   │   └── auth/
│   │       ├── api/
│   │       ├── model/
│   │       ├── lib/
│   │       └── ui/
│   ├── entities/
│   │   ├── user/
│   │   │   ├── api/
│   │   │   ├── model/
│   │   │   └── types/
│   │   └── session/
│   │       ├── model/
│   │       └── lib/
│   ├── shared/
│   │   ├── api/
│   │   ├── config/
│   │   ├── lib/
│   │   └── ui/
│   └── main.tsx
└── src-tauri/
    ├── src/
    └── capabilities/
```

**Structure Decision**: 단일 `migration/` 앱 안에서 FSD 구조를 유지한다. 페이지는 라우트 진입과 조합만 맡고, 인증 요청과 상태 전이는 `features/auth`가 소유한다. `entities/user`, `entities/session`은 사용자/세션 영속화와 복구 모델을 맡고, 공통 HTTP 클라이언트와 라우터 어댑터는 `shared`에 둔다.

## Phase 0: Research Plan

- 레거시 인증 API 계약과 에러 코드(`AUTH-101`, `AUTH-102`)를 migration에서 어떻게 재사용할지 정리한다.
- React Router 7 환경에서 인증 복구 중 보호 화면 선노출을 막는 가드 패턴을 결정한다.
- 로그인 성공, 미인증 로그인, 회원가입, 인증 콜백, 재발송 흐름별 저장 키와 상태 정리 규칙을 정한다.
- `localStorage.clear()` 같은 광범위 정리 대신 인증 키만 정리하는 기준을 정한다.
- 콜백 URL과 Tauri deep-link 공존 시나리오를 인증 화면 기준으로 어떻게 수용할지 정한다.

## Phase 1: Design Plan

- 인증 세션, 가입 초안 사용자, 이메일 인증 요청, 보호 경로 의도를 데이터 모델로 구체화한다.
- 백엔드와의 HTTP 계약을 `contracts/auth-http-contract.yaml`에 정리한다.
- 구현 순서와 수동 검증 흐름을 `quickstart.md`에 정리한다.
- 문서 설계 이후 `update-agent-context.sh codex`로 에이전트 컨텍스트를 갱신한다.

## Complexity Tracking

현재 헌법 위반이나 별도 정당화가 필요한 복잡도 증가는 없다.
