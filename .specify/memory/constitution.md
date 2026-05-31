<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Template principle 1 -> I. Preserve Existing Architecture Boundaries
- Template principle 2 -> II. Test Risky Behavior at the Right Layer
- Template principle 3 -> III. Privacy and Local-First Camera Data
- Template principle 4 -> IV. Explicit Contracts Across Renderer, Tauri, and Sidecar
- Template principle 5 -> V. Verifiable Quality Gates
Added sections:
- Repository Constraints
- Development Workflow
Removed sections:
- Template sections
Templates requiring updates:
- Reviewed .specify/templates/plan-template.md; generic Constitution Check remains compatible
- Reviewed .specify/templates/spec-template.md; no constitution-specific section changes required
- Reviewed .specify/templates/tasks-template.md; existing test/phase guidance remains compatible
Follow-up items:
- None
-->
# GBGR Migration Constitution

## Core Principles

### I. Preserve Existing Architecture Boundaries

Implementation MUST follow the repository's established Tauri desktop architecture:
React renderer code lives under `migration/src`, native shell and command state live
under `migration/src-tauri`, and posture camera/analysis behavior lives under
`sidecar/posture-engine`. Feature-sliced React boundaries MUST be respected:
shared primitives in `shared`, business state in `entities`, flows in `features`,
route screens in `pages`, and app surfaces in `widgets`.

Rationale: this project already has clear ownership boundaries. Keeping changes
inside the correct layer limits regression scope and keeps future migration work
traceable.

### II. Test Risky Behavior at the Right Layer

Changes to camera behavior, sidecar contracts, posture calculations, classifier
behavior, score smoothing, calibration, session state, or user-facing recovery
flows MUST include focused tests at the layer where the risk exists. Renderer
flows use Vitest and Testing Library. Tauri command/state contracts use Rust
tests. Sidecar camera and posture-engine contracts use pytest.

Rationale: camera and posture measurement regressions often cross process
boundaries. Tests must pin the behavior where it can actually break.

### III. Privacy and Local-First Camera Data

Camera frames and raw video MUST remain on the user's device unless a future
spec explicitly introduces a reviewed external transfer requirement. Diagnostic
state MUST NOT persist raw video, captured frames, camera device names, camera
device identifiers, stream tokens, signing keys, Apple credentials, API secrets,
generated bundles, `node_modules`, or virtual environments.

Rationale: camera data is sensitive. The default posture is local processing and
minimal non-sensitive diagnostics.

### IV. Explicit Contracts Across Renderer, Tauri, and Sidecar

Cross-boundary behavior between the renderer, Tauri commands, and the Python
sidecar MUST be documented through specs, plans, tasks, or contract artifacts
before implementation. Contract changes MUST define request/response shape,
error codes, state ownership, and recovery behavior. User-facing errors MUST map
to actionable guidance.

Rationale: this project depends on multiple runtimes. Explicit contracts prevent
silent drift between TypeScript, Rust, and Python behavior.

### V. Verifiable Quality Gates

Before review, relevant changes MUST run the project checks listed in this
constitution and in `AGENTS.md`: `pnpm run lint:check`, `pnpm run typecheck`,
`pnpm run test`, and focused sidecar pytest when sidecar behavior changes.
Packaging or release-facing changes SHOULD also run the appropriate build
command.

Rationale: the project uses generated bundles, native packaging, and camera
sidecars. Verification must be concrete and reproducible.

## Repository Constraints

- Frontend and Tauri commands run from `migration/`.
- TypeScript, TSX, JSON, and CSS follow the configured Biome style.
- Python sidecar work targets Python 3.11 and uses tests under
  `sidecar/posture-engine/tests/`.
- Release-only configuration belongs in GitHub Secrets or existing release
  scripts under `migration/scripts/`; ad hoc packaging steps are discouraged.
- Existing user changes in the working tree MUST NOT be reverted unless the user
  explicitly requests it.

## Development Workflow

1. Specify user value and measurable success criteria before planning.
2. Clarify high-impact ambiguity before implementation.
3. Plan cross-runtime contracts and data models before task generation.
4. Generate task lists by independently testable user story.
5. Implement tests before behavior changes when the task list calls for tests.
6. Validate with the relevant renderer, Tauri, and sidecar checks before review.

## Governance

This constitution supersedes informal practices when it conflicts with generated
Spec Kit artifacts. Amendments require an explicit constitution update, a
summary of changed principles, and a semantic version bump:

- MAJOR for removing or redefining a core principle.
- MINOR for adding a principle or materially expanding governance.
- PATCH for wording clarifications that do not change obligations.

All new specs, plans, tasks, and implementation reviews MUST check for alignment
with these principles. If a feature needs to violate a principle, the plan MUST
record the violation and justify why the simpler compliant alternative is not
acceptable.

**Version**: 1.0.0 | **Ratified**: 2026-06-01 | **Last Amended**: 2026-06-01
