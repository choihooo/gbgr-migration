# Quickstart: Camera Lifecycle State

## Preconditions

- Work from repository root.
- Current branch is `017-camera-lifecycle-state`.
- Frontend commands run from `migration/`.

## Focused Verification

1. Run lifecycle-related unit tests after implementation:

```bash
cd migration
pnpm exec vitest run \
  src/features/main-panels/model/__tests__/use-camera-store.test.ts \
  src/features/posture-engine/model/use-posture-engine.test.ts \
  src/features/main-panels/ui/__tests__/WebcamPanel.test.tsx \
  src/features/main-panels/ui/__tests__/MiniRunningPanel.test.tsx
```

2. Run full renderer validation:

```bash
cd migration
pnpm run lint:check
pnpm run typecheck
pnpm run test
```

## Manual Scenario Checks

1. Start the desktop app.
2. Enter the main measurement screen with camera available.
3. Use the camera button above the preview to hide the camera.
4. Confirm the measurement session pauses and camera-dependent visuals stay inactive.
5. Use the same button to show the camera again.
6. Confirm the running panel background and character animation remain paused until the preview stream is actually ready.
7. Confirm the preview appears only after the stream is ready and the measurement session resumes after readiness.
8. Repeat show, hide, show, and exit in sequence.
9. Confirm no stale preview frame, stale stream URL, or premature running animation appears.
10. While the camera is preparing, press hide or exit and confirm late camera startup does not reactivate preview or running animation.
11. Hide the camera on the main screen, enter calibration, return to the main screen, and confirm the previous main camera intent was not overwritten by calibration.

## Failure Scenario Checks

1. Deny camera permission or make the camera unavailable.
2. Request camera show.
3. Confirm active running visuals do not start.
4. Confirm retry clears the previous failure state before preparing again.
5. Confirm failure keeps the user's show intent visible as a retryable error state, with no active camera visuals.
6. Restart or reload the app and confirm stale runtime state does not activate camera preview or running visuals.
7. Confirm app window minimize/focus changes do not change explicit show/hide/exit intent.

## Native/Sidecar Checks

This feature is planned as renderer-scoped. Run Rust or sidecar tests only if implementation changes Tauri command behavior or sidecar camera behavior:

```bash
cd migration/src-tauri
cargo test --lib

cd ../../sidecar/posture-engine
pytest
```
