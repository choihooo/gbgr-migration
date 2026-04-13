# Research: PR Merge Auto Release

## Decision 1: 태그 기반 릴리즈는 유지하고, 머지 후 자동 태그 생성 계층만 추가한다

- **Decision**: 기존 `v*` 태그 기반 릴리즈 워크플로는 그대로 유지하고, `main` 머지 후
  다음 버전을 산정해 태그를 생성하는 신규 오케스트레이션 워크플로를 추가한다.
- **Rationale**: 저장소에는 이미 태그 푸시를 기준으로 Electron 빌드, GitHub Release 작성,
  `latest.yml`/`latest-mac.yml` 업로드가 구현되어 있다. 기존 경로를 재사용하면 auto-update
  메타데이터 경로를 다시 설계할 필요가 없다.
- **Alternatives considered**:
  - 기존 `electron-release.yml`을 `push: main` 기반으로 직접 전환:
    태그 없는 릴리즈와 version source-of-truth 분리가 발생해 제외.
  - 수동 `workflow_dispatch`만 유지:
    사용자 요구인 “PR 머지 시 즉시 배포”를 만족하지 못해 제외.

## Decision 2: 버전 판정은 명시적 메타데이터 기반으로 수행하고, 정보가 없으면 실패시킨다

- **Decision**: 자동 버전 증가는 PR 메타데이터 또는 머지 커밋 규약으로 판정하고, 판정
  정보가 없으면 배포를 중단한다.
- **Rationale**: 릴리즈 안정화의 핵심은 잘못된 자동 배포를 막는 것이다. 추정 기반 version
  bump는 오탐 배포와 롤백 비용을 키우므로 허용하지 않는다.
- **Alternatives considered**:
  - 모든 머지를 patch 자동 증가:
    breaking change와 feature release를 구분하지 못해 제외.
  - 변경 파일 diff 기반 자동 추론:
    규칙이 복잡하고 팀이 예측하기 어려워 제외.

## Decision 3: 버전 source of truth는 `package.json` 단일 파일로 유지한다

- **Decision**: 다음 버전은 `package.json`을 기준으로 계산하고, 태그와 릴리즈 산출물은
  해당 값을 참조하도록 맞춘다.
- **Rationale**: 저장소의 앱 버전과 빌드 스크립트는 이미 `package.json`을 기준으로 읽는다.
  단일 기준을 유지해야 앱 표시 버전, GitHub Release 태그, updater 메타데이터 간 불일치를
  막을 수 있다.
- **Alternatives considered**:
  - 태그를 source of truth로 전환:
    앱 번들 버전과의 동기화 추가 작업이 필요해 제외.
  - 별도 version manifest 파일 도입:
    단기 기능 범위에 비해 관리 포인트가 늘어나 제외.

## Decision 4: 중복 방지는 직렬 실행과 마지막 릴리즈 기준 검증을 함께 사용한다

- **Decision**: `main` 기준 단일 concurrency group을 적용하고, 실행 시점에 마지막 성공
  태그와 현재 HEAD를 비교해 같은 커밋에 대한 중복 릴리즈를 차단한다.
- **Rationale**: 연속 머지 상황에서는 이벤트 중복이 자연스럽게 발생할 수 있다. queue와
  상태 검증을 동시에 두어야 동일 버전 재생성을 막을 수 있다.
- **Alternatives considered**:
  - concurrency만 사용:
    재시도나 rerun 상황의 중복 태그를 완전히 막지 못해 제외.
  - 태그 존재 여부만 확인:
    잘못된 태그 또는 partial failure 상황 구분이 부족해 제외.

## Decision 5: 실패 상태는 “버전 결정 실패 / 태그 생성 실패 / 플랫폼 배포 실패 / 메타데이터 업로드 실패”로 분리한다

- **Decision**: 자동 릴리즈 실패는 운영 대응이 가능한 단계 단위 상태로 기록하고 요약한다.
- **Rationale**: 현재 릴리즈 파이프라인은 mac/win 병렬 실행과 릴리즈 노트 생성을 포함한다.
  실패 지점을 분리하지 않으면 partial success와 rollback 필요 여부를 판단하기 어렵다.
- **Alternatives considered**:
  - 단일 실패 상태:
    원인 파악과 운영 대응이 느려져 제외.
  - 플랫폼별 세부 상태만 표시:
    버전/태그 선행 실패를 설명하지 못해 제외.

## Decision 6: 운영용 관측성은 제품 analytics와 분리한다

- **Decision**: 릴리즈 오케스트레이션 로그와 요약은 GitHub Actions 로그, step outputs,
  release summary, changelog/ADR 갱신으로 관리하고, 제품 사용자 analytics에는 포함하지 않는다.
- **Rationale**: 이 기능은 개발/운영 자동화다. 사용자 행동 analytics 스키마에 섞으면
  제품 이벤트 품질이 떨어진다.
- **Alternatives considered**:
  - 기존 GA 이벤트에 릴리즈 이벤트 추가:
    제품 analytics 책임 범위를 벗어나 제외.
  - 로그 없이 릴리즈 페이지 결과만 확인:
    실패 단계 확인 시간이 길어져 제외.
