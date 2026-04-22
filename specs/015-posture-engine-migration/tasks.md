# Tasks: 자세 측정 엔진 분리 이관

**Input**: Design documents from `/specs/015-posture-engine-migration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: 이번 기능은 UI 동일성과 모드 전환 안정성이 핵심이므로 자동 테스트를 무조건 강제하지 않는다. 대신 고위험 전환 로직, 상태 계약, 레거시 알고리즘 의미 보존에는 필요한 범위의 테스트를 추가하고, `bun x tsc --noEmit`, `bun x biome check`, `cargo check`, 레거시 대비 수동 검증을 완료 기준으로 사용한다.

**Organization**: 작업은 사용자 스토리별로 그룹화하여 각 스토리가 독립적으로 구현·검증 가능하도록 구성한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 수행 가능 작업
- **[Story]**: 해당 작업이 속한 사용자 스토리
- 모든 작업 설명에는 정확한 파일 경로를 포함한다

## Path Conventions

- 마이그레이션 프런트엔드: `migration/src/`
- Tauri Rust 백엔드: `migration/src-tauri/src/`
- Python sidecar: `sidecar/posture-engine/`
- 기능 문서: `specs/015-posture-engine-migration/`
- 레거시 참조 전용 소스: `src/renderer/src/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 구현 범위, 계약, 선행 조건, 검증 기준을 현재 feature 기준으로 고정한다.

- [X] T001 `/home/choiho/coding/FE-migration/specs/015-posture-engine-migration/plan.md`, `/home/choiho/coding/FE-migration/specs/015-posture-engine-migration/research.md`, `/home/choiho/coding/FE-migration/specs/015-posture-engine-migration/contracts/posture-engine-bridge-contract.md`를 기준으로 구현 범위와 브리지 계약을 확인한다
- [X] T002 [P] 레거시 참조 기준 파일 `/home/choiho/coding/FE-migration/src/renderer/src/features/dashboard/ui/WebcamPanel.tsx`, `/home/choiho/coding/FE-migration/src/renderer/src/pages/calibration-page/index.tsx`, `/home/choiho/coding/FE-migration/src/renderer/src/entities/posture/lib/`의 재사용 의미를 정리한다
- [X] T003 [P] `/home/choiho/coding/FE-migration/specs/015-posture-engine-migration/quickstart.md` 기준으로 정적 검증, 최소화/복귀 검증, 레거시 비교 검증 절차를 구현 체크포인트로 고정한다
- [ ] T004 `/home/choiho/coding/FE-migration/specs/015-posture-engine-migration/plan.md`와 실제 migration 상태를 기준으로 auth/common UI/dashboard/onboarding 안정화 완료 여부를 확인하고 구현 착수 전제 조건으로 기록한다

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 사용자 스토리에서 공통으로 사용하는 자세 엔진 경계, 상태 모델, 레거시 알고리즘 보존 기반을 준비한다.

**⚠️ CRITICAL**: 이 단계가 끝나야 사용자 스토리 구현을 안정적으로 진행할 수 있다.

- [X] T005 `/home/choiho/coding/FE-migration/migration/src/entities/posture/model/posture-types.ts`에 측정 세션, 자세 측정 결과, 엔진 상태, 카메라 점유 상태 타입을 정의한다
- [X] T006 [P] `/home/choiho/coding/FE-migration/migration/src/entities/posture/model/posture-engine-store.ts`에 최신 결과, 엔진 상태, 카메라 소유권, 복귀 캐시를 관리하는 Zustand 스토어를 구현한다
- [X] T007 [P] `/home/choiho/coding/FE-migration/migration/src/features/posture-engine/lib/tauri-posture-engine.ts`에 `start_posture_engine`, `stop_posture_engine`, `push_posture_frame`, `start_background_measurement`, `stop_background_measurement`, `get_latest_posture_state` 호출 래퍼와 이벤트 구독 함수를 구현한다
- [X] T008 [P] `/home/choiho/coding/FE-migration/migration/src/features/posture-engine/model/use-posture-engine.ts`에 프런트엔드 공용 엔진 제어 훅을 구현해 T006, T007을 연결한다
- [X] T009 `/home/choiho/coding/FE-migration/migration/src-tauri/src/commands/posture_engine.rs`, `/home/choiho/coding/FE-migration/migration/src-tauri/src/state/posture_engine_state.rs`, `/home/choiho/coding/FE-migration/migration/src-tauri/src/posture_engine/mod.rs`, `/home/choiho/coding/FE-migration/migration/src-tauri/src/lib.rs`에 자세 엔진 command 등록과 상태 캐시 스캐폴드를 추가한다
- [X] T010 [P] `/home/choiho/coding/FE-migration/sidecar/posture-engine/main.py`, `/home/choiho/coding/FE-migration/sidecar/posture-engine/engine/__init__.py`, `/home/choiho/coding/FE-migration/sidecar/posture-engine/models/result.py`에 sidecar 엔트리포인트와 결과/상태 메시지 스키마 스캐폴드를 만든다
- [X] T011 `/home/choiho/coding/FE-migration/migration/src-tauri/capabilities/`와 `/home/choiho/coding/FE-migration/migration/src-tauri/Cargo.toml`에 자세 엔진 명령, sidecar 실행, 최소 권한 설정을 반영한다
- [X] T012 `/home/choiho/coding/FE-migration/sidecar/posture-engine/engine/calculations.py`, `/home/choiho/coding/FE-migration/sidecar/posture-engine/engine/score_processor.py`, `/home/choiho/coding/FE-migration/sidecar/posture-engine/engine/posture_classifier.py`에 레거시 `calculatePI`, `checkFrontality`, `ScoreProcessor`, `PostureClassifier` 의미 보존 포팅 기반을 추가한다

