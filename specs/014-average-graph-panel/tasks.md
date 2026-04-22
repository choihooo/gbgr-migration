# Tasks: AverageGraphPannel UI 이관

**Input**: Design documents from `/specs/014-average-graph-panel/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: 이번 기능은 조회형 UI 패널 이관이므로 자동 테스트를 기본 필수로 두지 않는다. 대신 `bun x tsc --noEmit`, `bun x biome check`, 레거시 대비 수동 UI 비교를 완료 기준으로 사용한다.

**Organization**: 작업은 사용자 스토리별로 그룹화하여 각 스토리가 독립적으로 구현·검증 가능하도록 구성한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 수행 가능 작업
- **[Story]**: 해당 작업이 속한 사용자 스토리
- 모든 작업 설명에는 정확한 파일 경로를 포함한다

## Path Conventions

- migration 구현: `migration/src/`
- 기능 문서: `specs/014-average-graph-panel/`
- 레거시 참조 전용 소스: `src/renderer/src/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 구현 기준과 검증 기준을 현재 feature 문서에 고정한다.

- [X] T001 레거시 참조 기준과 구현 범위를 `/home/choiho/coding/FE-migration/specs/014-average-graph-panel/plan.md` 및 `/home/choiho/coding/FE-migration/specs/014-average-graph-panel/contracts/average-graph-panel-ui-contract.md` 기준으로 확인한다
- [X] T002 [P] 검증 절차와 명령을 `/home/choiho/coding/FE-migration/specs/014-average-graph-panel/quickstart.md` 기준으로 정리한다

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 사용자 스토리에서 공통으로 사용하는 차트 구조와 데이터 가공 기반을 준비한다.

**⚠️ CRITICAL**: 이 단계가 끝나야 사용자 스토리 구현을 안정적으로 진행할 수 있다.

- [X] T003 `recharts` 기반 차트 구조와 공용 색상 계산 패턴을 `/home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/HighlightsPanel.tsx`, `/home/choiho/coding/FE-migration/migration/src/shared/hooks/use-theme-applied.ts`, `/home/choiho/coding/FE-migration/migration/src/shared/lib/get-color.ts` 기준으로 확인한다
- [X] T004 `/home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/AverageGraphPanel/hooks/useAverageGraphChart.ts`에 기간 상태, 차트 데이터 항목, 축/색상 설정을 캡슐화하는 훅 구조를 정리한다

**Checkpoint**: 차트 훅과 공용 렌더링 기준이 준비되어 사용자 스토리 구현을 진행할 수 있다.

---

## Phase 3: User Story 1 - 동일한 그래프 확인 (Priority: P1) 🎯 MVP

**Goal**: migration 대시보드에서 레거시와 동일한 헤더, 범례, 축, 면적 그래프 구조를 표시한다.

**Independent Test**: migration 대시보드에서 `AverageGraphPanel`을 렌더링해 레거시 `AverageGraphPannel`과 비교했을 때 제목, 토글, 범례, 그래프, 축, 툴팁 구조가 동일해야 한다.

### Implementation for User Story 1

- [X] T005 [US1] `/home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/AverageGraphPanel.tsx`를 레거시 `AreaChart` 구조에 맞게 갱신한다
- [X] T006 [P] [US1] `/home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/AverageGraphPanel.tsx`에서 `PanelHeader`와 `ToggleSwitch`를 사용해 상단 헤더와 범례 배치를 레거시와 동일하게 맞춘다
- [X] T007 [P] [US1] `/home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/AverageGraphPanel.tsx`에 `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`, `Area` 설정을 반영해 시각 규칙을 레거시와 동일하게 맞춘다

**Checkpoint**: User Story 1이 완료되면 기본 그래프 UI가 단독으로 동작하고 레거시와 비교 가능한 상태여야 한다.

---

## Phase 4: User Story 2 - 기간 전환 유지 (Priority: P2)

**Goal**: 주간/월간 전환 시 데이터 범위와 스크롤 동작이 레거시와 동일하게 바뀌도록 한다.

**Independent Test**: 토글을 주간/월간으로 전환했을 때 데이터 개수, x축 라벨, 월간 12개 초과 시 가로 스크롤 여부가 레거시와 동일해야 한다.

### Implementation for User Story 2

- [X] T008 [US2] `/home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/AverageGraphPanel/hooks/useAverageGraphChart.ts`에 `weekly | monthly` 기간 상태별 데이터 슬라이싱 규칙을 구현한다
- [X] T009 [US2] `/home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/AverageGraphPanel.tsx`에 토글 상태와 차트 폭 계산을 연결해 월간 12개 초과 시 수평 스크롤이 동작하도록 구현한다
- [X] T010 [P] [US2] `/home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/AverageGraphPanel/hooks/useAverageGraphChart.ts`에서 정렬된 원본 데이터와 순번 라벨 생성 규칙을 레거시 기준으로 맞춘다

**Checkpoint**: User Story 2가 완료되면 기간 전환만으로도 레거시와 동일한 데이터 범위 변화와 스크롤 동작을 독립 검증할 수 있어야 한다.

---

## Phase 5: User Story 3 - 데이터 부재 시 일관된 표시 (Priority: P3)

**Goal**: API 응답이 비어 있거나 일부 점수가 0이어도 그래프 UI가 깨지지 않도록 유지한다.

**Independent Test**: 그래프 응답이 비어 있거나 일부 점수가 0인 상태에서도 패널이 같은 높이와 구조를 유지하고 레거시와 유사한 시각 결과를 보여야 한다.

### Implementation for User Story 3

