# Tasks: PR Merge Auto Release

**Input**: Design documents from `/Users/choiho/coding/gbgr/bugi/specs/001-auto-release-versioning/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/release-automation.md`, `quickstart.md`

**Tests**: Include workflow-level dry-run validation and Node-based release script tests because this feature changes release behavior, tag creation, updater metadata handling, and rollback visibility.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the repository locations and command surfaces needed for release automation work.

- [X] T001 Create release automation directories and placeholder keep files in `/Users/choiho/coding/gbgr/bugi/scripts/release/.gitkeep` and `/Users/choiho/coding/gbgr/bugi/tests/release/.gitkeep`
- [X] T002 Update release validation commands in `/Users/choiho/coding/gbgr/bugi/package.json` for Node-based release script tests and workflow smoke checks
- [X] T003 [P] Create the ADR folder and seed the architecture record in `/Users/choiho/coding/gbgr/bugi/docs/adr/ADR-2026-03-auto-release.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared helpers, fixtures, and CI wiring required by all user stories.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [X] T004 Implement shared GitHub/tag/version context helpers in `/Users/choiho/coding/gbgr/bugi/scripts/release/shared.mjs`
- [X] T005 [P] Create merge, tag, and release outcome fixtures in `/Users/choiho/coding/gbgr/bugi/tests/release/fixtures/merge-events.json` and `/Users/choiho/coding/gbgr/bugi/tests/release/fixtures/release-outcomes.json`
- [X] T006 [P] Add a reusable Node test harness for release scripts in `/Users/choiho/coding/gbgr/bugi/tests/release/helpers/run-release-script.mjs`
- [X] T007 Add baseline release script contract coverage in `/Users/choiho/coding/gbgr/bugi/tests/release/shared-contract.test.mjs`
- [X] T008 Wire release automation validation into CI in `/Users/choiho/coding/gbgr/bugi/.github/workflows/ci.yml`

**Checkpoint**: Shared release automation infrastructure is ready for story work.

---

## Phase 3: User Story 1 - 머지 후 자동 릴리즈 시작 (Priority: P1) 🎯 MVP

**Goal**: Start release orchestration automatically on `main` merges, prevent duplicate runs for the same HEAD, and hand off to the existing tag-based release path.

**Independent Test**: Merge-equivalent workflow input targeting `main` starts the orchestration, calculates a candidate version, refuses duplicate HEAD/tag combinations, and pushes a single `vX.Y.Z` tag without manual version entry.

### Tests for User Story 1

- [X] T009 [P] [US1] Add orchestration workflow trigger and duplicate-guard coverage in `/Users/choiho/coding/gbgr/bugi/tests/release/auto-release-workflow.test.mjs`
- [X] T010 [P] [US1] Add manual smoke-check instructions for merge-triggered release start in `/Users/choiho/coding/gbgr/bugi/specs/001-auto-release-versioning/quickstart.md`

### Implementation for User Story 1

- [X] T011 [US1] Implement merge event parsing, last-release lookup, and duplicate release candidate detection in `/Users/choiho/coding/gbgr/bugi/scripts/release/prepare-release.mjs`
- [X] T012 [US1] Create the orchestration workflow for merged PR release kickoff in `/Users/choiho/coding/gbgr/bugi/.github/workflows/auto-release.yml`
- [X] T013 [US1] Update tag-triggered build behavior to accept orchestration outputs and preserve manual exceptions in `/Users/choiho/coding/gbgr/bugi/.github/workflows/electron-release.yml`
- [X] T014 [US1] Add required-check gate verification for `lint`, `typecheck`, and `build` status in `/Users/choiho/coding/gbgr/bugi/scripts/release/prepare-release.mjs`
- [X] T015 [P] [US1] Add required-check failure coverage for blocked release starts in `/Users/choiho/coding/gbgr/bugi/tests/release/prepare-release-quality-gate.test.mjs`
- [X] T016 [US1] Restrict manual release dispatch to approved exception flows in `/Users/choiho/coding/gbgr/bugi/.github/workflows/electron-release.yml`

**Checkpoint**: A merged PR can trigger one and only one automated release kickoff through the existing tag pipeline.

---

## Phase 4: User Story 2 - 일관된 버전 규칙 보장 (Priority: P2)

**Goal**: Apply one deterministic version bump policy and keep `package.json`, tags, release notes, and updater-visible version data aligned.

**Independent Test**: Given release metadata for patch, minor, major, and invalid cases, the system produces the expected next version, rejects missing decision metadata, and keeps `package.json` and the created `vX.Y.Z` tag synchronized.

### Tests for User Story 2

- [X] T017 [P] [US2] Add semver decision matrix tests in `/Users/choiho/coding/gbgr/bugi/tests/release/determine-version.test.mjs`
- [X] T018 [P] [US2] Add version sync and tag payload tests in `/Users/choiho/coding/gbgr/bugi/tests/release/prepare-release.test.mjs`
- [X] T019 [US2] Implement PR release label parsing for `release:major`, `release:minor`, and `release:patch` in `/Users/choiho/coding/gbgr/bugi/scripts/release/determine-version.mjs`
- [X] T020 [P] [US2] Add invalid and duplicate release label cases in `/Users/choiho/coding/gbgr/bugi/tests/release/determine-version.test.mjs`

### Implementation for User Story 2

- [X] T021 [US2] Implement deterministic version decision logic with explicit metadata failure handling in `/Users/choiho/coding/gbgr/bugi/scripts/release/determine-version.mjs`
- [X] T022 [US2] Extend release preparation to sync `package.json` and emit tag/version outputs in `/Users/choiho/coding/gbgr/bugi/scripts/release/prepare-release.mjs`
- [X] T023 [US2] Update version consumption and release note generation in `/Users/choiho/coding/gbgr/bugi/.github/workflows/auto-release.yml`, `/Users/choiho/coding/gbgr/bugi/.github/workflows/electron-release.yml`, and `/Users/choiho/coding/gbgr/bugi/.github/workflows/release.yml`

**Checkpoint**: Automated releases follow one versioning policy and expose the same version string across package metadata, tags, and release outputs.

---

## Phase 5: User Story 3 - 실패 지점과 롤백 판단 가시화 (Priority: P3)

**Goal**: Summarize failure stage, impact scope, next action, and rollback recommendation across the orchestration and platform release path.

**Independent Test**: When versioning, tag creation, macOS build, Windows build, or updater metadata upload fails, the workflow summary identifies the failed stage, reports partial vs full failure correctly, and states whether rollback should be considered.

### Tests for User Story 3

- [X] T024 [P] [US3] Add failure summary and rollback recommendation coverage in `/Users/choiho/coding/gbgr/bugi/tests/release/summarize-release-failure.test.mjs`
- [X] T025 [P] [US3] Add partial-platform and metadata-upload failure fixtures in `/Users/choiho/coding/gbgr/bugi/tests/release/fixtures/release-failures.json`

### Implementation for User Story 3

- [X] T026 [US3] Implement release failure summarization and rollback recommendation logic in `/Users/choiho/coding/gbgr/bugi/scripts/release/summarize-release-failure.mjs`
- [X] T027 [US3] Publish stage summaries and failure outputs from the orchestration and build workflows in `/Users/choiho/coding/gbgr/bugi/.github/workflows/auto-release.yml` and `/Users/choiho/coding/gbgr/bugi/.github/workflows/electron-release.yml`
- [X] T028 [US3] Document failure interpretation and rollback decision guidance in `/Users/choiho/coding/gbgr/bugi/specs/001-auto-release-versioning/quickstart.md` and `/Users/choiho/coding/gbgr/bugi/docs/adr/ADR-2026-03-auto-release.md`

**Checkpoint**: Operators can identify the failing release stage quickly and make rollback decisions from recorded evidence.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize documentation and end-to-end validation across all stories.

- [X] T029 [P] Update release workflow documentation and manual-exception guidance in `/Users/choiho/coding/gbgr/bugi/README.md`
- [X] T030 Ensure generated GitHub Release notes include automated release policy context in `/Users/choiho/coding/gbgr/bugi/.github/workflows/release.yml`
- [X] T031 Run the quickstart validation flow and record final implementation notes in `/Users/choiho/coding/gbgr/bugi/specs/001-auto-release-versioning/quickstart.md`
- [X] T032 Document the operator deployment flow for automatic release, manual exception release, and rollback entry points in `/Users/choiho/coding/gbgr/bugi/README.md` and `/Users/choiho/coding/gbgr/bugi/specs/001-auto-release-versioning/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all story work.
- **Phase 3 (US1)**: Depends on Phase 2 and is the MVP because it creates the automatic release entry point.
- **Phase 4 (US2)**: Depends on Phase 3 because deterministic version outputs must plug into the new orchestration flow.
- **Phase 5 (US3)**: Depends on Phases 3 and 4 because failure reporting needs the orchestration and version/tag states to exist.
- **Phase 6 (Polish)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1**: Starts after Foundational and stands alone as the MVP.
- **US2**: Builds on US1 orchestration outputs to make versioning deterministic and consistent.
- **US3**: Builds on US1 and US2 to summarize failures and rollback signals.

