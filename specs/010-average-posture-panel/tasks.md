# Tasks: AveragePosturePanel 이관

**Input**: Design documents from `/specs/010-average-posture-panel/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: 이번 범위는 조회형 UI 패널 이관이므로 테스트 작업은 기본 필수로 두지 않는다. 핵심 검증은 레거시 대비 시각 비교와 lint/typecheck/build 확인으로 수행한다.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this belongs to (e.g. [US1], [US2], [US3])
- Include exact file paths in descriptions

## Path Conventions

- **Migration app**: `migration/src/`
- **레거시 참조**: `src/renderer/src/` (읽기 전용)
- **스펙 문서**: `specs/010-average-posture-panel/`

---

## Phase 1: Setup (Baseline Review)

**Purpose**: 기준 구현과 현재 차이를 고정한다

- [X] T001 레거시 AveragePosturePanel 구조와 단계 규칙, 자산 참조를 다시 확인하고 구현 기준을 정리한다 — `src/renderer/src/features/dashboard/ui/AveragePosture/AveragePosturePanel.tsx`
- [X] T002 [P] 현재 마이그레이션 AveragePosturePanel의 차이점(6단계 규칙, 임시 도형 표현, 에러 문구 처리)을 정리한다 — `migration/src/features/main-panels/ui/AveragePosturePanel.tsx`
- [X] T003 [P] 메인 대시보드 좌측 상단 연결 위치와 상위 레이아웃 제약을 확인한다 — `migration/src/features/dashboard/ui/LeftPanelArea.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 사용자 스토리에 공통으로 필요한 기준 데이터를 고정한다

**⚠️ CRITICAL**: 이 단계가 완료되어야 사용자 스토리 구현을 시작할 수 있다

- [X] T004 레거시 단계 정보 세트와 점수 구간 규칙을 마이그레이션 컴포넌트에 옮길 기준으로 정리한다 — `src/renderer/src/features/dashboard/ui/AveragePosture/levelConfig.ts`
- [X] T005 [P] AveragePosturePanel UI 계약과 범위 제한을 구현 기준으로 최종 확인한다 — `specs/010-average-posture-panel/contracts/average-posture-panel-ui-contract.md`
- [X] T006 [P] 시각 비교 기준과 완료 조건을 quickstart 기준으로 확정한다 — `specs/010-average-posture-panel/quickstart.md`

**Checkpoint**: 레거시 기준, 단계 규칙, 검증 기준이 모두 고정됨

---

## Phase 3: User Story 1 - 평균 자세 점수 패널을 레거시와 동일하게 본다 (Priority: P1) 🎯 MVP

**Goal**: AveragePosturePanel을 레거시와 동일한 카드 구조, 단계 규칙, 캐릭터 이미지, 배경 표현으로 이관한다.

**Independent Test**: 메인 대시보드에서 AveragePosturePanel을 확인해 카드 배경, 점수, 단계 이름, 설명 문구, 캐릭터 이미지, `Step` 표기가 레거시와 동일한지 비교한다.

### Implementation for User Story 1

- [X] T007 [US1] AveragePosturePanel 내부의 단계 계산 규칙을 레거시 5단계 기준으로 교체한다 — `migration/src/features/main-panels/ui/AveragePosturePanel.tsx`
- [X] T008 [US1] AveragePosturePanel의 단계 이름, 목 평균 기울기, 예상 하중 문구를 레거시 기준 정보 세트로 맞춘다 — `migration/src/features/main-panels/ui/AveragePosturePanel.tsx`
- [X] T009 [US1] AveragePosturePanel 우측 시각 영역의 임시 도형 표현을 제거하고 레거시 캐릭터 이미지 렌더링으로 교체한다 — `migration/src/features/main-panels/ui/AveragePosturePanel.tsx`
- [X] T010 [US1] AveragePosturePanel의 카드 내부 배치, 단계 배지, 하단 `Step` 표기를 레거시 구조에 맞게 정렬한다 — `migration/src/features/main-panels/ui/AveragePosturePanel.tsx`
- [X] T011 [US1] AveragePosturePanel의 배경 그라데이션 전환 규칙을 레거시 기준으로 맞춘다 — `migration/src/features/main-panels/ui/AveragePosturePanel.tsx`
- [X] T012 [US1] AveragePosturePanel이 메인 대시보드 좌측 상단 슬롯에서 레거시와 같은 카드 비율로 보이도록 연결 상태를 점검하고 필요한 최소 조정을 반영한다 — `migration/src/features/dashboard/ui/LeftPanelArea.tsx`

**Checkpoint**: AveragePosturePanel이 메인 대시보드에서 레거시와 동일한 핵심 시각 구조로 렌더링된다.

---

## Phase 4: User Story 2 - 데이터 상태가 달라도 패널 구조를 안정적으로 본다 (Priority: P2)

**Goal**: 로딩 상태와 경계 점수 상태에서도 AveragePosturePanel 구조와 단계 표현이 안정적으로 유지되게 한다.

**Independent Test**: 로딩 상태와 최소 2개 이상의 다른 단계 상태를 비교해 점수 자리, 문구 자리, 캐릭터 자리, `Step` 자리가 흔들리지 않는지 확인한다.

### Implementation for User Story 2

