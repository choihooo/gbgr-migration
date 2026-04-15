# Tasks: CharacterPanel 이관

**Input**: Design documents from `/specs/008-character-panel-migration/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: 이번 범위는 정적 UI 패널 이관이므로 테스트 작업은 필수로 두지 않는다. 핵심 검증은 레거시 대비 시각 비교로 수행한다.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Migration app**: `migration/src/`
- **레거시 참조**: `src/renderer/src/` (읽기 전용)
- **스펙 문서**: `specs/008-character-panel-migration/`

---

## Phase 1: Setup (Baseline Review)

**Purpose**: CharacterPanel 이관 전에 기준 구현과 연결 지점을 고정한다

- [x] T001 레거시 CharacterPanel 기준 구현과 클래스 구성을 확인하고 메모를 정리한다 — `src/renderer/src/features/dashboard/ui/CharacterPanel.tsx`
- [x] T002 현재 마이그레이션 대시보드 패널 구조와 연결 가능 지점을 확인한다 — `migration/src/features/dashboard/ui/LeftPanelArea.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 사용자 스토리에서 공유하는 계약과 검증 기준을 맞춘다

**⚠️ CRITICAL**: 이 단계가 완료되어야 사용자 스토리 구현을 시작할 수 있다

- [x] T003 CharacterPanel UI 계약과 범위 제한을 최종 확인한다 — `specs/008-character-panel-migration/contracts/character-panel-ui-contract.md`
- [x] T004 시각 검증 방식과 완료 기준을 quickstart 기준으로 확정한다 — `specs/008-character-panel-migration/quickstart.md`

**Checkpoint**: 레거시 기준, 배치 원칙, 검증 기준이 모두 고정됨

---

## Phase 3: User Story 1 - 캐릭터 패널을 레거시와 동일하게 본다 (Priority: P1) 🎯 MVP

**Goal**: CharacterPanel 컴포넌트를 레거시와 동일한 카드 구조와 내부 정사각형 비주얼 영역으로 이관한다.

**Independent Test**: CharacterPanel을 렌더링한 뒤 레거시와 나란히 비교해 카드 외곽선, 배경색, 둥근 모서리, 내부 정사각형 영역이 동일한지 확인한다.

### Implementation for User Story 1

- [x] T005 [US1] CharacterPanel 정적 패널 컴포넌트를 레거시 구조 그대로 구현한다. 카드 배경색·테두리·모서리·배경 톤을 동일하게 적용하고, 내부 비주얼 영역은 aspect-ratio로 정사각형 비율을 유지한다 — `migration/src/features/main-panels/ui/CharacterPanel.tsx`
- [x] T006 [US1] FR-006(독립 렌더링) 보장을 위해 CharacterPanel이 기존 패널 패턴과 충돌하지 않도록 선택적 className 인터페이스를 적용한다 — `migration/src/features/main-panels/model/types.ts`
- [x] T007 [US1] 레거시 사용처 확인 결과에 따라 CharacterPanel의 대시보드 배치 연결 여부를 반영한다 — `migration/src/features/dashboard/ui/LeftPanelArea.tsx`
- [x] T008 [US1] CharacterPanel 렌더링을 위한 라우팅 및 임포트 경로가 유효한지 확인한다 — `migration/src/pages/dashboard-page/index.tsx`

**Checkpoint**: CharacterPanel이 마이그레이션 앱에서 레거시와 동일한 형태로 렌더링된다.

---

## Phase 4: User Story 2 - 다른 패널 이관의 기준으로 사용한다 (Priority: P2)

**Goal**: CharacterPanel 이관 결과를 후속 패널 이관의 기준 사례와 검증 산출물로 남긴다.

**Independent Test**: CharacterPanel 이관 완료 후 시각 비교 기록만으로 레거시 동일성 여부를 판단할 수 있어야 한다.

### Implementation for User Story 2

- [x] T009 [P] [US2] CharacterPanel 시각 비교 산출물(레거시/마이그레이션 비교 캡처 또는 기록)을 정리한다 — `specs/008-character-panel-migration/quickstart.md`
- [x] T010 [US2] CharacterPanel 이관 결과와 배치 판단 근거를 작업 문서에 반영한다 — `specs/008-character-panel-migration/research.md`
- [x] T011 [US2] 후속 패널 이관 시 재사용할 수 있도록 완료 기준과 검증 포인트를 정리한다 — `specs/008-character-panel-migration/quickstart.md`

**Checkpoint**: CharacterPanel 이관 결과가 후속 패널의 기준 사례로 재사용 가능하다.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 구현 마감과 최종 검증

- [x] T012 [P] CharacterPanel 관련 스펙 문서와 실제 구현 경로의 불일치가 없는지 점검한다 — `specs/008-character-panel-migration/plan.md`
- [x] T013 CharacterPanel 시각 비교 결과를 기준으로 최종 수동 검증을 완료한다 — `specs/008-character-panel-migration/spec.md`
- [x] T014 마이그레이션 앱에서 CharacterPanel 추가 후 lint, typecheck, build를 실행해 회귀가 없는지 확인한다 — `migration/package.json`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 진행, 모든 사용자 스토리를 막는 기준 정렬 단계
- **User Story 1 (Phase 3)**: Foundational 완료 후 시작 가능
- **User Story 2 (Phase 4)**: User Story 1 완료 후 진행
- **Polish (Phase 5)**: 모든 사용자 스토리 완료 후 진행

### User Story Dependencies

- **User Story 1 (P1)**: 선행 사용자 스토리 없음, MVP
- **User Story 2 (P2)**: User Story 1 결과물과 시각 비교 산출물에 의존

### Parallel Opportunities

- T001, T002는 서로 다른 경로 확인 작업이라 병렬 가능
- T009와 T012는 구현 완료 후 병렬로 진행 가능

---

## Parallel Example: User Story 2

```bash
Task: "CharacterPanel 레거시/마이그레이션 비교 캡처 또는 기록을 정리한다 — specs/008-character-panel-migration/quickstart.md"
Task: "CharacterPanel 관련 스펙 문서와 실제 구현 경로의 불일치가 없는지 점검한다 — specs/008-character-panel-migration/plan.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1, 2로 기준 구현과 검증 규칙을 고정한다.
2. Phase 3에서 CharacterPanel 컴포넌트를 동일 복제로 구현한다.
3. 레거시와 시각 비교해 US1만 먼저 검증한다.

### Incremental Delivery

1. CharacterPanel 자체를 먼저 포팅한다.
2. 필요 시 대시보드 배치 연결을 최소 범위로 반영한다.
3. 비교 산출물과 검증 기준을 문서화해 후속 패널 이관으로 확장한다.

## Notes

- [P] 표시는 서로 다른 파일 또는 문서에서 병렬로 처리 가능한 작업만 사용했다.
- 이번 범위는 정적 UI 패널 이관이므로 신규 API, 저장소, 시스템 권한 작업은 포함하지 않는다.
- 레거시 `src/` 수정 작업은 포함하지 않는다.