**Checkpoint**: TypeScript, Rust, Python이 같은 계약과 상태 모델을 공유하고, 레거시 알고리즘 보존 기반이 준비되어야 한다.

---

## Phase 3: User Story 1 - 화면이 보일 때 실시간 자세 피드백 유지 (Priority: P1) 🎯 MVP

**Goal**: 메인 화면과 보정 화면에서 레거시와 같은 카메라 미리보기와 자세 피드백을 실시간으로 표시한다.

**Independent Test**: `/main`과 `/onboarding/calibration`에 진입했을 때 카메라 미리보기와 자세 피드백이 함께 표시되고, 일부 결과 수신 실패 시에도 화면 전체가 깨지지 않아야 한다.

### Tests for User Story 1

- [X] T013 [P] [US1] `/home/choiho/coding/FE-migration/migration/src/features/posture-engine/model/use-posture-engine.test.ts`에 포그라운드 결과 수신과 스토어 반영 테스트를 추가한다
- [X] T014 [P] [US1] `/home/choiho/coding/FE-migration/sidecar/posture-engine/tests/test_legacy_parity.py`에 레거시 알고리즘 의미 보존을 위한 parity 표본 테스트를 추가한다

### Implementation for User Story 1

- [X] T015 [P] [US1] `/home/choiho/coding/FE-migration/migration/src/entities/posture/lib/overlay-mapper.ts`와 `/home/choiho/coding/FE-migration/migration/src/entities/posture/ui/PoseOverlayCanvas.tsx`에 랜드마크-오버레이 매핑과 캔버스 렌더링을 구현한다
- [X] T016 [US1] `/home/choiho/coding/FE-migration/migration/src/features/posture-engine/model/use-posture-engine.ts`에 포그라운드 엔진 시작, 프레임 전달, 결과 이벤트 수신 흐름을 완성한다
- [X] T017 [US1] `/home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/WebcamPanel.tsx`에 실시간 카메라 미리보기, 오버레이, 엔진 상태 배지를 연결하되 기존 UI 스타일을 유지한다
- [X] T018 [US1] `/home/choiho/coding/FE-migration/migration/src/pages/calibration-page/components/WebcamView.tsx`에 엔진 결과 기반 오버레이와 포즈 감지 상태 연결을 추가한다
- [X] T019 [US1] `/home/choiho/coding/FE-migration/migration/src/pages/calibration-page/index.tsx`와 `/home/choiho/coding/FE-migration/migration/src/pages/calibration-page/components/MeasuringPanel.tsx`에 보정 화면의 엔진 연결, 카운트다운 시작 조건, 품질 상태 소비를 연결한다
- [X] T020 [US1] `/home/choiho/coding/FE-migration/migration/src/pages/main-page/index.tsx`와 `/home/choiho/coding/FE-migration/migration/src/features/dashboard/ui/RightPanelArea.tsx`에 포그라운드 자세 엔진 구독을 연결해 메인 화면 문맥을 완성한다

