# Research: Camera Lifecycle State

## Decision: Model camera state as one lifecycle with separate intent and runtime fields

**Rationale**: The current `cameraState` expresses only user intent (`show`, `hide`, `exit`). It cannot represent important intermediate or failure states such as preparing, ready, stopping, or failed. A single lifecycle record with separate intent and runtime fields keeps state policy unified while still preventing UI from treating "user asked to show" as "camera is live".

**Alternatives considered**:

- Keep `cameraState` as the only source of truth: rejected because it caused the current premature running-panel animation bug.
- Split lifecycle across unrelated stores without a shared contract: rejected because UI surfaces would keep reimplementing readiness rules.
- Replace all posture-engine state with camera lifecycle state: rejected because engine session/result state has broader responsibilities than camera visual readiness.

## Decision: Runtime readiness is updated by the posture-engine hook

**Rationale**: `usePostureEngine` already owns the async start/stop flow, waits for a usable stream URL, normalizes start failures, clears local `streamUrl`, and updates engine/session state. It is the correct place to publish `preparing`, `ready`, `failed`, and inactive transitions for the renderer.

**Alternatives considered**:

- Let each UI component infer runtime readiness from hook return values: rejected because `MiniRunningPanel` does not call the hook and should not start side effects only to know camera readiness.
- Let `WebcamPanel` own runtime readiness: rejected because calibration and onboarding also depend on the same runtime behavior.
- Move readiness into Tauri only: rejected for this feature because the immediate bug is renderer activation gating, and the existing Tauri response already exposes enough readiness information.

## Decision: Persist user intent only; keep runtime stream state transient

**Rationale**: User intent may reasonably survive reloads or navigation, but runtime state contains short-lived stream URLs and tokens that must not be persisted. Persisting runtime readiness would also be wrong after app reload because the sidecar stream may no longer exist.

**Alternatives considered**:

- Persist the whole lifecycle: rejected because it risks stale stream URLs and token leakage.
- Persist nothing: rejected because existing behavior already persists user-facing camera/widget preference and this feature does not need to remove it.

## Decision: UI activation uses a derived live predicate

**Rationale**: Every camera-dependent surface needs the same definition of active: intent is show, runtime is ready, and a usable stream reference exists. Centralizing this predicate prevents drift between running panel animation, webcam preview, calibration UI, and future controls.

**Alternatives considered**:

- Check only `cameraState === 'show'`: rejected because it cannot distinguish requested show from actual camera readiness.
- Check only `streamUrl`: rejected because stale URLs can exist briefly during transitions unless guarded by runtime status and intent.
- Check only engine status: rejected because engine readiness alone does not mean the user wants the camera visible.

## Decision: Keep this feature renderer-scoped unless implementation reveals a contract gap

**Rationale**: The existing Tauri command and sidecar already provide ready/error outcomes and local stream URLs. The planned change is how the renderer records and consumes that state. Avoiding native/sidecar changes reduces regression risk and keeps the scope focused on the reported bug.

**Alternatives considered**:

- Modify Rust command responses first: rejected because no missing native field has been identified.
- Modify sidecar stream behavior first: rejected because the bug occurs when UI starts before existing stream readiness is reflected.

## Decision: Tests target store transitions, hook publication, and UI gating

**Rationale**: The risky behavior lives in renderer state and panels. Store tests should cover deterministic lifecycle transitions, hook tests should cover start/success/failure/stop publication, and panel tests should prove running visuals wait for the derived live predicate.

**Alternatives considered**:

- Only manual test through Tauri: rejected because the race is easy to regress.
- Only unit-test selectors: rejected because the running panel bug is visible component behavior.
