# Implementation Plan: Camera Lifecycle State

**Branch**: `017-camera-lifecycle-state` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/017-camera-lifecycle-state/spec.md`

## Summary

Unify camera lifecycle state so UI surfaces no longer infer camera readiness from the user's show/hide/exit intent alone. The implementation will promote camera lifecycle to a single renderer-owned state record containing user intent, runtime readiness, stream availability, failure reason, and transition timestamp. `usePostureEngine` remains the runtime authority for stream readiness, while main preview, calibration preview, and running panel consume the same derived active predicate: intent is show, runtime is ready, and a usable stream URL exists.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19, Rust 2021, Python 3.11

**Primary Dependencies**: Tauri 2, Vite 7, Zustand, React Router, Vitest/Testing Library, existing Tauri posture-engine bridge, existing Python sidecar stream service

**Storage**: Existing local app state via persisted Zustand/localStorage for user intent and widget visibility; transient runtime readiness and stream URL stay in memory and must not persist tokens or raw camera data

**Testing**: Vitest and Testing Library for renderer store, hook, and panel behavior; existing Rust/pytest suites remain relevant only if a later task changes Tauri or sidecar contracts

**Target Platform**: Desktop Tauri app, with macOS camera behavior as the primary target and existing renderer behavior preserved

**Project Type**: Desktop app with React renderer, Rust/Tauri shell, and Python posture-engine sidecar

**Performance Goals**: Hide-to-show transitions must not animate running UI before actual camera readiness; stale stream references clear immediately when a new start, failure, cancellation, or stop begins; UI state changes remain synchronous from the user's perspective

**Constraints**: Camera frames remain local; stream tokens and URLs are not persisted; app window visibility/minimize/focus changes do not alter explicit camera show/hide/exit intent; implementation must preserve current feature-sliced boundaries

**Scale/Scope**: One active desktop user session; camera lifecycle consumed by calibration preview, main webcam panel, running panel, onboarding camera start, and posture-engine hook state. Calibration may request camera preparation for its route without overwriting the main screen's persisted camera intent.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v1.0.0 applies to this plan. The feature must satisfy these project gates:

- Keep renderer business state under `migration/src/entities` or `migration/src/features` according to current ownership, with route screens and panels consuming state instead of owning runtime policy.
- Add focused Vitest/Testing Library coverage for camera lifecycle transitions and UI readiness gating because this feature changes user-facing camera behavior.
- Preserve local-first camera privacy: no raw frames, stream tokens, camera device identifiers, or sensitive diagnostics persisted.
- Document state ownership and UI contracts before implementation because renderer/Tauri/sidecar camera behavior crosses runtime boundaries.
- Run `pnpm run lint:check`, `pnpm run typecheck`, `pnpm run test`, and focused tests for changed renderer areas before review.

**Gate Result**: PASS. No constitution violation identified.

## Project Structure

### Documentation (this feature)

```text
specs/017-camera-lifecycle-state/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── camera-lifecycle-state.md
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
│   ├── features/main-panels/
│   │   ├── model/
│   │   │   ├── use-camera-store.ts
│   │   │   └── __tests__/use-camera-store.test.ts
│   │   └── ui/
│   │       ├── WebcamPanel.tsx
│   │       ├── MiniRunningPanel.tsx
│   │       └── __tests__/
│   ├── features/posture-engine/
│   │   ├── lib/tauri-posture-engine.ts
│   │   └── model/use-posture-engine.ts
│   └── pages/
│       ├── calibration-page/
│       │   ├── index.tsx
│       │   └── components/WebcamView.tsx
│       └── onboarding-page/components/CameraPermissionButton.tsx
└── tests/unit/
    └── pages/
```

**Structure Decision**: Use the existing Tauri desktop architecture. Camera user intent remains with the main-panels camera store unless implementation finds a lower-level entity migration is required; actual runtime readiness is recorded in posture engine state because `usePostureEngine` owns stream readiness. UI surfaces consume a shared lifecycle shape or selector instead of duplicating readiness inference.

## Complexity Tracking

No constitution gate violations require complexity tracking.

## Phase 0: Research

Research is captured in [research.md](./research.md). All planning unknowns are resolved.

## Phase 1: Design & Contracts

- Data model: [data-model.md](./data-model.md)
- Interface contract: [contracts/camera-lifecycle-state.md](./contracts/camera-lifecycle-state.md)
- Verification quickstart: [quickstart.md](./quickstart.md)

## Post-Design Constitution Check

The design remains aligned with Constitution v1.0.0. The data model defines state ownership and transitions, the contract artifact defines UI activation rules and store/hook responsibilities, and verification focuses on renderer behavior where this feature changes risk. No Tauri or sidecar contract change is required for the planned scope, so Rust and pytest are not mandatory unless implementation expands into those layers.

**Gate Result**: PASS. No new constitution violation identified.
