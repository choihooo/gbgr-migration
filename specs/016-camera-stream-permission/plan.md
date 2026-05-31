# Implementation Plan: Camera Stream Permission

**Branch**: `016-camera-stream-permission` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/016-camera-stream-permission/spec.md`

## Summary

Tighten the desktop camera permission and local stream flow so users only enter measurement after both app-view permission and the local camera engine are ready. The implementation will keep posture analysis local, enforce local-only token-protected stream access, pause measurement when the camera is hidden, preserve inferred camera preference without a selection UI, and store only non-sensitive diagnostic state.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19, Rust 2021, Python 3.11

**Primary Dependencies**: Tauri 2, Vite 7, Zustand, React Router, Vitest/Testing Library, Rust serde/tauri/objc2, Python OpenCV, MediaPipe, stdlib `ThreadingHTTPServer`

**Storage**: Existing local app state and `localStorage` for non-sensitive preference/session metadata; no raw video, captured frames, camera device names, or camera device identifiers persisted

**Testing**: Vitest and Testing Library for renderer flows; Rust unit tests for Tauri command/state contracts; pytest for sidecar camera behavior and sidecar contract parity

**Target Platform**: Desktop Tauri app, with macOS camera permission as the primary packaging target and existing cross-platform renderer behavior preserved

**Project Type**: Desktop app with React renderer, Rust/Tauri shell, and Python sidecar posture engine

**Performance Goals**: Users with an available camera and granted permission reach visible preview within 5 seconds; measurement exit or camera hide stops new camera frame collection within 2 seconds; foreground stream remains suitable for posture overlay without blocking UI interaction

**Constraints**: Camera processing stays on the local device; local stream is restricted to loopback and requires a session-specific unpredictable token; no microphone access; no camera picker UI in this feature; no persisted raw frames or device identifiers

**Scale/Scope**: One active user session per desktop app instance; foreground preview, calibration, dashboard measurement, and background mode interactions share the same local camera engine ownership model

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v1.0.0 applies to this plan. The feature must satisfy these project gates:

- Keep changes within the existing feature-sliced React layout, Tauri command/state modules, and sidecar camera engine boundaries.
- Add or update tests where camera calculations, camera behavior, sidecar contracts, or user-facing flows change.
- Preserve privacy-sensitive constraints: no secrets, generated bundles, raw camera frames, or device identifiers committed.
- Document renderer/Tauri/sidecar contract changes through the feature plan, data model, contracts, and task artifacts before implementation.
- Run `pnpm run lint:check`, `pnpm run typecheck`, `pnpm run test`, and focused sidecar pytest before review.

**Gate Result**: PASS. No constitution violation identified.

## Project Structure

### Documentation (this feature)

```text
specs/016-camera-stream-permission/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── camera-stream-permission.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
migration/
├── src/
│   ├── entities/posture/model/
│   │   ├── posture-types.ts
│   │   └── posture-engine-store.ts
│   ├── features/posture-engine/
│   │   ├── lib/tauri-posture-engine.ts
│   │   ├── model/use-auto-start-posture-engine.ts
│   │   ├── model/use-posture-engine.ts
│   │   └── ui/CameraPermissionModal.tsx
│   ├── pages/onboarding-page/components/CameraPermissionButton.tsx
│   ├── pages/calibration-page/components/WebcamView.tsx
│   └── shared/lib/camera-permission.ts
├── src-tauri/
│   ├── Info.plist
│   ├── Entitlements.plist
│   ├── SidecarEntitlements.plist
│   ├── tauri.conf.json
│   └── src/
│       ├── commands/posture_engine/
│       ├── posture_engine/sidecar.rs
│       └── state/posture_engine_state/
└── tests/unit/
    ├── pages/
    └── features/main-panels/

sidecar/posture-engine/
├── engine/background_camera.py
├── main.py
├── models/result.py
└── tests/
    ├── test_background_camera.py
    ├── test_posture_engine_service.py
    └── test_sidecar_contract.py
```

**Structure Decision**: Use the existing Tauri desktop architecture. Renderer UI and stores stay under `migration/src`, command/state contracts stay under `migration/src-tauri`, and camera capture/stream behavior stays in `sidecar/posture-engine`.

## Complexity Tracking

No constitution gate violations require complexity tracking.

## Phase 0: Research

Research is captured in [research.md](./research.md). All planning unknowns are resolved.

## Phase 1: Design & Contracts

- Data model: [data-model.md](./data-model.md)
- Interface contract: [contracts/camera-stream-permission.md](./contracts/camera-stream-permission.md)
- Verification quickstart: [quickstart.md](./quickstart.md)

## Post-Design Constitution Check

The design remains aligned with Constitution v1.0.0. The data model and contract artifact document renderer/Tauri/sidecar behavior, the task list includes layer-appropriate tests for camera and sidecar risks, and the privacy/security tasks preserve local-only camera handling with non-sensitive diagnostics.

**Gate Result**: PASS. No new constitution violation identified.
