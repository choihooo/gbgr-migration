# Data Model: PR Merge Auto Release

## 1. Release Candidate

- **설명**: `main`에 머지된 커밋 중 아직 정식 릴리즈로 확정되지 않은 배포 후보.
- **필드**
  - `candidate_id`: 실행 단위 식별자
  - `base_branch`: 기준 브랜치 이름
  - `head_sha`: 릴리즈 후보 커밋 SHA
  - `merged_pr_numbers`: 포함된 PR 번호 목록
  - `last_released_tag`: 직전 안정 태그
  - `status`: `pending | versioned | tagged | released | failed`
- **검증 규칙**
  - `head_sha`는 릴리즈 실행 시점의 기본 브랜치 HEAD와 일치해야 한다.
  - 이미 릴리즈된 `head_sha`는 새 후보가 될 수 없다.

## 2. Version Decision

- **설명**: 후보 변경에 대해 계산된 다음 정식 버전과 판정 근거.
- **필드**
  - `current_version`: 현재 정식 버전
  - `next_version`: 새 정식 버전
  - `bump_type`: `major | minor | patch`
  - `decision_source`: 판정 근거 메타데이터
  - `decision_reason`: 판정 설명
  - `validated_at`: 판정 시각
- **검증 규칙**
  - `next_version`는 `current_version`보다 커야 한다.
  - `decision_source`가 없으면 상태를 `invalid`로 간주하고 배포를 시작하지 않는다.

## 3. Release Execution

- **설명**: 실제 자동 릴리즈 실행의 단계별 기록.
- **필드**
  - `execution_id`: 실행 식별자
  - `candidate_id`: 연결된 Release Candidate
  - `trigger_event`: 실행 시작 이벤트
  - `started_at`: 시작 시각
  - `finished_at`: 종료 시각
  - `stage_statuses`: 단계별 상태 목록
  - `overall_status`: `success | partial_failure | failure`
- **검증 규칙**
  - `overall_status=success`이면 모든 필수 단계가 성공이어야 한다.
  - 플랫폼 배포 실패가 1건이라도 있으면 `overall_status=success`가 될 수 없다.

## 4. Release Stage Status

- **설명**: 릴리즈 내부 단계별 결과.
- **필드**
  - `stage_name`: `quality_gate | version_decision | version_sync | tag_push | release_notes | mac_release | win_release | updater_metadata`
  - `status`: `pending | running | success | failure | skipped`
  - `summary`: 단계 요약
  - `artifact_refs`: 관련 산출물 또는 로그 참조
- **상태 전이**
  - `pending -> running -> success|failure|skipped`
  - 실패한 필수 단계 이후 후속 단계는 `skipped`가 될 수 있다.

## 5. Release Outcome

- **설명**: 사용자와 운영팀이 최종적으로 참조하는 정식 배포 결과.
- **필드**
  - `version`: 공개 버전
  - `tag`: Git tag
  - `release_notes_status`: 생성 여부
  - `platform_results`: mac/win 결과
  - `updater_metadata_ready`: 자동 업데이트 메타데이터 준비 여부
  - `rollback_recommended`: 롤백 필요 여부
- **검증 규칙**
  - `updater_metadata_ready=true`이려면 필요한 플랫폼 메타데이터 업로드가 완료돼야 한다.
  - `rollback_recommended=true`이면 운영 요약에 근거가 포함돼야 한다.
