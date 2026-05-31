# Tasks: Camera Stream Permission

**Input**: Design documents from `specs/016-camera-stream-permission/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/camera-stream-permission.md, quickstart.md

**Tests**: Test tasks are included because the feature changes camera behavior, sidecar contracts, privacy/security expectations, and user-facing recovery flows.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the active feature context and identify existing camera-path files before changing behavior.

- [X] T001 Review the feature design artifacts in specs/016-camera-stream-permission/spec.md, specs/016-camera-stream-permission/plan.md, specs/016-camera-stream-permission/data-model.md, and specs/016-camera-stream-permission/contracts/camera-stream-permission.md
- [X] T002 [P] Inspect current renderer camera flows in migration/src/pages/onboarding-page/components/CameraPermissionButton.tsx, migration/src/features/posture-engine/model/use-auto-start-posture-engine.ts, migration/src/features/posture-engine/model/use-posture-engine.ts, and migration/src/pages/calibration-page/components/WebcamView.tsx
- [X] T003 [P] Inspect current native and sidecar contracts in migration/src-tauri/src/commands/posture_engine/engine.rs, migration/src-tauri/src/state/posture_engine_state/contracts.rs, sidecar/posture-engine/main.py, and sidecar/posture-engine/engine/background_camera.py

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared types, error taxonomy, and non-sensitive diagnostics needed by all user stories.

**CRITICAL**: No user story work should begin until this phase is complete.

- [X] T004 Add or normalize camera error codes for permission denied, unavailable, busy, frame unavailable, API unavailable, stream unauthorized, and unknown states in migration/src/entities/posture/model/posture-types.ts
- [X] T005 Add non-sensitive camera diagnostic event types that exclude raw video, captured frames, camera names, camera IDs, and stream tokens in migration/src/entities/posture/model/posture-types.ts
- [X] T006 Update camera permission and sidecar error message mapping for the normalized error taxonomy in migration/src/shared/lib/camera-permission.ts
- [X] T007 Update Tauri response structs and engine state contracts for any new camera error or diagnostic fields in migration/src-tauri/src/state/posture_engine_state/contracts.rs and migration/src-tauri/src/state/posture_engine_state/types.rs
- [X] T008 Update sidecar state/result models for normalized camera errors and non-sensitive diagnostics in sidecar/posture-engine/models/result.py

**Checkpoint**: Shared camera state and error contracts are ready for story implementation.

---

## Phase 3: User Story 1 - 카메라 권한을 확인하고 측정을 시작한다 (Priority: P1) MVP

**Goal**: Users enter measurement only after app-view camera permission and local camera engine startup both succeed, and then see a usable local preview.

**Independent Test**: From a fresh or granted permission state, click camera permission/start measurement and verify the app explains camera purpose, probes app-view permission, starts the local camera engine, stops probe streams, and enters measurement only after a usable local stream is available within the expected readiness window.

### Tests for User Story 1

- [X] T009 [P] [US1] Add onboarding test that camera purpose text is visible before permission probing in migration/src/pages/onboarding-page/components/__tests__/CameraPermissionButton.test.tsx
- [X] T010 [US1] Add onboarding test that blocks navigation when startPostureEngine fails after getUserMedia succeeds in migration/src/pages/onboarding-page/components/__tests__/CameraPermissionButton.test.tsx
- [X] T011 [P] [US1] Add auto-start test that records an error and does not mark the engine ready when getUserMedia succeeds but startPostureEngine fails in migration/src/features/posture-engine/model/use-auto-start-posture-engine.test.ts
- [X] T012 [P] [US1] Add hook test that startPostureEngine success stores streamUrl and failure clears streamUrl in migration/src/features/posture-engine/model/use-posture-engine.test.ts
- [X] T013 [US1] Add preview readiness timing test for success within 5 seconds and timeout recovery in migration/src/features/posture-engine/model/use-posture-engine.test.ts
- [X] T014 [P] [US1] Add Rust command contract test for start_posture_engine rejecting camera access before local engine startup succeeds in migration/src-tauri/src/commands/posture_engine/engine.rs
- [X] T015 [P] [US1] Add sidecar contract test for start success and startup failure response shape in sidecar/posture-engine/tests/test_sidecar_contract.py

### Implementation for User Story 1

- [X] T016 [US1] Ensure onboarding camera purpose copy is visible before permission probing in migration/src/pages/onboarding-page/index.tsx and migration/src/shared/lib/i18n/resources.ts
- [X] T017 [US1] Ensure CameraPermissionButton stops the app-view probe stream before local engine startup and navigates only after startPostureEngine succeeds in migration/src/pages/onboarding-page/components/CameraPermissionButton.tsx
- [X] T018 [US1] Ensure useAutoStartPostureEngine requires getUserMedia success before startPostureEngine and preserves recoverable error state on either failure in migration/src/features/posture-engine/model/use-auto-start-posture-engine.ts
- [X] T019 [US1] Ensure usePostureEngine only sets ready state and streamUrl after local engine startup succeeds, clears streamUrl on startup failure, and marks timeout recovery after 5 seconds in migration/src/features/posture-engine/model/use-posture-engine.ts
- [X] T020 [US1] Ensure start_posture_engine performs permission blocked checks before sidecar start and returns normalized errors without creating a running session on startup failure in migration/src-tauri/src/commands/posture_engine/engine.rs
- [X] T021 [US1] Ensure sidecar start opens the camera before detector initialization and returns stream_url only when the camera loop is running in sidecar/posture-engine/main.py
- [X] T022 [US1] Update WebcamView to show the local preview only when a streamUrl exists and to keep a non-error startup waiting state in migration/src/pages/calibration-page/components/WebcamView.tsx

**Checkpoint**: User Story 1 is independently functional and can serve as the MVP.

---

## Phase 4: User Story 2 - 권한 거부와 사용 불가 상태를 이해하고 복구한다 (Priority: P2)

**Goal**: Users receive distinct, actionable recovery guidance for permission denied, no usable camera, camera already in use, and frame unavailable states, and can retry without restarting the app.

**Independent Test**: Simulate denied permission, unavailable camera, busy camera, and frame unavailable errors and verify the app shows the correct guidance and retry path from the current screen.

### Tests for User Story 2

- [X] T023 [P] [US2] Add camera-permission message tests for NotAllowedError, NotFoundError, NotReadableError, camera_busy, camera_unavailable, and camera_frame_unavailable in migration/src/shared/lib/__tests__/camera-permission.test.ts
- [X] T024 [P] [US2] Add CameraPermissionModal retry and close behavior tests for recoverable camera errors in migration/src/features/posture-engine/ui/CameraPermissionModal.test.tsx
- [X] T025 [P] [US2] Add WebcamView tests for denied, unavailable, busy, and frame unavailable rendering in migration/tests/unit/pages/webcam-view.test.tsx
- [X] T026 [P] [US2] Add sidecar tests for permission denied, unavailable, and frame unavailable error mapping in sidecar/posture-engine/tests/test_background_camera.py

### Implementation for User Story 2

- [X] T027 [US2] Add normalized camera_busy handling and distinct recovery text in migration/src/shared/lib/camera-permission.ts
- [X] T028 [US2] Update CameraPermissionModal copy and retry wiring for normalized recoverable camera errors in migration/src/features/posture-engine/ui/CameraPermissionModal.tsx
- [X] T029 [US2] Update WebcamView error rendering to use normalized camera guidance and keep retry available without app restart in migration/src/pages/calibration-page/components/WebcamView.tsx
- [X] T030 [US2] Update usePostureEngine retryStart to clear stale streamUrl, reset recoverable startup state, and retry from the current screen in migration/src/features/posture-engine/model/use-posture-engine.ts
- [X] T031 [US2] Map sidecar camera open failures to permission denied, unavailable, busy, or frame unavailable without leaking sensitive details in sidecar/posture-engine/engine/background_camera.py
- [X] T032 [US2] Ensure Tauri emits device_unavailable warnings with normalized error codes for recoverable camera failures in migration/src-tauri/src/commands/posture_engine/engine.rs

**Checkpoint**: User Story 2 works independently with actionable recovery guidance.

---

## Phase 5: User Story 3 - 사용자가 카메라 노출과 자원 사용을 제어한다 (Priority: P3)

**Goal**: Hiding the camera pauses measurement and stops new frame collection; stopping measurement or leaving the flow releases camera resources within the required window.

**Independent Test**: Start measurement, hide the camera, verify stop/pause behavior and no new frames; show the camera again and verify readiness is checked before resuming; stop measurement and verify camera release.

### Tests for User Story 3

- [X] T033 [P] [US3] Add WebcamPanel test that hiding the camera stops the posture engine and pauses the session in migration/src/features/main-panels/ui/__tests__/WebcamPanel.test.tsx
- [X] T034 [P] [US3] Add usePostureEngine test that inactive state calls stopPostureEngine and clears streamUrl in migration/src/features/posture-engine/model/use-posture-engine.test.ts
- [X] T035 [P] [US3] Add sidecar stop test that clears latest frame and stream_url in sidecar/posture-engine/tests/test_posture_engine_service.py
- [X] T036 [P] [US3] Add background camera stop test that shuts down stream server and clears latest JPEG in sidecar/posture-engine/tests/test_background_camera.py

### Implementation for User Story 3

- [X] T037 [US3] Update WebcamPanel camera hide/show flow so hide pauses measurement and deactivates camera frame collection in migration/src/features/main-panels/ui/WebcamPanel.tsx
- [X] T038 [US3] Update usePostureEngine cleanup so inactive, unmount, stop, and retry paths stop the local engine and clear streamUrl exactly once in migration/src/features/posture-engine/model/use-posture-engine.ts
- [X] T039 [US3] Update stop_posture_engine to stop workers, stop sidecar camera capture, clear streamUrl, and set camera owner none in migration/src-tauri/src/commands/posture_engine/engine.rs
- [X] T040 [US3] Ensure BackgroundCameraLoop.stop clears latest JPEG, stream_url, server state, and capture ownership in sidecar/posture-engine/engine/background_camera.py
- [X] T041 [US3] Ensure PostureEngineService stop clears stream_url and resets camera owner without retaining frames in sidecar/posture-engine/main.py

**Checkpoint**: User Story 3 works independently and camera resources are user-controlled.

---

## Phase 6: Security, Privacy, and Multi-Camera Cross-Cutting Concerns

**Purpose**: Complete cross-story requirements for stream token protection, automatic camera selection, external transmission prevention, and non-sensitive diagnostics.

- [X] T042 [P] Add local stream unauthorized-token tests for missing token, incorrect token, and non-video path in sidecar/posture-engine/tests/test_background_camera.py
- [X] T043 Add automatic camera selection tests for built-in/general local priority and continuity/desk-view exclusion in sidecar/posture-engine/tests/test_background_camera.py
- [X] T044 [P] Add diagnostic privacy tests that assert camera diagnostics exclude raw frames, camera names, camera IDs, and stream tokens in migration/src/features/posture-engine/model/use-posture-engine.test.ts
- [X] T045 [P] Add external-transmission guard test that camera frames are not sent to remote services in migration/src/features/posture-engine/model/camera-privacy.test.ts
- [X] T046 Implement session-specific unpredictable token validation and rejected responses without frame bytes in sidecar/posture-engine/engine/background_camera.py
- [X] T047 Implement automatic camera selection with built-in/general local priority and continuity/desk-view exclusion in sidecar/posture-engine/engine/background_camera.py
- [X] T048 Implement non-sensitive diagnostic state recording for camera permission, availability, transition, and timing failures in migration/src/features/posture-engine/model/use-posture-engine.ts and migration/src-tauri/src/commands/posture_engine/engine.rs
- [X] T049 Ensure streamUrl and diagnostic state never persist raw frames, camera names, camera IDs, or tokens beyond active session needs in migration/src/entities/posture/model/posture-engine-store.ts
- [X] T050 Ensure camera frame data only flows to local preview/local engine paths and cannot be posted to external services in migration/src/features/posture-engine/model/use-posture-engine.ts and migration/src-tauri/tauri.conf.json

---

## Phase 7: Polish & Validation

**Purpose**: Documentation, full validation, and regression checks across all user stories.

- [X] T051 [P] Update camera permission and posture engine docs for the clarified double-check flow and hide-as-pause behavior in migration/docs/onboarding.md and migration/docs/posture-engine-pipeline.md
- [X] T052 [P] Update architecture notes for local-only tokenized camera stream and non-sensitive diagnostics in migration/docs/architecture-overview.md
- [X] T053 Run renderer checks from migration with pnpm run lint:check, pnpm run typecheck, and pnpm run test
- [X] T054 Run sidecar camera and contract checks from sidecar/posture-engine with python -m pytest tests/test_background_camera.py tests/test_sidecar_contract.py tests/test_posture_engine_service.py
- [ ] T055 Execute quickstart manual verification steps in specs/016-camera-stream-permission/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies.
- **Phase 2 Foundational**: Depends on Phase 1 and blocks all user story phases.
- **Phase 3 US1**: Depends on Phase 2. This is the MVP.
- **Phase 4 US2**: Depends on Phase 2 and can proceed after or alongside US1, but user-facing retry paths benefit from US1 startup behavior.
- **Phase 5 US3**: Depends on Phase 2 and can proceed after or alongside US1, but validation benefits from US1 stream startup behavior.
- **Phase 6 Security/Privacy/Multi-Camera**: Depends on Phase 2 and should complete before final validation.
- **Phase 7 Polish & Validation**: Depends on desired story and cross-cutting phases.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories after Phase 2.
- **US2 (P2)**: Can be implemented independently after Phase 2 using simulated error states; integrates with US1 startup flow.
- **US3 (P3)**: Can be implemented independently after Phase 2 using active/inactive engine state; integrates with US1 stream flow.

### Parallel Opportunities

- T002 and T003 can run in parallel.
- T006, T007, and T008 can run in parallel after T004 and T005.
- Test tasks within each user story marked [P] can run in parallel when they touch different files.
- US2 and US3 can run in parallel after Phase 2 if developers coordinate shared edits to usePostureEngine.ts and engine.rs.
- T042, T044, and T045 can run in parallel before T046-T050.

## Parallel Examples

### User Story 1

```text
Task: "T009 Add onboarding purpose-copy test in migration/src/pages/onboarding-page/components/__tests__/CameraPermissionButton.test.tsx"
Task: "T011 Add auto-start failure test in migration/src/features/posture-engine/model/use-auto-start-posture-engine.test.ts"
Task: "T014 Add Rust command contract test in migration/src-tauri/src/commands/posture_engine/engine.rs"
Task: "T015 Add sidecar contract test in sidecar/posture-engine/tests/test_sidecar_contract.py"
```

### User Story 2

```text
Task: "T023 Add camera permission message tests in migration/src/shared/lib/__tests__/camera-permission.test.ts"
Task: "T024 Add modal retry tests in migration/src/features/posture-engine/ui/CameraPermissionModal.test.tsx"
Task: "T025 Add WebcamView error rendering tests in migration/tests/unit/pages/webcam-view.test.tsx"
Task: "T026 Add sidecar error mapping tests in sidecar/posture-engine/tests/test_background_camera.py"
```

### User Story 3

```text
Task: "T033 Add WebcamPanel hide behavior test in migration/src/features/main-panels/ui/__tests__/WebcamPanel.test.tsx"
Task: "T034 Add usePostureEngine inactive cleanup test in migration/src/features/posture-engine/model/use-posture-engine.test.ts"
Task: "T035 Add sidecar stop contract test in sidecar/posture-engine/tests/test_posture_engine_service.py"
Task: "T036 Add background camera stop cleanup test in sidecar/posture-engine/tests/test_background_camera.py"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 tests T009-T015 and confirm they fail for the missing behavior.
3. Complete Phase 3 implementation T016-T022.
4. Validate onboarding/calibration entry with the focused renderer and sidecar tests.

### Incremental Delivery

1. Deliver US1 to guarantee users only enter measurement after real camera readiness.
2. Add US2 to improve recoverability and guidance for failed camera states.
3. Add US3 to make camera hiding and measurement exit privacy-correct.
4. Complete Phase 6 to harden local stream access, automatic camera selection, external transmission prevention, and diagnostics.
5. Complete Phase 7 validation before review.

## Notes

- Each task includes an explicit file path and follows `- [ ] T### [P?] [US?] Description with file path`.
- Test tasks should be written before their implementation tasks and should fail for missing behavior.
- Avoid persisting raw video, captured frames, camera names, camera IDs, or stream tokens.
- Coordinate edits to migration/src/features/posture-engine/model/use-posture-engine.ts and migration/src-tauri/src/commands/posture_engine/engine.rs because multiple stories touch those files.