**Checkpoint**: User Story 1이 완료되면 메인 화면과 보정 화면이 레거시와 같은 실시간 피드백 경험을 독립적으로 제공해야 한다.

---

## Phase 4: User Story 2 - 앱이 최소화되어도 측정 지속 (Priority: P2)

**Goal**: 앱이 최소화되거나 숨김 상태가 되어도 측정 세션을 유지하고, 알림 판단과 세션 기록을 이어가며, 복귀 시 최신 상태를 자연스럽게 이어준다.

**Independent Test**: 측정 시작 후 앱을 최소화했다가 복귀했을 때 세션이 유지되고, 백그라운드 결과가 알림 판단/세션 기록에 반영되며, 복귀 후 2초 이내에 최신 상태 또는 실시간 피드백이 다시 표시되어야 한다.

### Tests for User Story 2

- [X] T021 [P] [US2] `/home/choiho/coding/FE-migration/migration/src-tauri/src/posture_engine/tests/background_mode.rs`에 백그라운드 전환과 최신 상태 캐시 갱신 테스트를 추가한다
- [X] T022 [P] [US2] `/home/choiho/coding/FE-migration/migration/src-tauri/src/posture_engine/tests/session_recording.rs`에 백그라운드 결과의 알림 판단·세션 기록 연결 테스트를 추가한다

### Implementation for User Story 2

- [X] T023 [US2] `/home/choiho/coding/FE-migration/migration/src/features/posture-engine/model/use-window-visibility-sync.ts`에 창 표시/숨김 상태 감지와 엔진 모드 전환 트리거를 구현한다
- [X] T024 [US2] `/home/choiho/coding/FE-migration/migration/src-tauri/src/commands/posture_engine.rs`와 `/home/choiho/coding/FE-migration/migration/src-tauri/src/state/posture_engine_state.rs`에 백그라운드 측정 시작/중지와 최신 상태 조회 로직을 구현한다
- [X] T025 [US2] `/home/choiho/coding/FE-migration/sidecar/posture-engine/main.py`와 `/home/choiho/coding/FE-migration/sidecar/posture-engine/engine/background_camera.py`에 Python 카메라 직접 점유 기반 백그라운드 측정 루프를 구현한다
- [X] T026 [US2] `/home/choiho/coding/FE-migration/migration/src-tauri/src/posture_engine/notification_bridge.rs`, `/home/choiho/coding/FE-migration/migration/src-tauri/src/posture_engine/session_metrics.rs`, `/home/choiho/coding/FE-migration/migration/src/entities/session/` 연계 경로에 백그라운드 결과 기반 알림 판단과 세션 기록 적재를 구현한다
- [X] T027 [US2] `/home/choiho/coding/FE-migration/migration/src/features/posture-engine/model/use-posture-engine.ts`와 `/home/choiho/coding/FE-migration/migration/src/entities/posture/model/posture-engine-store.ts`에 복귀 직후 최신 상태 우선 표시와 실시간 재연결 흐름을 반영한다
- [X] T028 [US2] `/home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/WebcamPanel.tsx`와 `/home/choiho/coding/FE-migration/migration/src/pages/calibration-page/components/WebcamView.tsx`에 최소화 중 영상 중단, 복귀 후 재개 동작을 연결한다
- [X] T029 [US2] `/home/choiho/coding/FE-migration/migration/src/pages/widget-page/index.tsx`에 최신 자세 상태 소비를 연결해 백그라운드 측정 중에도 위젯 상태가 일관되게 갱신되도록 만든다

**Checkpoint**: User Story 2가 완료되면 창이 보이지 않는 동안에도 측정 세션이 유지되고, 백그라운드 결과가 운영 흐름과 UI 복귀에 모두 반영되어야 한다.

---

## Phase 5: User Story 3 - 안전한 모드 전환과 상태 복구 (Priority: P3)

**Goal**: 카메라 소유권 충돌 없이 foreground/background 전환을 수행하고, 오류 발생 시에도 UI와 세션 문맥을 안전하게 복구한다.

**Independent Test**: 앱 표시 상태와 최소화 상태를 10회 반복 전환해도 카메라 충돌, 세션 중복 생성, 잘못된 상태 점프가 없어야 하며, 오류 발생 시에도 엔진 상태가 명확히 표시되어야 한다.

### Tests for User Story 3

