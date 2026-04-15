# Tasks: PosePatternPanel 정적 패널 이관

**Input**: Design documents from `/specs/013-pose-pattern-panel-migration/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: 정적 UI 패널 이관 작업이므로 자동 테스트는 기본 범위에서 제외하고, 레거시와의 시각적 비교 및 품질 게이트 검증으로 확인한다.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this belongs to (e.g. [US1], [US2], [US3])
- Include exact file paths in descriptions

---

## Phase 1: Setup (레거시 비교 준비)

**Purpose**: 레거시 참조와 마이그레이션 수정 대상을 고정한다.

- [x] T001 레거시 `src/renderer/src/features/dashboard/ui/PosePatternPanel.tsx`와 마이그레이션 `migration/src/features/main-panels/ui/PosePatternPanel.tsx` 구조 차이 확인
- [x] T002 `migration/src/features/main-panels/ui/PosePatternPanel.tsx`에 필요한 재사용 의존성(`PanelHeader`, `ui-icons`, `PanelBaseProps`, `cn`, `usePosturePatternQuery`) 확인

---

## Phase 2: Foundational (공통 표시 규칙 정리)

**Purpose**: 모든 사용자 스토리에서 공통으로 쓰는 데이터 병합 규칙과 표시 포맷을 정리한다.

**⚠️ CRITICAL**: 이 단계가 완료되어야 각 사용자 스토리 구현이 안정적으로 진행된다.

- [x] T003 `migration/src/features/main-panels/ui/PosePatternPanel.tsx`에 기본값 상수(worstTime, worstDay, recovery, stretching) 정리
- [x] T004 `migration/src/features/main-panels/ui/PosePatternPanel.tsx`에 시간/요일 포맷 변환 로직과 null-safe 데이터 매핑 위치 정리
- [x] T005 `migration/src/features/main-panels/ui/PosePatternPanel.tsx`에 `PanelBaseProps`와 `cn()` 적용 여부를 레거시 동일성 기준으로 반영

**Checkpoint**: 공통 표시 규칙 확정 완료 - 사용자 스토리 구현 시작 가능

---

## Phase 3: User Story 1 - 자세 패턴 분석 패널 표시 (Priority: P1) 🎯 MVP

**Goal**: 레거시와 동일한 PosePatternPanel 레이아웃과 카드 UI를 마이그레이션 앱에서 표시한다.

**Independent Test**: 마이그레이션 패널을 렌더링하고 레거시 패널과 나란히 비교했을 때 헤더, TIP, 2x2 카드 그리드, 아이콘, 간격이 동일해야 한다.

### Implementation for User Story 1

- [x] T006 [US1] `migration/src/features/main-panels/ui/PosePatternPanel.tsx`의 루트 레이아웃과 헤더 영역을 레거시와 동일하게 정렬
- [x] T007 [US1] `migration/src/features/main-panels/ui/PosePatternPanel.tsx`의 TIP 라벨, 메시지, ChevronRight 아이콘 스타일을 레거시와 동일하게 맞춤
- [x] T008 [US1] `migration/src/features/main-panels/ui/PosePatternPanel.tsx`의 2x2 패턴 카드 레이아웃과 각 카드 타이틀/값 타이포그래피를 레거시와 동일하게 맞춤
- [x] T009 [US1] `migration/src/features/main-panels/ui/PosePatternPanel.tsx`의 시계/캘린더/모래시계/엄지척 아이콘 표시를 레거시와 동일한 시각 결과로 검증하며 반영

**Checkpoint**: User Story 1 기준 패널 시각 구조가 레거시와 동일하게 표시되어야 함

---

## Phase 4: User Story 2 - API 데이터 없을 때 기본값 표시 (Priority: P2)

**Goal**: 데이터가 없거나 일부만 있어도 패널이 깨지지 않고 기본값을 보여준다.

**Independent Test**: API 응답을 비우거나 일부 필드만 남긴 상태에서 패널이 기본값(오후 2시, 수요일, 18분, 목돌리기)으로 안정적으로 표시되어야 한다.

### Implementation for User Story 2

- [x] T010 [US2] `migration/src/features/main-panels/ui/PosePatternPanel.tsx`에서 `usePosturePatternQuery` 응답의 null/undefined 접근을 안전하게 처리
- [x] T011 [US2] `migration/src/features/main-panels/ui/PosePatternPanel.tsx`에서 worstTime, worstDay, recovery, stretching별 기본값 병합 로직 구현
- [x] T012 [US2] `migration/src/features/main-panels/ui/PosePatternPanel.tsx`에서 빈 문자열 stretching, 부분 데이터, `recovery = 0` 케이스를 레거시 의도대로 표시하도록 보정

**Checkpoint**: User Story 2 기준 빈 데이터와 부분 데이터에서도 패널이 안정적으로 동작해야 함

---

## Phase 5: User Story 3 - 시간 및 요일 포맷 변환 (Priority: P3)

**Goal**: raw API 값을 사용자 친화적인 한국어 표시값으로 변환한다.

**Independent Test**: `"09:00:00"`, `"12:00:00"`, `"14:00:00"`, `"00:00:00"`과 `"MONDAY"`, `"SUNDAY"`를 입력했을 때 올바른 한글 포맷으로 표시되어야 한다.

### Implementation for User Story 3

- [x] T013 [US3] `migration/src/features/main-panels/ui/PosePatternPanel.tsx`에 `HH:MM:SS` → `오전/오후 N시` 시간 포맷 변환 로직 구현
- [x] T014 [US3] `migration/src/features/main-panels/ui/PosePatternPanel.tsx`에 영어 대문자 요일 → 한국어 요일 포맷 변환 로직 구현
- [x] T015 [US3] `migration/src/features/main-panels/ui/PosePatternPanel.tsx`에 TIP 메시지와 카드 표시값이 변환된 시간/요일 문자열을 사용하도록 연결

**Checkpoint**: User Story 3 기준 포맷 변환이 카드와 TIP 메시지 전체에 일관되게 적용되어야 함

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 품질 게이트 통과 및 최종 시각 검증

- [x] T016 `migration/`에서 `bun run typecheck` 실행하여 타입 오류 확인
- [x] T017 `migration/`에서 `bun run lint` 실행하여 린트 오류 확인
- [x] T018 `migration/`에서 `bun run build` 실행하여 프로덕션 빌드 확인
- [ ] T019 레거시 `src/renderer/src/features/dashboard/ui/PosePatternPanel.tsx`와 마이그레이션 `migration/src/features/main-panels/ui/PosePatternPanel.tsx`를 나란히 비교해 최종 시각 동일성 검증

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Phase 1 완료 후 진행, 모든 사용자 스토리의 공통 기반
- **US1 (Phase 3)**: Phase 2 완료 후 시작, MVP 범위
- **US2 (Phase 4)**: US1 위에 데이터 기본값 안정성 보강
- **US3 (Phase 5)**: US2와 같은 파일을 수정하므로 US2 이후 순차 진행 권장
- **Polish (Phase 6)**: 모든 사용자 스토리 완료 후 진행

### User Story Dependencies

- **US1 (P1)**: Foundational 완료 후 바로 시작 가능
- **US2 (P2)**: US1의 레이아웃 구조를 기반으로 데이터 안전성 보강
- **US3 (P3)**: US1/US2에서 사용하는 표시값 계산 위에 포맷 변환을 마무리

### Within Each User Story

- 동일 파일(`migration/src/features/main-panels/ui/PosePatternPanel.tsx`)을 수정하므로 각 태스크는 순차 실행 권장
- 레이아웃 고정 후 데이터 병합, 데이터 병합 후 포맷 변환 순서로 진행

### Parallel Opportunities

- 이 feature는 실질적으로 단일 파일 수정 작업이므로 구현 태스크의 병렬 이점이 거의 없음
- 품질 게이트 전 단계에서는 레거시 비교 자료 준비와 quickstart 검토 정도만 별도 병행 가능

---

## Parallel Example: Preparation

```bash
Task: "레거시 src/renderer/src/features/dashboard/ui/PosePatternPanel.tsx 구조 차이 확인"
Task: "migration/src/features/main-panels/ui/PosePatternPanel.tsx 재사용 의존성 확인"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: 레거시 비교 준비
2. Phase 2: 공통 표시 규칙 정리
3. Phase 3: 패널 레이아웃과 카드 UI를 레거시와 동일하게 이관
4. **STOP and VALIDATE**: 시각 비교로 MVP 확인

### Incremental Delivery

1. Setup + Foundational 완료
2. US1 완료 후 시각 구조 검증
3. US2 완료 후 빈 데이터/부분 데이터 검증
4. US3 완료 후 시간/요일 포맷 검증
5. Polish에서 typecheck/lint/build 및 최종 비교 수행

---

## Notes

- 모든 문서는 한글 기준으로 유지
- UI 스타일은 레거시와 완전히 동일해야 함
- 태스크는 모두 정확한 파일 경로를 포함하며 즉시 실행 가능한 단위로 작성함
