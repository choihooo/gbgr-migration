# Quickstart: PR Merge Auto Release

## 목적

`main` 머지 후 자동 버전업과 태그 기반 배포가 실제로 끊김 없이 동작하는지 검증한다.

## 사전 조건

1. 배포용 GitHub Secrets가 기존 태그 릴리즈와 동일하게 설정되어 있어야 한다.
2. 기본 브랜치 보호 규칙에서 CI 필수 체크가 merge 전 완료되도록 설정되어 있어야 한다.
3. 버전 판정에 필요한 PR 메타데이터 규칙이 팀에 공유되어 있어야 한다.

## 검증 절차

1. 테스트용 PR을 준비한다.
   - 배포 대상 변경을 포함한다.
   - 버전 증가 판정 메타데이터를 명시한다.
   - 허용 label은 `release:major`, `release:minor`, `release:patch` 중 정확히 하나다.
2. PR이 `Biome`, `typecheck`, `build`를 모두 통과하는지 확인한다.
3. PR을 `main`에 머지한다.
4. 자동 릴리즈 오케스트레이션이 즉시 시작되는지 확인한다.
   - `.github/workflows/auto-release.yml`에서 `Prepare release candidate` 단계가 성공해야 한다.
   - Actions Summary에 현재 HEAD, 계산된 버전, 태그 후보가 기록되어야 한다.
5. 다음 항목을 순서대로 검증한다.
   - 새 버전이 계산되었는가
   - `package.json`과 태그 버전이 일치하는가
   - `vX.Y.Z` 태그가 생성되었는가
   - 기존 Electron release workflow가 발화했는가
   - mac/win 산출물이 생성되었는가
   - `latest.yml`과 `latest-mac.yml`이 릴리즈에 업로드되었는가
   - release notes가 생성되었는가
6. 실패 테스트를 수행한다.
   - 버전 판정 메타데이터가 없는 PR을 머지하지 않고 dry-run 검증한다.
   - 플랫폼 한쪽만 실패하는 시나리오에서 결과가 `partial_failure`로 요약되는지 확인한다.
   - updater metadata 업로드가 실패하면 `updater_metadata_incomplete`로 요약되는지 확인한다.
7. 앱 업데이트 경로를 검증한다.
   - 새 태그 릴리즈 후 앱이 업데이트 가능 상태를 감지하는지 확인한다.

## 수동 예외 릴리즈 점검

1. 일반 릴리즈는 수동 `workflow_dispatch`로 실행하지 않는다.
2. 자동 경로 복구가 필요한 경우에만 `Electron Release` 워크플로를 수동 실행한다.
3. 수동 실행 시 `reason`은 `auto_release_recovery`, `approved_hotfix`, `operator_intervention` 중 하나여야 한다.
4. `approval_reference`에 티켓 또는 운영 승인 근거를 남긴다.

## 실패 해석 및 롤백 판단

- `release_not_started`: 품질 게이트, 버전 판정, 태그 생성 전 단계 실패다. 태그와 산출물이 없으므로 롤백보다 원인 수정 후 재실행이 우선이다.
- `partial_platform_release`: 한 플랫폼만 배포된 상태다. 마지막 안정 태그 기준으로 롤백 여부를 즉시 판단해야 한다.
- `updater_metadata_incomplete`: 플랫폼 산출물은 있으나 자동 업데이트 메타데이터가 불완전하다. auto-update 노출 전 메타데이터 복구가 필요하다.
- `release_notes_missing`: 산출물은 있으나 릴리즈 설명이 비어 있거나 불완전하다. 태그 재배포 없이 notes만 복구하면 된다.

## 최종 구현 메모

- `package.json` 버전과 `vX.Y.Z` 태그는 같은 준비 커밋에서 함께 생성된다.
- 실패 요약은 `scripts/release/summarize-release-failure.mjs`를 기준으로 오케스트레이션과 플랫폼 릴리즈에서 공통 생성한다.
- 릴리즈 회귀 검증은 `pnpm run release:validate`로 수행한다.

## 기대 결과

- 머지 후 5분 내 새 버전이 결정된다.
- 사람의 수동 태그 생성 없이 기존 Electron 릴리즈가 시작된다.
- 실패 시 어느 단계에서 멈췄는지 Actions Summary에서 바로 확인할 수 있다.
- 업데이트 메타데이터가 유지되어 기존 auto-update 클라이언트가 새 버전을 인지한다.