### Within Each User Story

- Tests and validation tasks come before implementation tasks.
- Script logic lands before workflow wiring that consumes its outputs.
- Documentation updates follow working automation behavior, not placeholders.

### Parallel Opportunities

- `T003` can run in parallel with `T001`-`T002`.
- `T005` and `T006` can run in parallel after `T004` starts defining shared script interfaces.
- `T009` and `T010` can run in parallel for US1.
- `T017`, `T018`, and `T020` can run in parallel for US2 once the label contract is fixed.
- `T024` and `T025` can run in parallel for US3.
- `T029` can run in parallel with `T031` after story implementation is complete.

---

## Parallel Example: User Story 1

```bash
Task: "Add orchestration workflow trigger and duplicate-guard coverage in tests/release/auto-release-workflow.test.mjs"
Task: "Add manual smoke-check instructions for merge-triggered release start in specs/001-auto-release-versioning/quickstart.md"
```

## Parallel Example: User Story 2

```bash
Task: "Add semver decision matrix tests in tests/release/determine-version.test.mjs"
Task: "Add version sync and tag payload tests in tests/release/prepare-release.test.mjs"
```

## Parallel Example: User Story 3

```bash
Task: "Add failure summary and rollback recommendation coverage in tests/release/summarize-release-failure.test.mjs"
Task: "Add partial-platform and metadata-upload failure fixtures in tests/release/fixtures/release-failures.json"
```

---

## Implementation Strategy

### MVP First

1. Complete Phases 1-3 to create the merged-PR to tag orchestration path.
2. Validate that one merge produces one release kickoff with no duplicate tags.
3. Ship the MVP before tightening version policy and failure reporting.

### Incremental Delivery

1. Add deterministic version rules and package/tag synchronization in Phase 4.
2. Add operator-facing failure summaries and rollback guidance in Phase 5.
3. Finish with release-operator documentation and full quickstart verification in Phase 6.
