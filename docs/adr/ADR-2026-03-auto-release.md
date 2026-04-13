# ADR-2026-03: PR Merge Auto Release

## Status

Accepted

## Context

기존 배포 경로는 `vX.Y.Z` 태그가 푸시될 때만 Electron 릴리즈와 GitHub Release 생성을 시작한다.
이 구조는 산출물 배포와 업데이트 메타데이터 업로드에는 안정적이지만, 머지 직후 릴리즈를
시작하려면 사람이 직접 버전을 수정하고 태그를 만들어야 했다.

## Decision

1. `main`에 머지된 PR은 `Auto Release` 워크플로가 감지한다.
2. 오케스트레이션은 `lint`, `typecheck`, `build` 체크가 모두 성공한 경우에만 진행한다.
3. 버전 증가는 PR label `release:major`, `release:minor`, `release:patch` 중 정확히 하나로만 판정한다.
4. 오케스트레이션은 `package.json` 버전을 동기화한 뒤 `chore(release): prepare vX.Y.Z` 커밋과 `vX.Y.Z` 태그를 함께 푸시한다.
5. 기존 `.github/workflows/electron-release.yml`과 `.github/workflows/release.yml`은 태그 기반 소비자 역할을 유지한다.
6. 수동 `workflow_dispatch` 릴리즈는 `auto_release_recovery`, `approved_hotfix`, `operator_intervention` 예외 사유가 있을 때만 허용한다.
7. 실패 요약은 오케스트레이션과 플랫폼 릴리즈 양쪽에서 동일한 요약 스크립트를 통해 남긴다.

## Consequences

- 릴리즈 시작 경로는 자동화되지만, 태그 기반 배포와 auto-update 메타데이터 위치는 유지된다.
- 버전 source of truth는 계속 `package.json` 하나로 남는다.
- 플랫폼 일부 실패와 updater metadata 실패를 별도 단계로 보고해 rollback 판단 근거를 남길 수 있다.
- 자동 경로가 실패해도 승인된 예외 사유가 있는 경우에만 수동 릴리즈를 실행할 수 있다.
