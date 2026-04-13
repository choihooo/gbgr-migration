# Contract: Release Automation

## 목적

`main` 머지 이후 자동 릴리즈 오케스트레이션이 기존 태그 기반 Electron 릴리즈 경로와
어떻게 연결되는지 정의한다.

## Trigger Contract

- **입력 이벤트**: 기본 브랜치(`main`)에 대한 merge 완료
- **선행 조건**
  - 필수 CI 체크 성공
  - 배포 판정 메타데이터 존재
  - 현재 HEAD가 마지막 안정 릴리즈와 다름
- **거부 조건**
  - 이미 같은 HEAD로 릴리즈가 시작되었음
  - 버전 판정 정보 누락
  - 이전 릴리즈가 아직 직렬 실행 중

### Required Quality Gate

- **필수 체크**
  - `lint`
  - `typecheck`
  - `build`
- **보장**
  - 대상 HEAD SHA에 대해 위 세 체크가 모두 `success`여야 한다.
  - 셋 중 하나라도 `success`가 아니면 오케스트레이션은 태그를 만들지 않고 실패 종료한다.

## Version Decision Contract

- **입력**
  - 현재 정식 버전
  - 머지된 PR의 release label
  - 마지막 안정 태그
- **허용 release label**
  - `release:major`
  - `release:minor`
  - `release:patch`
- **출력**
  - `current_version`
  - `next_version`
  - `bump_type`
  - `decision_reason`
- **보장**
  - `next_version`는 semver 증가 규칙을 따른다.
  - 판정 근거가 없으면 실패로 종료한다.
- **실패 조건**
  - 허용되지 않은 label
  - release label 누락
  - release label 2개 이상 동시 존재

## Tagging Contract

- **입력**
  - `next_version`
  - version sync 완료 상태
- **출력**
  - `vX.Y.Z` 형식의 새 태그
- **보장**
  - 태그는 한 번만 생성된다.
  - 같은 버전 태그가 이미 존재하면 실패 처리한다.

## Existing Release Workflow Contract

- **트리거 대상**
  - `.github/workflows/electron-release.yml`
  - `.github/workflows/release.yml`
- **입력**
  - `vX.Y.Z` 태그 push
- **출력**
  - mac/win 산출물
  - GitHub Release
  - `latest.yml`, `latest-mac.yml`
  - release notes
- **보장**
  - 자동 업데이트 클라이언트는 기존 메타데이터 파일 위치를 그대로 사용한다.
  - 플랫폼 일부 실패는 전체 성공으로 승격하지 않는다.

## Failure Summary Contract

- **필수 요약 필드**
  - `execution_id`
  - `version`
  - `failed_stage`
  - `impact_scope`
  - `next_action`
  - `rollback_recommended`
- **소비자**
  - GitHub Actions Summary
  - 운영자 수동 확인 로그

## Manual Release Exception Contract

- **허용 상황**
  - 자동 릴리즈 워크플로 자체 장애
  - GitHub Actions 재실행만으로 복구되지 않는 운영 개입 필요 상황
  - 승인된 hotfix 운영 절차 수행 상황
- **금지 상황**
  - 일반적인 `main` merge 배포
  - 자동 릴리즈가 정상 동작 가능한 상황에서의 임의 수동 배포
- **보장**
  - 수동 릴리즈 실행 시 실행 사유가 workflow input 또는 summary에 기록되어야 한다.
  - 수동 릴리즈는 자동 릴리즈의 기본 경로를 대체하지 않는다.

## Rollback Decision Contract

- **입력**
  - 마지막 안정 태그
  - 현재 릴리즈 단계 결과
  - updater metadata 준비 여부
- **출력**
  - `rollback_recommended=true|false`
  - 판단 근거 문장
- **보장**
  - 부분 배포 실패는 명시적으로 표시된다.
  - 롤백 권고는 근거 없이 생성되지 않는다.
