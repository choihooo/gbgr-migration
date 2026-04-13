# Implementation Plan: PR Merge Auto Release

**Branch**: `001-auto-release-versioning` | **Date**: 2026-03-27 | **Spec**: [/Users/choiho/coding/gbgr/bugi/specs/001-auto-release-versioning/spec.md](/Users/choiho/coding/gbgr/bugi/specs/001-auto-release-versioning/spec.md)
**Input**: Feature specification from `/specs/001-auto-release-versioning/spec.md`

## Summary

PR이 `main`에 머지되면 자동으로 다음 버전을 판정하고 태그를 생성해 기존 태그 기반
Electron 릴리즈 파이프라인을 발화한다. 새 설계는 기존
`.github/workflows/electron-release.yml`과 `.github/workflows/release.yml`을 유지하면서,
그 앞단에 머지 감지, 버전 결정, 중복 방지, 실패 상태 요약을 담당하는 오케스트레이션
경로를 추가한다.

## Technical Context

**Language/Version**: TypeScript 5.9, Node.js 20, GitHub Actions YAML  
**Primary Dependencies**: GitHub Actions, pnpm, electron-builder, electron-updater, Git metadata  
**Storage**: Git tags, GitHub Releases metadata, workflow run logs, repository files (`package.json`, workflow config)  
**Testing**: GitHub Actions dry-run style validation, workflow-level integration checks, release-path manual verification  
**Target Platform**: GitHub-hosted CI runners, macOS and Windows release targets, Electron desktop auto-update consumers  
**Project Type**: Electron desktop-app with GitHub Actions based CI/CD  
**Performance Goals**: `main` 머지 후 5분 이내 버전 결정 및 릴리즈 시작, 중복 릴리즈 0건  
**Constraints**: 태그 기반 릴리즈 유지, `vX.Y.Z` 규칙 유지, 기존 auto-update 메타데이터 업로드와 호환, 실패 시 오탐 배포 금지  
**Scale/Scope**: 저장소 단일 릴리즈 파이프라인, main merge 이벤트 기준 정식 배포 자동화, 기존 수동 dispatch는 예외 경로로 유지

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Renderer changes do not import or call Node.js/Electron APIs directly; all system access flows through preload `contextBridge`.
  - Pass: 본 기능의 주 구현 대상은 GitHub Actions와 버전 파일 업데이트 경로다. renderer 직접 권한 추가는 계획하지 않는다.
- Preload/API contract changes list channel names, payload validation, affected main/preload/renderer files, and migration impact.
  - Pass: preload 계약 변경은 기본 범위에서 제외한다. 배포 상태 UI 노출이 필요해지면 별도 읽기 전용 계약으로 한정한다.
- Renderer design respects FSD dependency order: `app > pages > widgets > features > entities > shared`.
  - Pass: renderer 신규 변경이 필요해도 릴리즈 표시용 읽기 전용 레이어만 허용하며 FSD 상향 참조를 추가하지 않는다.
- State ownership is explicit: Zustand for client/runtime state, TanStack Query for server state and cache.
  - Pass: 앱 상태관리 변경은 계획 범위 밖이다. 운영 상태가 필요해도 저장소 자동화 기록과 앱 표시 상태를 분리한다.
- Feature scope identifies regression verification for posture judgment, session lifecycle, notification flow, and widget sync when affected.
  - Pass: 이 기능은 release flow 변경이며 자세/세션/알림/위젯 로직을 변경하지 않는다. 대신 릴리즈 회귀 검증을 필수로 둔다.
- Plan includes observability impact: analytics schema changes, required logs, and release-note or ADR updates when architecture changes.
  - Pass: 운영용 릴리즈 이벤트 로그, 실패 단계 기록, ADR, release note 갱신을 포함한다.
- Release-affecting work documents version/tag impact, update metadata impact, and rollback trigger.
  - Pass: 버전 결정 규칙, 태그 생성, `latest.yml`/`latest-mac.yml` 유지, 부분 실패/롤백 조건을 설계에 포함한다.

**Post-Design Re-check**: Phase 1 설계 후에도 gate 위반 없음. 릴리즈 오케스트레이션은 renderer 보안 경계와 독립적으로 유지되고, 모든 변경은 CI/workflow/버전 파일/문서 범위로 제한된다.

## Project Structure

### Documentation (this feature)

```text
specs/001-auto-release-versioning/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── release-automation.md
└── tasks.md
```

### Source Code (repository root)

```text
.github/
└── workflows/
    ├── ci.yml
    ├── electron-build-pr.yml
    ├── electron-release.yml
    ├── release.yml
    └── auto-release.yml              # 신규: merge -> version -> tag orchestration

scripts/
└── release/
    ├── determine-version.mjs         # 신규: next semver decision
    ├── prepare-release.mjs           # 신규: package.json/release metadata sync
    └── summarize-release-failure.mjs # 신규: failure summary output

package.json                          # version source of truth
README.md                             # release workflow summary
docs/
└── adr/
    └── ADR-xxxx-auto-release.md      # 신규: release decision policy
```

**Structure Decision**: 기존 Electron 단일 저장소 구조를 유지하고, 앱 런타임 코드는 건드리지
않는다. 배포 자동화는 `.github/workflows`와 `scripts/release`에 집중시켜 renderer/main/preload
경계를 오염시키지 않는다.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 없음 | N/A | 기존 태그 릴리즈를 재사용하는 설계로 복잡도 증가를 제한한다. |