- [X] T030 [P] [US3] `/home/choiho/coding/FE-migration/migration/src/features/posture-engine/model/use-window-visibility-sync.test.ts`에 최소화/복귀 반복 전환과 상태 머신 검증 테스트를 추가한다
- [X] T031 [P] [US3] `/home/choiho/coding/FE-migration/migration/src-tauri/src/posture_engine/tests/ownership_transition.rs`에 카메라 소유권 전환과 오류 복구 테스트를 추가한다

### Implementation for User Story 3

- [X] T032 [US3] `/home/choiho/coding/FE-migration/migration/src-tauri/src/state/posture_engine_state.rs`와 `/home/choiho/coding/FE-migration/migration/src-tauri/src/posture_engine/ownership.rs`에 카메라 소유권 상태 머신과 전환 잠금 로직을 구현한다
- [X] T033 [US3] `/home/choiho/coding/FE-migration/migration/src-tauri/src/posture_engine/events.rs`와 `/home/choiho/coding/FE-migration/migration/src-tauri/src/commands/posture_engine.rs`에 `posture://engine-status`, `posture://warning` 이벤트와 오류 메시지 방출 로직을 구현한다
- [X] T034 [US3] `/home/choiho/coding/FE-migration/migration/src/features/posture-engine/model/use-posture-engine.ts`와 `/home/choiho/coding/FE-migration/migration/src/entities/posture/model/posture-engine-store.ts`에 오류 상태, 복구 가능 여부, 오래된 결과 무시 규칙을 반영한다
- [X] T035 [US3] `/home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/WebcamPanel.tsx`, `/home/choiho/coding/FE-migration/migration/src/pages/calibration-page/index.tsx`, `/home/choiho/coding/FE-migration/migration/src/pages/widget-page/index.tsx`에 엔진 상태 표시와 측정 불가 fallback UI를 연결한다
- [X] T036 [US3] `/home/choiho/coding/FE-migration/sidecar/posture-engine/engine/background_camera.py`와 `/home/choiho/coding/FE-migration/sidecar/posture-engine/main.py`에 장치 점유 실패, 추론 실패, 종료 요청 시 복구 가능한 오류 반환 규칙을 구현한다

**Checkpoint**: User Story 3이 완료되면 반복 전환과 오류 상황에서도 세션과 UI가 안전하게 유지되어야 한다.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 문서, 정적 검증, 레거시 parity 검증, 수동 회귀 검증을 마무리한다.

- [X] T037 [P] `/home/choiho/coding/FE-migration/specs/015-posture-engine-migration/quickstart.md` 기준으로 `cd /home/choiho/coding/FE-migration/migration && bun x tsc --noEmit`와 `cd /home/choiho/coding/FE-migration && bun x biome check migration/src migration/src-tauri/src`를 실행해 결과를 확인한다
- [X] T038 [P] `/home/choiho/coding/FE-migration/specs/015-posture-engine-migration/quickstart.md` 기준으로 `cd /home/choiho/coding/FE-migration/migration/src-tauri && cargo check`를 실행하고 Rust 브리지 정합성을 확인한다
- [ ] T039 `/home/choiho/coding/FE-migration/specs/015-posture-engine-migration/quickstart.md` 기준으로 `/main`, `/onboarding/calibration`, `/widget`에서 레거시 대비 UI 스타일 차이 항목 0건을 확인한다
- [ ] T040 `/home/choiho/coding/FE-migration/specs/015-posture-engine-migration/quickstart.md` 기준으로 레거시와 마이그레이션의 자세 분류 결과 parity 표본을 비교해 95% 이상 일치를 확인한다
- [ ] T041 `/home/choiho/coding/FE-migration/specs/015-posture-engine-migration/quickstart.md` 기준으로 최소화/복귀 10회 반복, 카메라 충돌 0건, 복귀 후 최신 상태 2초 이내 표시, 백그라운드 알림/세션 기록 반영을 수동 검증한다

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 진행, 모든 사용자 스토리의 공통 기반
- **User Story 1 (Phase 3)**: Foundational 완료 후 시작, MVP 범위
- **User Story 2 (Phase 4)**: Foundational 완료 후 시작 가능하지만, 실제 측정 세션과 화면 피드백 기반은 US1 결과에 의존
- **User Story 3 (Phase 5)**: Foundational 완료 후 시작 가능하지만, 실질적으로 US1과 US2의 엔진 흐름 위에서 전환/복구를 마무리하는 순서가 안전함
- **Polish (Phase 6)**: 모든 대상 사용자 스토리 완료 후 진행

