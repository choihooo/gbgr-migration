# Tasks: 라우팅 설정

**Input**: Design documents from `/specs/002-routing-setup/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: 이 스펙은 수동 검증으로 확인하므로 테스트 태스크를 포함하지 않는다. 검증 방법은 quickstart.md 참조.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Tauri app**: `migration/src/` (frontend), `migration/src-tauri/` (backend)

---

## Phase 1: Setup (의존성 설치)

**Purpose**: 라우팅에 필요한 패키지 설치 및 설정

- [x] T001 `bun add react-router-dom` 실행하여 React Router DOM 설치 — `migration/package.json`
- [x] T002 `tsconfig.json`에 `@/` 경로 alias 추가 — `migration/tsconfig.json`에 `paths: { "@/*": ["./src/*"] }` 설정, `migration/vite.config.ts`에 `resolve.alias` 추가

**Checkpoint**: `bun install` 성공, `import '@/pages/...'` 경로가 타입체크 통과

---

## Phase 2: Foundational (라우터 인프라)

**Purpose**: 모든 유저 스토리의 전제가 되는 라우터 설정, 레이아웃, 가드 구현

**⚠️ CRITICAL**: 이 Phase가 완료되어야 이후 페이지 연결 작업 시작 가능

- [x] T003 `.gitkeep` 제거 후 각 페이지에 placeholder 컴포넌트 생성 — 11개 페이지 모두 `export default function XxxPage() { return <div>Xxx Page</div> }` 형식. 파일 경로: `migration/src/pages/*/index.tsx`
- [x] T004 `migration/src/shared/config/router.tsx` 작성 — `createBrowserRouter`로 라우트 트리 정의, lazy import 헬퍼 함수 작성. 빈 라우트 트리 구조만 먼저 생성 (children 없이 skeleton). 레거시 참조: `src/renderer/src/shared/config/router.tsx`
- [x] T005 `migration/src/shared/config/router.tsx`에 인증 가드 로직 추가 — `requireAuthLoader`: localStorage에서 accessToken 확인 후 없으면 `/auth/login`으로 redirect, 있으면 null 반환. `redirectIfAuthLoader`: accessToken 있으면 `/main`으로 redirect. 레거시 참조: `src/renderer/src/shared/config/router.tsx`의 requireAuthLoader
- [x] T006 `migration/src/app/layouts/RootLayout.tsx` 작성 — `<Suspense fallback={<LoadingSpinner />}>` 로 lazy 컴포넌트 감싸는 레이아웃. `<Outlet />`으로 자식 라우트 렌더링
- [x] T007 `migration/src/app/providers/router-provider.tsx` 작성 — `RouterProvider`를 감싸는 프로바이더 컴포넌트. `createBrowserRouter` 결과를 `router` prop으로 전달
- [x] T008 `migration/src/main.tsx` 수정 — App 컴포넌트 대신 `RouterProvider`를 직접 마운트하도록 변경. `import './style.css'` 유지

**Checkpoint**: `bun run lint:check && bunx tsc --noEmit` 통과. 라우터 인프라가 준비됨.

---

## Phase 3: User Story 1 - 공개 페이지 라우팅 (Priority: P1) 🎯 MVP

**Goal**: 인증 없이 접근 가능한 5개 페이지(`/auth/*`, `/`)가 정상 라우팅됨

**Independent Test**: `bun run tauri dev` 실행 후 `/auth/login`, `/auth/signup`, `/auth/verify`, `/auth/verify-callback`, `/auth/resend` URL로 접근 시 각 페이지 컴포넌트가 렌더링됨. `/` 접근 시 `/auth/login`으로 리다이렉트.

### Implementation for User Story 1

- [x] T009 [US1] `migration/src/shared/config/router.tsx`에 공개 라우트 추가 — lazy import로 LoginPage, SignupPage, EmailVerificationPage, EmailVerificationCallbackPage, ResendVerificationPage 로드. `/auth/login`, `/auth/signup`, `/auth/verify`, `/auth/verify-callback`, `/auth/resend` 경로 매핑. `/` 경로는 `/auth/login`으로 redirect
- [x] T010 [US1] 공개 라우트 동작 검증 — `bun run tauri dev` 실행 후 각 URL 접근하여 페이지 렌더링 확인. `/` 접근 시 리다이렉트 확인

**Checkpoint**: 5개 공개 페이지가 URL로 접근 가능하고 서로 이동 가능

---

## Phase 4: User Story 2 - 인증 보호 라우트 (Priority: P2)

**Goal**: 인증 토큰 없이 보호된 경로 접근 시 로그인 페이지로 리다이렉트, 토큰 있으면 정상 표시

**Independent Test**: localStorage accessToken 없이 `/main` 접근 → `/auth/login` 리다이렉트. accessToken 설정 후 `/main` 접근 → 메인 페이지 표시. accessToken 있을 때 `/auth/login` 접근 → `/main` 리다이렉트.

### Implementation for User Story 2

- [x] T011 [US2] `migration/src/shared/config/router.tsx`에 보호 라우트 추가 — `/main` 경로에 `requireAuthLoader` 적용, MainPage lazy import. `/auth/*` 라우트에 `redirectIfAuthLoader` 적용 (이미 로그인된 사용자는 `/main`으로)
- [x] T012 [US2] 인증 가드 동작 검증 — localStorage accessToken 제거 후 `/main` 접근 → 리다이렉트 확인. accessToken 설정 후 `/main` 접근 → 페이지 표시. accessToken 있을 때 `/auth/login` 접근 → `/main` 리다이렉트

**Checkpoint**: 인증 가드가 올바르게 동작하여 보호된 페이지 접근을 제어함

---

## Phase 5: User Story 3 - 온보딩 플로우 라우팅 (Priority: P3)

**Goal**: 온보딩 4개 페이지가 인증 가드 하에 정상 라우팅됨

**Independent Test**: accessToken 설정 후 `/onboarding`, `/onboarding/init`, `/onboarding/calibration`, `/onboarding/completion` URL 접근 시 각 페이지 표시

### Implementation for User Story 3

- [x] T013 [US3] `migration/src/shared/config/router.tsx`에 온보딩 라우트 추가 — `/onboarding` (중첩 라우트), `/onboarding/init`, `/onboarding/calibration`, `/onboarding/completion` 경로에 lazy import. 부모 `/onboarding`에 `requireAuthLoader` 적용하여 모든 자식 라우트가 인증 필요
- [x] T014 [US3] 온보딩 라우트 동작 검증 — accessToken 없이 `/onboarding` 접근 → `/auth/login` 리다이렉트. accessToken 있으면 각 온보딩 페이지 정상 표시

**Checkpoint**: 온보딩 플로우 라우트가 인증 가드와 함께 동작

---

## Phase 6: User Story 4 - 위젯 라우트 (Priority: P4)

**Goal**: `/widget` 경로에서 위젯 전용 페이지가 인증 없이 표시됨

**Independent Test**: accessToken 없이 `/widget` 접근 → 위젯 페이지 정상 표시 (가드 없음)

### Implementation for User Story 4

- [x] T015 [US4] `migration/src/shared/config/router.tsx`에 위젯 라우트 추가 — `/widget` 경로에 WidgetPage lazy import. 인증 가드 없이 공개 접근 허용
- [x] T016 [US4] 위젯 라우트 동작 검증 — accessToken 없이 `/widget` 접근 → 페이지 정상 표시

**Checkpoint**: 위젯 라우트가 인증 없이 독립 동작

---

## Phase 7: User Story 5 - 딥링크 설정 (Priority: P5)

**Goal**: `gbgr://` 스킴으로 외부 링크에서 앱 내 페이지로 바로 이동 가능

**Independent Test**: `gbgr://auth/verify-callback?token=xxx` 딥링크 처리 후 올바른 라우트로 이동

### Implementation for User Story 5

- [x] T017 [US5] `migration/src-tauri/Cargo.toml`에 딥링크 플러그인 의존성 추가 — `tauri-plugin-deep-link` 추가
- [x] T018 [US5] `migration/src-tauri/tauri.conf.json`에 딥링크 스킴 설정 — `plugins.deep-link.desktop.schemes: ["gbgr"]` 추가
- [x] T019 [US5] `migration/src-tauri/src/lib.rs`에 딥링크 플러그인 등록 — `.plugin(tauri_plugin_deep_link::init())` 추가, deep-link 이벤트를 프론트엔드로 전달하도록 설정
- [x] T020 [US5] `migration/src-tauri/capabilities/default.json`에 딥링크 권한 추가 — `"deep-link:default"` 퍼미션 추가
- [x] T021 [US5] `migration/src/shared/lib/deep-link.ts` 작성 — Tauri deep-link 이벤트 리스너. URL 파싱 후 `router.navigate`로 라우트 이동
- [x] T022 [US5] 딥링크 리스너를 앱 진입점에 연결 — `migration/src/main.tsx` 또는 `router-provider.tsx`에서 deep-link 리스너 초기화
- [x] T023 [US5] 딥링크 동작 검증 — OS에 스킴 등록 후 `gbgr://auth/verify-callback?token=test` 링크로 앱 열기 테스트 (로컬에서는 이벤트 emit로 대체 가능)

**Checkpoint**: 딥링크로 앱이 실행되고 올바른 라우트로 이동

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 404 처리, 최종 품질 검증

- [x] T024 [P] `migration/src/shared/config/router.tsx`에 404 폴백 라우트 추가 — `path: "*"` 라우트를 `/`로 redirect. 모든 라우트 정의 후 마지막에 추가
- [x] T025 전체 라우팅 품질 게이트 — `bun run lint:check && bunx tsc --noEmit && bun run build` 성공 확인. quickstart.md의 모든 검증 시나리오 수행

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 3 completion (같은 router.tsx 파일 수정)
- **User Story 3 (Phase 5)**: Depends on Phase 4 completion (같은 router.tsx 파일 수정)
- **User Story 4 (Phase 6)**: Depends on Phase 5 completion (같은 router.tsx 파일 수정)
- **User Story 5 (Phase 7)**: Depends on Phase 2 (다른 파일이므로 Phase 3-6과 병렬 가능)
- **Polish (Phase 8)**: Depends on all user stories being complete

### Within Each Phase

- Phase 1: T001, T002 are parallel (different files)
- Phase 2: T003 (placeholder 페이지)이 먼저 완료되어야 lazy import 대상이 존재함. T004-T008은 T003 이후 병렬 가능
- Phase 3-6: Sequential (모두 같은 router.tsx 수정)
- Phase 7: T017-T020은 Rust/Tauri 설정 (프론트엔드와 병렬), T021-T022는 프론트엔드 (Phase 8 이전 완료)

---

## Parallel Example: Phase 2

```bash
# 먼저 placeholder 페이지 생성:
Task: "T003 - 11개 placeholder 페이지 컴포넌트 생성"

# 그 다음 라우터 인프라 병렬 작업:
Task: "T004 - router.tsx 스켈레톤 작성"
Task: "T005 - 인증 가드 로직 추가"
Task: "T006 - RootLayout.tsx 작성"
Task: "T007 - router-provider.tsx 작성"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (의존성 설치)
2. Complete Phase 2: Foundational (라우터 인프라)
3. Complete Phase 3: User Story 1 (공개 페이지 라우팅)
4. **STOP and VALIDATE**: 5개 공개 페이지가 URL로 접근 가능한지 확인

### Incremental Delivery

1. Setup + Foundational → 라우터 인프라 준비 완료
2. User Story 1 → 공개 페이지 라우팅 (MVP)
3. User Story 2 → 인증 가드 추가
4. User Story 3 → 온보딩 라우트 추가
5. User Story 4 → 위젯 라우트 추가
6. User Story 5 → 딥링크 연동 (Phase 3-6과 병렬 가능)
7. Polish → 404 처리 + 최종 검증

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- 모든 유저 스토리가 같은 `router.tsx` 파일을 수정하므로 Phase 3-6은 순차 실행
- Phase 7 (딥링크)은 Rust/Tauri 설정이므로 프론트엔드 라우팅 작업과 병렬 가능
- 레거시 코드(`src/`)는 수정하지 않음 (헌법 원칙 1)
- placeholder 페이지 컴포넌트는 실제 UI를 포함하지 않음 (후속 스펙에서 구현)
