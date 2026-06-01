# Tasks: Camera Lifecycle State

**Input**: Design documents from `specs/017-camera-lifecycle-state/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/camera-lifecycle-state.md`, `quickstart.md`

**Tests**: Required by the specification and constitution because this feature changes camera lifecycle behavior, stream readiness, and user-visible UI gating.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files or has no dependency on incomplete tasks
- **[Story]**: Maps the task to a user story, for example `[US1]`
- All tasks include exact file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared test and type surfaces used by all lifecycle work.

- [X] T001 [P] Add camera lifecycle type names and exported state shape placeholders in `migration/src/features/main-panels/model/types.ts`
- [X] T002 [P] Add reusable `HTMLMediaElement.play` and `HTMLMediaElement.pause` test stubs in `migration/src/test/setup.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the shared lifecycle model before any UI surface consumes it.

**Critical**: No user story work should begin until these tasks are complete.

- [X] T003 [P] Add failing lifecycle initialization and persistence tests in `migration/src/features/main-panels/model/__tests__/use-camera-store.test.ts`
- [X] T004 Implement `cameraLifecycle` state, intent actions, runtime actions, and intent-only persistence in `migration/src/features/main-panels/model/use-camera-store.ts`
- [X] T005 Add derived lifecycle selectors such as `isCameraLive`, `isCameraPreparing`, and `isCameraHidden` in `migration/src/features/main-panels/model/types.ts`
- [X] T006 Preserve or migrate existing `cameraState` callers through compatibility accessors in `migration/src/features/main-panels/model/use-camera-store.ts`

**Checkpoint**: Store can represent `intent`, `runtime`, `streamUrl`, `errorCode`, and derived live state without starting camera capture.

---

## Phase 3: User Story 1 - 실제 카메라 준비 전 UI 동작 차단 (Priority: P1) MVP

**Goal**: Running panel, character animation, and preview only become active after the actual camera runtime is ready and a usable stream URL exists.

**Independent Test**: Hide the camera, show it again, keep runtime in preparing state, and verify running visuals stay paused until runtime becomes ready with a stream URL.

### Tests for User Story 1

- [X] T007 [P] [US1] Add failing MiniRunningPanel test for show intent with starting runtime staying visually paused in `migration/src/features/main-panels/ui/__tests__/MiniRunningPanel.test.tsx`
- [X] T008 [P] [US1] Add failing posture-engine hook test for starting-to-ready lifecycle publication in `migration/src/features/posture-engine/model/use-posture-engine.test.ts`
- [X] T009 [P] [US1] Add failing WebcamPanel test proving preview `isActive` is false until lifecycle is live in `migration/src/features/main-panels/ui/__tests__/WebcamPanel.test.tsx`

### Implementation for User Story 1

- [X] T010 [US1] Publish lifecycle `starting`, `ready`, `idle`, and stream URL transitions from `migration/src/features/posture-engine/model/use-posture-engine.ts`
- [X] T011 [US1] Replace `cameraState === 'show'` animation gating with `isCameraLive` in `migration/src/features/main-panels/ui/MiniRunningPanel.tsx`
- [X] T012 [US1] Pass preview active state from lifecycle readiness instead of intent alone in `migration/src/features/main-panels/ui/WebcamPanel.tsx`
- [X] T013 [US1] Ensure sidecar preview rendering requires lifecycle-ready stream state in `migration/src/pages/calibration-page/components/WebcamView.tsx`

**Checkpoint**: User Story 1 is independently testable and fixes the reported premature running-panel motion.

---

## Phase 4: User Story 2 - 사용자 의도와 실제 카메라 상태 구분 (Priority: P1)

**Goal**: Show, hide, exit, reload, and in-flight start completion cannot collapse user intent and runtime readiness into the same state.

**Independent Test**: Start camera preparation, press hide or exit before startup completes, then verify late success does not activate UI; reload with persisted show intent and verify runtime remains idle.

### Tests for User Story 2

- [X] T014 [P] [US2] Add failing tests for show/hide/exit intent and reload idle behavior in `migration/src/features/main-panels/model/__tests__/use-camera-store.test.ts`
- [X] T015 [P] [US2] Add failing hook test that ignores late start success after inactive intent in `migration/src/features/posture-engine/model/use-posture-engine.test.ts`

### Implementation for User Story 2

- [X] T016 [US2] Add guarded intent transitions for show, hide, and exit in `migration/src/features/main-panels/model/use-camera-store.ts`
- [X] T017 [US2] Add start-attempt generation or cancellation guard for late start results in `migration/src/features/posture-engine/model/use-posture-engine.ts`
- [X] T018 [US2] Update camera button handlers to pause measurement on hide, resume only after ready show, and avoid directly marking runtime ready in `migration/src/features/main-panels/ui/WebcamPanel.tsx`
- [X] T019 [US2] Update onboarding preflight success to set show intent without setting runtime readiness in `migration/src/pages/onboarding-page/components/CameraPermissionButton.tsx`

**Checkpoint**: User Story 2 is independently testable and prevents stale or late async results from reactivating camera UI.

---

## Phase 5: User Story 3 - 캘리브레이션과 메인 화면의 정책 통일 (Priority: P2)

**Goal**: Calibration and main measurement use the same lifecycle readiness rules, while calibration route entry does not overwrite the main screen's persisted camera intent.

**Independent Test**: Hide camera on the main screen, enter calibration, let calibration request camera preparation, return to main screen, and verify main intent was not overwritten.

### Tests for User Story 3

- [X] T020 [P] [US3] Add failing calibration route test for route-scoped camera preparation in `migration/tests/unit/pages/calibration-page.test.tsx`
- [X] T021 [P] [US3] Add failing WebcamView test for route policy not overwriting main camera intent in `migration/tests/unit/pages/webcam-view.test.tsx`

### Implementation for User Story 3

- [X] T022 [US3] Keep calibration camera activation route-scoped without writing main persisted intent in `migration/src/pages/calibration-page/index.tsx`
- [X] T023 [US3] Separate surface visibility policy from main camera intent in `migration/src/pages/calibration-page/components/WebcamView.tsx`
- [X] T024 [US3] Ensure main page and panel lifecycle consumption remains foreground-only and user-intent-controlled in `migration/src/pages/main-page/index.tsx`

**Checkpoint**: User Story 3 is independently testable and keeps calibration behavior consistent without corrupting main-screen camera preference.

---

## Phase 6: User Story 4 - 실패와 재시도 상태의 명확한 표현 (Priority: P3)

**Goal**: Camera failures keep show intent, move runtime to error, clear stream URL, avoid active visuals, and keep retry available.

**Independent Test**: Simulate permission denied, busy camera, and unavailable stream failures; verify active UI does not start and retry begins from a clean starting state.

### Tests for User Story 4

- [X] T025 [P] [US4] Add failing hook test that failure preserves show intent and clears stream URL in `migration/src/features/posture-engine/model/use-posture-engine.test.ts`
- [X] T026 [P] [US4] Add failing WebcamView error-state test that no active preview renders from lifecycle error in `migration/tests/unit/pages/webcam-view.test.tsx`
- [X] T027 [P] [US4] Add failing camera permission modal retry-state test in `migration/src/features/posture-engine/ui/CameraPermissionModal.test.tsx`

### Implementation for User Story 4

- [X] T028 [US4] Map start failures to lifecycle `error` with show intent and null stream in `migration/src/features/posture-engine/model/use-posture-engine.ts`
- [X] T029 [US4] Render preparing and error states without active stream visuals in `migration/src/pages/calibration-page/components/WebcamView.tsx`
- [X] T030 [US4] Ensure retry clears previous lifecycle error and stale stream before starting in `migration/src/features/posture-engine/model/use-posture-engine.ts`

**Checkpoint**: User Story 4 is independently testable and failure states are retryable without pretending the camera is active.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate the integrated lifecycle policy and update surrounding documentation if implementation details drift.

- [X] T031 [P] Update lifecycle contract notes if implementation changes documented behavior in `specs/017-camera-lifecycle-state/contracts/camera-lifecycle-state.md`
- [X] T032 [P] Update manual verification steps if implemented UI differs from planned flow in `specs/017-camera-lifecycle-state/quickstart.md`
- [X] T033 Run focused lifecycle tests listed in `specs/017-camera-lifecycle-state/quickstart.md`
- [X] T034 Run renderer lint, typecheck, and full Vitest validation from `migration/package.json`
- [X] T035 Review camera lifecycle call sites for stale `cameraState === 'show'` activation checks in `migration/src`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational and is the MVP
- **User Story 2 (Phase 4)**: Depends on Foundational; should follow US1 if one engineer is working because both touch the posture hook
- **User Story 3 (Phase 5)**: Depends on Foundational; can proceed after US1 lifecycle readiness exists
- **User Story 4 (Phase 6)**: Depends on Foundational; can proceed after US1 lifecycle publication exists
- **Polish (Phase 7)**: Depends on all selected user stories

### User Story Dependencies

- **US1 (P1)**: No dependency on other user stories after Foundational; delivers MVP fix
- **US2 (P1)**: No business dependency on US1, but implementation should coordinate because both edit `use-posture-engine.ts`
- **US3 (P2)**: Depends on shared lifecycle model and benefits from US1 readiness selectors
- **US4 (P3)**: Depends on shared lifecycle model and US1 runtime publication

### Within Each User Story

- Write failing tests first
- Implement shared store or hook behavior next
- Update UI consumers last
- Validate the story checkpoint before moving to the next story

---

## Parallel Opportunities

- T001 and T002 can run in parallel
- T003 can run while T001/T002 are under review, but T004 should wait for T001
- Tests touching different files inside each story can run in parallel
- US3 calibration tests can be prepared while US1 implementation is underway
- Documentation polish tasks T031 and T032 can run in parallel after implementation stabilizes

---

## Parallel Example: User Story 1

```text
Task: "Add failing MiniRunningPanel test for show intent with starting runtime staying visually paused in migration/src/features/main-panels/ui/__tests__/MiniRunningPanel.test.tsx"
Task: "Add failing posture-engine hook test for starting-to-ready lifecycle publication in migration/src/features/posture-engine/model/use-posture-engine.test.ts"
Task: "Add failing WebcamPanel test proving preview isActive is false until lifecycle is live in migration/src/features/main-panels/ui/__tests__/WebcamPanel.test.tsx"
```

---

## Parallel Example: User Story 3

```text
Task: "Add failing calibration route test for route-scoped camera preparation in migration/tests/unit/pages/calibration-page.test.tsx"
Task: "Add failing WebcamView test for route policy not overwriting main camera intent in migration/tests/unit/pages/webcam-view.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 for User Story 1.
3. Run the focused tests for `use-camera-store`, `use-posture-engine`, `WebcamPanel`, and `MiniRunningPanel`.
4. Manually verify hide-to-show does not animate before camera readiness.

### Incremental Delivery

1. Add shared lifecycle model.
2. Add US1 live gating and validate the reported bug.
3. Add US2 async race and reload handling.
4. Add US3 calibration route policy.
5. Add US4 failure and retry states.
6. Run the full validation commands in `quickstart.md`.

### Parallel Team Strategy

1. One engineer owns the lifecycle store and hook publication.
2. One engineer prepares panel and calibration tests.
3. Once Foundational is complete, split UI surfaces by file: `MiniRunningPanel.tsx`, `WebcamPanel.tsx`, and `WebcamView.tsx`.

---

## Notes

- Avoid persisting runtime state, stream URLs, or tokens.
- Do not reintroduce window visibility as camera hide intent.
- Treat `show` intent as a request, not proof of camera readiness.
- Keep Rust and sidecar untouched unless implementation discovers a missing native contract.