- [X] T013 [US2] AveragePosturePanel의 로딩 상태 표시를 레거시 규칙에 맞춰 정리하고 점수 영역 레이아웃이 유지되도록 조정한다 — `migration/src/features/main-panels/ui/AveragePosturePanel.tsx`
- [X] T014 [US2] AveragePosturePanel의 기본 점수와 단계 경계값 처리 결과가 레거시 규칙과 일치하도록 정리한다 — `migration/src/features/main-panels/ui/AveragePosturePanel.tsx`
- [X] T015 [US2] 기존 조회 훅 사용 방식이 AveragePosturePanel의 데이터 상태 요구와 충돌하지 않는지 점검하고 필요한 범위만 보정한다 — `migration/src/entities/dashboard/model/use-dashboard-queries.ts`

**Checkpoint**: AveragePosturePanel이 데이터 상태 변화에도 구조를 유지하며 레거시 단계 결과를 일관되게 표시한다.

---

## Phase 5: User Story 3 - 후속 대시보드 패널 이관의 기준으로 사용한다 (Priority: P3)

**Goal**: AveragePosturePanel 이관 결과를 후속 패널 이관의 기준 사례와 검증 기록으로 남긴다.

**Independent Test**: 시각 비교 기록과 구현 메모만으로 레거시 동일성 판단 기준을 팀이 재사용할 수 있어야 한다.

### Implementation for User Story 3

- [X] T016 [P] [US3] AveragePosturePanel 시각 비교 기록 표와 검증 결과를 quickstart 문서에 반영한다 — `specs/010-average-posture-panel/quickstart.md`
- [X] T017 [US3] AveragePosturePanel 이관 결정 사항과 레거시 대비 차이 해소 결과를 research 문서에 반영한다 — `specs/010-average-posture-panel/research.md`
- [X] T018 [US3] 후속 패널 이관 시 재사용할 수 있도록 구현 완료 기준과 검증 포인트를 정리한다 — `specs/010-average-posture-panel/quickstart.md`

**Checkpoint**: AveragePosturePanel 이관 결과가 후속 대시보드 패널 이관의 기준 자료로 재사용 가능하다.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 최종 품질 확인과 문서-구현 정합성 점검

- [X] T019 [P] AveragePosturePanel 관련 스펙 문서와 실제 구현 경로의 불일치가 없는지 점검한다 — `specs/010-average-posture-panel/plan.md`
- [X] T020 AveragePosturePanel 이관 결과를 기준으로 최종 수동 시각 검증을 완료한다 — `specs/010-average-posture-panel/spec.md`
- [X] T021 마이그레이션 앱에서 AveragePosturePanel 변경 후 lint, typecheck, build를 실행해 회귀가 없는지 확인한다 — `migration/package.json`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 진행, 모든 사용자 스토리의 기준 정렬 단계
- **User Story 1 (Phase 3)**: Foundational 완료 후 시작 가능
- **User Story 2 (Phase 4)**: User Story 1 결과를 바탕으로 진행
- **User Story 3 (Phase 5)**: User Story 1과 User Story 2 완료 후 진행
- **Polish (Phase 6)**: 모든 사용자 스토리 완료 후 진행

### User Story Dependencies

- **User Story 1 (P1)**: 선행 사용자 스토리 없음, MVP
- **User Story 2 (P2)**: User Story 1에서 복원한 단계 규칙과 레이아웃 구조에 의존
- **User Story 3 (P3)**: User Story 1, User Story 2의 구현 및 검증 결과에 의존

### Parallel Opportunities

- T002와 T003은 서로 다른 파일 분석 작업이라 병렬 가능
- T005와 T006은 서로 다른 문서 기준 확인 작업이라 병렬 가능
- T016과 T019는 구현 완료 후 병렬로 진행 가능

---

## Parallel Example: User Story 1

```bash
Task: "AveragePosturePanel 우측 시각 영역의 임시 도형 표현을 제거하고 레거시 캐릭터 이미지 렌더링으로 교체한다 — migration/src/features/main-panels/ui/AveragePosturePanel.tsx"
Task: "AveragePosturePanel이 메인 대시보드 좌측 상단 슬롯에서 레거시와 같은 카드 비율로 보이도록 연결 상태를 점검하고 필요한 최소 조정을 반영한다 — migration/src/features/dashboard/ui/LeftPanelArea.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1, 2로 레거시 기준과 검증 규칙을 고정한다.
2. Phase 3에서 AveragePosturePanel의 단계 규칙, 문구, 캐릭터 이미지, 배경 표현을 레거시 기준으로 복원한다.
3. 메인 대시보드에서 시각 비교해 US1만 먼저 검증한다.

### Incremental Delivery

1. AveragePosturePanel의 핵심 시각 구조를 먼저 레거시와 일치시킨다.
2. 그 다음 로딩 상태와 경계 점수 상태를 다듬는다.
3. 마지막으로 시각 비교 기록과 재사용 가능한 검증 기준을 문서화한다.

## Notes

- [P] 표시는 서로 다른 파일 또는 문서에서 병렬 처리 가능한 작업만 사용했다.
- 이번 범위는 UI 충실도 복원이 핵심이므로 테스트보다 시각 비교와 품질 게이트 확인을 우선한다.
- 레거시 `src/` 수정 작업은 포함하지 않는다.