### User Story Dependencies

- **User Story 1 (P1)**: 선행 사용자 스토리 의존성 없음
- **User Story 2 (P2)**: US1의 포그라운드 엔진 구동, 화면 피드백, 세션 연결 결과에 의존
- **User Story 3 (P3)**: US1의 화면 소비 구조와 US2의 백그라운드 측정 흐름에 의존

### Within Each User Story

- 테스트 작업이 포함된 경우 먼저 추가하고 실패 조건을 확인한 뒤 구현한다
- 공용 상태/브리지 업데이트 후 UI 연결을 진행한다
- Rust 상태 캐시와 Python sidecar 계약은 프런트엔드 연결 전에 먼저 안정화한다
- 각 스토리는 quickstart의 독립 검증 조건을 충족해야 완료로 본다

### Parallel Opportunities

- T002와 T003은 병렬 가능
- T006, T007, T010은 서로 다른 파일을 다루므로 병렬 가능
- US1의 T013과 T015는 병렬 가능
- US2의 T023과 T025는 서로 다른 계층을 다루므로 병렬 가능
- US3의 T030과 T031은 서로 다른 테스트 계층이라 병렬 가능
- T037와 T038은 최종 검증 단계에서 병렬 가능

---

## Parallel Example: User Story 1

```bash
Task: "T013 [US1] /home/choiho/coding/FE-migration/migration/src/features/posture-engine/model/use-posture-engine.test.ts 에 포그라운드 결과 수신 테스트를 추가한다"
Task: "T015 [US1] /home/choiho/coding/FE-migration/migration/src/entities/posture/lib/overlay-mapper.ts 와 /home/choiho/coding/FE-migration/migration/src/entities/posture/ui/PoseOverlayCanvas.tsx 에 오버레이 렌더링을 구현한다"
```

## Parallel Example: User Story 2

```bash
Task: "T023 [US2] /home/choiho/coding/FE-migration/migration/src/features/posture-engine/model/use-window-visibility-sync.ts 에 창 상태 감지와 모드 전환 트리거를 구현한다"
Task: "T025 [US2] /home/choiho/coding/FE-migration/sidecar/posture-engine/main.py 와 /home/choiho/coding/FE-migration/sidecar/posture-engine/engine/background_camera.py 에 백그라운드 측정 루프를 구현한다"
```

## Parallel Example: User Story 3

```bash
Task: "T030 [US3] /home/choiho/coding/FE-migration/migration/src/features/posture-engine/model/use-window-visibility-sync.test.ts 에 반복 전환 테스트를 추가한다"
Task: "T031 [US3] /home/choiho/coding/FE-migration/migration/src-tauri/src/posture_engine/tests/ownership_transition.rs 에 소유권 전환 테스트를 추가한다"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup 완료
2. Phase 2 Foundational 완료
3. Phase 3 User Story 1 완료
4. `/main`, `/onboarding/calibration`에서 실시간 피드백과 UI 동일성 검증
5. 여기서 멈춰도 화면이 보일 때의 핵심 자세 피드백 경험을 먼저 제공할 수 있다

### Incremental Delivery

1. Setup + Foundational로 브리지/상태 기반 정리
2. US1로 포그라운드 실시간 피드백 이관
3. US2로 최소화 상태 측정 지속, 알림 판단, 세션 기록, 복귀 연결
4. US3로 안전한 전환, 오류 복구, 경고 노출 마무리
5. Polish 단계에서 정적 검사와 레거시 parity 검증, 수동 회귀 검증으로 종료

### Parallel Team Strategy

1. 한 명이 Phase 2에서 TypeScript 상태/브리지 작업을 진행한다
2. 다른 한 명이 Rust command/state와 capability 작업을 진행한다
3. 또 다른 한 명이 Python sidecar 스캐폴드와 레거시 알고리즘 포팅 기반을 준비한다
4. 공통 기반 완료 후에는 프런트엔드 화면 연결 담당과 전환/복구 담당으로 나눠 진행할 수 있다

---

## Notes

- 모든 작업은 레거시 `src/`를 수정하지 않고 `migration/`, `migration/src-tauri/`, `sidecar/`를 변경 대상으로 삼는다
- UI 스타일 변경은 금지이며, 메인 화면과 보정 화면의 레거시 동일성이 최우선이다
- 모든 태스크는 체크박스, Task ID, Story 라벨, 정확한 파일 경로를 포함하도록 작성했다