- [X] T011 [US3] `/home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/AverageGraphPanel/hooks/useAverageGraphChart.ts`에 빈 응답용 임시 데이터 생성 규칙을 구현한다
- [X] T012 [P] [US3] `/home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/AverageGraphPanel/hooks/useAverageGraphChart.ts`에 `0` 점수 치환 규칙과 고정 y축 설정을 반영한다
- [X] T013 [US3] `/home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/AverageGraphPanel.tsx`에서 예외 데이터 상황에서도 최소 높이, 차트 컨테이너, 툴팁 표시가 유지되도록 마무리한다

**Checkpoint**: User Story 3이 완료되면 데이터 예외 상황에서도 패널 레이아웃이 안정적으로 유지되어야 한다.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 문서, 정적 검증, 수동 UI 비교를 마무리한다.

- [X] T014 [P] `/home/choiho/coding/FE-migration/specs/014-average-graph-panel/quickstart.md` 기준으로 `bun x tsc --noEmit`와 `bun x biome check`를 실행해 결과를 확인한다
- [X] T015 `/home/choiho/coding/FE-migration/migration/src/features/dashboard/ui/LeftPanelArea.tsx`와 `/home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/AverageGraphPanel.tsx`를 기준으로 좌측 패널 레이아웃 회귀 여부를 확인한다
- [X] T016 `/home/choiho/coding/FE-migration/specs/014-average-graph-panel/quickstart.md`와 `/home/choiho/coding/FE-migration/specs/014-average-graph-panel/contracts/average-graph-panel-ui-contract.md` 기준으로 레거시 대비 수동 UI 비교 결과를 기록한다

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 진행, 모든 사용자 스토리의 공통 기반
- **User Story 1 (Phase 3)**: Foundational 완료 후 시작, MVP 범위
- **User Story 2 (Phase 4)**: Foundational 완료 후 시작 가능하지만, 실제 그래프 구조는 US1 결과에 기대므로 US1 뒤에 진행 권장
- **User Story 3 (Phase 5)**: Foundational 완료 후 시작 가능하지만, 실제 데이터 가공 훅은 US2까지 반영된 뒤 마무리 권장
- **Polish (Phase 6)**: 모든 대상 사용자 스토리 완료 후 진행

### User Story Dependencies

- **User Story 1 (P1)**: 선행 사용자 스토리 의존성 없음
- **User Story 2 (P2)**: US1의 차트 구조 구현에 의존
- **User Story 3 (P3)**: US1의 렌더링 구조와 US2의 데이터 가공 규칙에 의존

### Within Each User Story

- 공용 훅 변경 후 컴포넌트 연결을 진행한다
- 데이터 가공 규칙이 먼저, 시각 반영은 이후에 진행한다
- 각 스토리는 quickstart의 독립 검증 조건을 충족해야 완료로 본다

### Parallel Opportunities

- T002와 T003은 병렬 가능
- US1의 T006과 T007은 같은 파일이지만 서로 다른 세부 설정 검토 작업으로 빠르게 분담 가능하나, 실제 적용은 순차 정리 권장
- US2의 T009와 T010은 데이터 규칙이 확정된 뒤 병렬 검토 가능
- US3의 T011과 T012는 동일 훅 내부지만 규칙 정의 관점에서 병렬 초안 작성 가능
- T014는 최종 수동 비교 준비와 병행 가능

---

## Parallel Example: User Story 1

```bash
Task: "T006 [US1] /home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/AverageGraphPanel.tsx 에서 헤더와 범례 배치를 레거시와 동일하게 맞춘다"
Task: "T007 [US1] /home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/AverageGraphPanel.tsx 에 차트 축, 그리드, 툴팁, 면적 그래프 설정을 반영한다"
```

## Parallel Example: User Story 2

```bash
Task: "T009 [US2] /home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/AverageGraphPanel.tsx 에 토글 상태와 차트 폭 계산을 연결한다"
Task: "T010 [US2] /home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/AverageGraphPanel/hooks/useAverageGraphChart.ts 에 정렬과 순번 라벨 규칙을 반영한다"
```

## Parallel Example: User Story 3

```bash
Task: "T011 [US3] /home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/AverageGraphPanel/hooks/useAverageGraphChart.ts 에 빈 응답용 임시 데이터를 구현한다"
Task: "T012 [US3] /home/choiho/coding/FE-migration/migration/src/features/main-panels/ui/AverageGraphPanel/hooks/useAverageGraphChart.ts 에 0점 치환과 고정 y축 설정을 반영한다"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup 완료
2. Phase 2 Foundational 완료
3. Phase 3 User Story 1 완료
4. 레거시와 기본 그래프 UI 동일성 수동 비교
5. 여기서 멈춰도 최소 가치가 있는 이관 결과를 얻을 수 있다

### Incremental Delivery

1. Setup + Foundational로 차트 기반 정리
2. US1로 기본 그래프 구조 이관
3. US2로 기간 전환과 스크롤 동작 완성
4. US3로 예외 데이터 대응 마무리
5. Polish 단계에서 정적 검사와 수동 비교로 종료

### Parallel Team Strategy

1. 한 명이 Foundational에서 차트 훅 구조를 정리한다
2. 다른 한 명이 레거시 UI 계약과 quickstart 검증 기준을 함께 확인한다
3. US1 이후에는 데이터 훅 담당과 컴포넌트 연결 담당으로 나눠 병렬 진행할 수 있다

---

## Notes

- 모든 작업은 레거시 `src/`를 수정하지 않고 migration `migration/src/`만 변경 대상으로 삼는다
- UI 스타일 변경은 금지이며 레거시 동일성이 최우선이다
- 체크박스 형식, Task ID, Story 라벨, 파일 경로를 모두 포함하도록 작성했다
