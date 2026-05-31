# Quickstart: Camera Stream Permission

## Prerequisites

- Install frontend dependencies from `migration/` with `pnpm install` if needed.
- Use Python 3.11 for `sidecar/posture-engine`.
- Ensure camera access can be toggled in the operating system privacy settings.

## Focused Test Commands

From `migration/`:

```bash
pnpm run lint:check
pnpm run typecheck
pnpm run test
```

From `sidecar/posture-engine/`:

```bash
python -m pytest tests/test_background_camera.py tests/test_sidecar_contract.py tests/test_posture_engine_service.py
```

## Manual Verification

1. Start the Tauri app locally.
2. Reset or deny camera permission in the operating system privacy settings.
3. Open onboarding and click camera permission.
4. Verify denied permission shows actionable OS settings guidance.
5. Grant permission and repeat the flow.
6. Verify measurement entry waits for both app-view permission and local camera engine startup.
7. Verify the visible preview appears within 5 seconds on a working camera.
8. Hide the camera during measurement.
9. Verify measurement pauses and new frame collection stops.
10. Show the camera again and verify measurement resumes only after camera readiness.
11. Stop measurement or leave the measurement flow.
12. Verify camera frame collection stops within 2 seconds.

## Multi-Camera Verification

1. Attach or enable multiple cameras, including a continuity or desk-view style source if available.
2. Start measurement.
3. Verify the app uses automatic selection only.
4. Verify built-in/general local camera is preferred.
5. Verify continuity/desk-view style sources are not selected by default when a better local camera is available.

## Local Stream Security Verification

1. Start measurement and capture the current local stream URL from the app state/logs if available.
2. Request the same `/video` path without the token.
3. Request the same `/video` path with an incorrect token.
4. Verify both requests are rejected and no frame bytes are returned.
5. Stop measurement.
6. Verify the previous stream URL no longer serves frames.

## Diagnostic Verification

1. Trigger permission denied, unavailable camera, and frame unavailable states.
2. Verify diagnostics contain only error code, coarse permission state, state transition, timing, and timestamp.
3. Verify diagnostics do not contain raw video, captured frames, camera names, camera IDs, or stream tokens.
