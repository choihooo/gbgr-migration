# Tasks: 인증 도메인 정식 구현

**Input**: Design documents from `/specs/003-auth-domain-implementation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: 인증 세션 복구, 라우트 가드, 토큰 정리, 이메일 인증 콜백은 회귀 위험이 높으므로 단위 테스트와 수동 시나리오 검증 작업을 포함한다.

**Organization**: 사용자 스토리별로 작업을 묶어 각 스토리가 독립적으로 구현·검증 가능하도록 구성한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능
- **[Story]**: 해당 사용자 스토리 라벨
- 각 작업 설명에는 정확한 파일 경로를 포함한다

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 인증 도메인 구현을 위한 테스트/구조 기본판을 준비한다.

- [X] T001 `migration/package.json`, `migration/vitest.config.ts`, `migration/tsconfig.json`에 Vitest 실행 스크립트와 테스트 설정을 추가한다
- [X] T002 [P] `migration/tests/setup/auth-test-storage.ts`와 `migration/tests/setup/router-test-utils.tsx`에 로컬 스토리지/라우터 테스트 유틸을 만든다
- [X] T003 [P] `migration/src/shared/lib/auth/storage-keys.ts`와 `migration/src/shared/lib/auth/index.ts`에 인증 저장 키 상수를 정의한다

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 사용자 스토리가 공통으로 의존하는 인증 세션 기반을 만든다.

**⚠️ CRITICAL**: 이 단계가 끝나야 사용자 스토리 작업을 시작할 수 있다.

- [X] T004 `migration/src/shared/api/instance.ts`에 레거시 계약 기반 Axios 인스턴스, 토큰 주입, `AUTH-101`/`AUTH-102` 재발급 처리 로직을 구현한다
- [X] T005 [P] `migration/src/entities/session/model/use-auth-session-store.ts`와 `migration/src/entities/session/index.ts`에 인증 세션 Zustand 스토어를 구현한다
- [X] T006 [P] `migration/src/entities/user/types/auth.ts`, `migration/src/entities/user/types/index.ts`에 로그인·회원가입·인증 응답 타입을 정의한다
- [X] T007 [P] `migration/src/entities/user/model/use-auth-email-store.ts`를 persist 구조로 확장하고 `migration/src/entities/user/model/use-auth-user-store.ts`를 추가해 가입 이메일/사용자 기본 정보 저장 모델을 분리한다
- [X] T008 `migration/src/features/auth/lib/session-persistence.ts`와 `migration/src/features/auth/lib/auth-error.ts`에 인증 키 저장·정리와 에러 분류 유틸을 구현한다
- [X] T009 `migration/src/features/auth/model/use-auth-bootstrap.ts`와 `migration/src/app/providers/auth-provider.tsx`에 앱 시작 시 인증 하이드레이션 훅과 프로바이더를 구현한다
- [X] T010 `migration/src/shared/config/router.tsx`와 `migration/src/app/providers/router-provider.tsx`를 갱신해 보호 경로 저장, 인증 복구 중간 상태, 공개/보호 라우트 교정 흐름을 연결한다
- [X] T011 [P] `migration/tests/unit/shared/api/instance.test.ts`, `migration/tests/unit/entities/session/use-auth-session-store.test.ts`, `migration/tests/unit/shared/config/router-auth.test.tsx`에 공통 인증 기반 단위 테스트를 추가한다

**Checkpoint**: 공통 인증 세션, 저장소, 가드, 테스트 기반이 준비되어 각 사용자 스토리를 독립적으로 구현할 수 있다.

---

## Phase 3: User Story 1 - 기존 계정으로 안전하게 로그인한다 (Priority: P1) 🎯 MVP

**Goal**: 기존 사용자가 로그인하거나 저장된 세션을 복구해 보호 화면으로 진입할 수 있게 한다.

**Independent Test**: 저장된 인증 정보가 없는 상태와 있는 상태에서 `/main` 또는 보호 경로 진입 시 로그인 화면/복구 경로가 올바르게 분기되고, 로그인 성공 후 원래 요청한 보호 경로로 복귀해야 한다.

### Tests for User Story 1

- [X] T012 [P] [US1] `migration/tests/unit/features/auth/login-flow.test.ts`에 로그인 성공, 미인증 로그인, 인증 실패 분기 테스트를 추가한다
- [X] T013 [P] [US1] `migration/tests/unit/features/auth/session-restore.test.ts`에 저장 세션 복구 성공/만료/재발급 실패 테스트를 추가한다

### Implementation for User Story 1

- [X] T014 [P] [US1] `migration/src/features/auth/api/auth-api.ts`와 `migration/src/features/auth/api/use-login-mutation.ts`에 로그인 요청, `/users/me` 복구, 미인증 로그인 분기 처리를 구현한다
- [X] T015 [P] [US1] `migration/src/features/auth/model/use-login-form.ts`와 `migration/src/features/auth/model/use-auth-redirect.ts`에 로그인 폼 상태, 아이디 저장, 보호 경로 복귀 로직을 구현한다
- [X] T016 [US1] `migration/src/features/auth/ui/login/components/LoginForm.tsx`를 새 로그인 모델과 연결하고 임시 `temporary-auth-token` 처리 및 직접 `localStorage` 토큰 저장을 제거한다
- [X] T017 [US1] `migration/src/shared/config/router.tsx`, `migration/src/pages/login-page/index.tsx`, `migration/src/pages/main-page/index.tsx`에 로그인 완료 후 보호 경로 우선 복귀와 보호 라우트 차단 UI를 반영한다
- [X] T018 [US1] `migration/src/shared/lib/i18n/resources.ts`에 로그인 실패, 세션 만료, 미인증 로그인 안내 문구를 추가한다

**Checkpoint**: User Story 1은 단독으로 로그인, 세션 복구, 보호 라우트 접근 제어를 완성하며 MVP로 시연 가능해야 한다.

---

## Phase 4: User Story 2 - 신규 사용자가 가입 후 이메일 인증을 완료한다 (Priority: P2)

**Goal**: 신규 사용자가 회원가입을 완료하고 이메일 인증 콜백을 통해 계정을 활성화한 뒤 로그인 흐름으로 이어질 수 있게 한다.

**Independent Test**: 회원가입 유효성 검사와 이메일 중복 확인을 통과한 뒤 `/auth/verify`로 이동하고, `token`이 있는 `/auth/verify-callback`에서 성공/실패가 구분되어 표시되어야 한다.

### Tests for User Story 2

- [X] T019 [P] [US2] `migration/tests/unit/features/auth/signup-flow.test.ts`에 이메일 중복 확인, 가입 제출, 가입 이메일 저장 테스트를 추가한다
- [X] T020 [P] [US2] `migration/tests/unit/features/auth/verify-callback.test.tsx`에 토큰 1회 처리와 인증 성공/실패 콜백 상태 테스트를 추가한다

### Implementation for User Story 2

- [X] T021 [P] [US2] `migration/src/features/auth/api/use-signup-mutation.ts`와 `migration/src/features/auth/api/use-verify-email-mutation.ts`를 추가해 레거시 계약 기반 회원가입/이메일 인증 API 훅을 구현한다
- [X] T022 [P] [US2] `migration/src/features/auth/model/use-signup-form.ts`와 `migration/src/features/auth/model/use-email-verification-callback.ts`에 회원가입 제출, 가입 이메일 보존, 콜백 처리 상태 전이를 구현한다
- [X] T023 [US2] `migration/src/features/auth/ui/signup/components/SignUpForm.tsx`를 새 회원가입 모델과 연결하고 실제 이메일 중복 확인/가입 요청으로 교체한다
- [X] T024 [US2] `migration/src/pages/email-verification-page/index.tsx`와 `migration/src/features/auth/ui/signup/components/EmailHeroSection.tsx`에 가입 직후 이메일 인증 대기 상태를 연결한다
- [X] T025 [US2] `migration/src/pages/email-verification-callback-page/index.tsx`를 토큰 처리형 콜백 화면으로 바꾸고 성공/실패 상태를 i18n 문구와 연결한다
- [X] T026 [US2] `migration/src/shared/lib/i18n/resources.ts`에 회원가입/인증 콜백 실패 및 안내 문구를 보강한다

**Checkpoint**: User Story 2는 단독으로 회원가입부터 이메일 인증 콜백 결과 표시까지 완료되어야 하며, 로그인 자동화 없이 레거시 흐름을 유지해야 한다.

---

## Phase 5: User Story 3 - 인증 메일을 다시 받고 상태를 이어서 진행한다 (Priority: P3)

**Goal**: 가입 중 이탈한 사용자가 이전 이메일 정보를 바탕으로 인증 메일을 재발송하고 인증 대기 상태를 이어갈 수 있게 한다.

**Independent Test**: 가입 직후와 앱 재실행 후 `/auth/resend` 또는 `/auth/verify` 진입 시 이메일 정보가 유지되고, 재발송 결과가 성공/실패로 구분되어 표시되어야 한다.

### Tests for User Story 3

- [X] T027 [P] [US3] `migration/tests/unit/features/auth/resend-flow.test.ts`에 인증 메일 재발송 요청, 이메일 부재 상태, 재실행 후 이메일 복원 테스트를 추가한다

### Implementation for User Story 3

- [X] T028 [P] [US3] `migration/src/features/auth/api/use-resend-verification-email-mutation.ts`와 `migration/src/features/auth/model/use-resend-verification.ts`에 재발송 API 훅과 상태 모델을 구현한다
- [X] T029 [US3] `migration/src/pages/email-verification-page/index.tsx`와 `migration/src/pages/resend-verification-page/index.tsx`를 재발송 모델과 연결하고 성공/실패 상태 메시지를 실제 요청 결과로 교체한다
- [X] T030 [US3] `migration/src/features/auth/ui/signup/components/ResendSection.tsx`, `migration/src/features/auth/ui/signup/components/VerifyAction.tsx`, `migration/src/features/auth/ui/signup/components/ResendEmailHeroSection.tsx`에 이메일 부재/재전송 중/완료 상태를 반영한다
- [X] T031 [US3] `migration/src/shared/lib/i18n/resources.ts`와 `migration/src/entities/user/model/use-auth-email-store.ts`에 재발송 실패 및 이메일 없음 상태 문구, 이메일 지속성 정책을 반영한다

**Checkpoint**: User Story 3는 회원가입 이후 또는 앱 재실행 이후에도 이메일 인증 재발송 흐름을 독립적으로 검증할 수 있어야 한다.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 여러 사용자 스토리에 걸치는 정리와 최종 검증을 수행한다.

- [X] T032 [P] `migration/src/entities/user/index.ts`, `migration/src/entities/session/index.ts`, `migration/src/features/auth/index.ts`를 정리하고 새 공개 export를 연결한다
- [X] T033 `specs/003-auth-domain-implementation/quickstart.md` 기준으로 앱 재실행 후 인증 복구 완료 시간을 측정하고 `SC-001` 검증 결과를 `docs/MIGRATION_MASTER_PLAN.md` 또는 관련 검증 메모에 기록한다
- [X] T034 [P] `migration/src/pages/login-page/index.tsx`, `migration/src/pages/signup-page/index.tsx`, `migration/src/pages/email-verification-page/index.tsx`, `migration/src/pages/resend-verification-page/index.tsx` 기준으로 레거시 인증 화면과 `migration` 인증 화면의 before/after 비교 캡처를 수집하고 결과를 `docs/MIGRATION_MASTER_PLAN.md` 또는 관련 검증 메모에 기록한다
- [X] T035 `migration/package.json`과 `migration/tests/` 기준으로 `pnpm lint:check`, `pnpm typecheck`, `pnpm test`가 통과하도록 전체 인증 도메인 코드를 정리한다

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup**: 즉시 시작 가능
- **Phase 2: Foundational**: Phase 1 완료 후 시작 가능, 모든 사용자 스토리를 블로킹한다
- **Phase 3: US1**: Phase 2 완료 후 시작 가능, MVP
- **Phase 4: US2**: Phase 2 완료 후 시작 가능하지만 로그인 세션 저장 구조를 활용하므로 US1 완료 후 진행을 권장한다
- **Phase 5: US3**: Phase 2 완료 후 시작 가능하지만 가입 이메일 보존과 인증 대기 흐름을 사용하므로 US2 완료 후 진행한다
- **Phase 6: Polish**: 모든 목표 사용자 스토리 완료 후 진행한다

### User Story Dependencies

- **US1 (P1)**: Foundational 이후 바로 시작 가능, 다른 사용자 스토리에 의존하지 않는다
- **US2 (P2)**: Foundational 이후 시작 가능, 로그인 세션/공통 API 기반을 재사용한다
- **US3 (P3)**: Foundational 이후 시작 가능, 가입 이메일과 인증 대기 모델이 구현된 뒤 가장 안정적으로 완성된다

### Within Each User Story

- 테스트 작업을 먼저 작성하고 실패를 확인한 뒤 구현한다
- API/모델 작업 후 UI 연결을 수행한다
- 페이지는 얇게 유지하고 모델/스토어/훅에서 상태 전이를 완성한다
- 각 스토리 완료 후 quickstart 수동 시나리오로 독립 검증한다

### Parallel Opportunities

- Phase 1의 T002, T003은 병렬 실행 가능
- Phase 2의 T005, T006, T007, T011은 파일 충돌 없이 병렬 실행 가능
- US1의 T012, T013, T014, T015는 병렬 시작 가능
- US2의 T019, T020, T021, T022는 병렬 시작 가능
- US3의 T027, T028은 병렬 시작 가능
- Polish 단계의 T033, T034는 병렬 시작 가능

---

## Parallel Example: User Story 1

```bash
Task: "T012 [US1] migration/tests/unit/features/auth/login-flow.test.ts에 로그인 성공, 미인증 로그인, 인증 실패 분기 테스트를 추가한다"
Task: "T013 [US1] migration/tests/unit/features/auth/session-restore.test.ts에 저장 세션 복구 성공/만료/재발급 실패 테스트를 추가한다"
Task: "T014 [US1] migration/src/features/auth/api/auth-api.ts와 migration/src/features/auth/api/use-login-mutation.ts에 로그인 요청, /users/me 복구, 미인증 로그인 분기 처리를 구현한다"
Task: "T015 [US1] migration/src/features/auth/model/use-login-form.ts와 migration/src/features/auth/model/use-auth-redirect.ts에 로그인 폼 상태, 아이디 저장, 보호 경로 복귀 로직을 구현한다"
```

## Parallel Example: User Story 2

```bash
Task: "T019 [US2] migration/tests/unit/features/auth/signup-flow.test.ts에 이메일 중복 확인, 가입 제출, 가입 이메일 저장 테스트를 추가한다"
Task: "T020 [US2] migration/tests/unit/features/auth/verify-callback.test.tsx에 토큰 1회 처리와 인증 성공/실패 콜백 상태 테스트를 추가한다"
Task: "T021 [US2] migration/src/features/auth/api/use-signup-mutation.ts와 migration/src/features/auth/api/use-verify-email-mutation.ts를 추가해 레거시 계약 기반 회원가입/이메일 인증 API 훅을 구현한다"
Task: "T022 [US2] migration/src/features/auth/model/use-signup-form.ts와 migration/src/features/auth/model/use-email-verification-callback.ts에 회원가입 제출, 가입 이메일 보존, 콜백 처리 상태 전이를 구현한다"
```

## Parallel Example: User Story 3

```bash
Task: "T027 [US3] migration/tests/unit/features/auth/resend-flow.test.ts에 인증 메일 재발송 요청, 이메일 부재 상태, 재실행 후 이메일 복원 테스트를 추가한다"
Task: "T028 [US3] migration/src/features/auth/api/use-resend-verification-email-mutation.ts와 migration/src/features/auth/model/use-resend-verification.ts에 재발송 API 훅과 상태 모델을 구현한다"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup 완료
2. Phase 2 Foundational 완료
3. Phase 3 US1 완료
4. 로그인/세션 복구/보호 라우트 분기 수동 검증
5. 여기서 멈추면 “기존 계정 사용자의 앱 진입”이라는 핵심 가치를 먼저 전달할 수 있다

### Incremental Delivery

1. 공통 인증 세션과 API 기반을 먼저 완성한다
2. US1로 기존 사용자 진입 문제를 해결한다
3. US2로 신규 사용자 가입과 이메일 인증을 연결한다
4. US3로 가입 이탈 복구와 재발송 경험을 완성한다
5. 마지막에 lint/typecheck/test와 수동 회귀 검증으로 정리한다

### Parallel Team Strategy

1. 한 명은 Phase 1~2 공통 기반을 완료한다
2. 기반이 끝나면:
   - 개발자 A: US1 로그인/세션 복구
   - 개발자 B: US2 회원가입/인증 콜백
   - 개발자 C: US3 재발송/이메일 지속성
3. 각 스토리는 독립 검증 후 통합한다

---

## Notes

- 모든 태스크는 체크리스트 형식, 순차 Task ID, 정확한 파일 경로를 포함한다
- `[P]` 태스크는 서로 다른 파일을 중심으로 병렬 실행 가능하다
- 페이지 레이어는 얇게 유지하고 상태 전이는 `features/auth`, `entities/user`, `entities/session`에 둔다
- UI 스타일 변경 작업은 포함하지 않는다
