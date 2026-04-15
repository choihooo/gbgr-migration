# Tasks: 출석 현황 패널 이관 (AttendancePanel)

**Input**: Design documents from `/specs/011-attendance-panel-migration/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: 이 기능은 기존 마이그레이션 코드의 검증이 주된 작업이므로, 별도 테스트 코드 작성은 제외. 수동 시각 검증과 빌드 검증으로 품질을 보증함.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Migration target**: `migration/src/` (Tauri + React)
- **Legacy reference**: `src/renderer/src/` (read-only, for comparison only)

---

## Phase 1: Setup (기존 코드 확인)

**Purpose**: 마이그레이션 폴더의 기존 AttendancePanel.tsx와 의존성 상태를 확인

- [x] T001 기존 마이그레이션 AttendancePanel.tsx 읽고 구조 파악 in `migration/src/features/main-panels/ui/AttendancePanel.tsx`
- [x] T002 [P] 레거시 AttendacePanel.tsx 읽고 비교 기준 확보 in `src/renderer/src/features/dashboard/ui/AttendacePanel.tsx`
- [x] T003 [P] API 쿼리 훅 useAttendanceQuery 존재 및 타입 일치 확인 in `migration/src/entities/dashboard/model/use-dashboard-queries.ts`
- [x] T004 [P] 공유 UI 컴포넌트 존재 확인 (PanelHeader, ToggleSwitch, icons, cn) in `migration/src/shared/ui/`

---

## Phase 2: Foundational (차단 전제조건)

**Purpose**: 모든 User Story 구현 전 반드시 완료되어야 하는 기반 작업

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 마이그레이션 AttendancePanel.tsx에 @legacy 주석 추가 in `migration/src/features/main-panels/ui/AttendancePanel.tsx` — 레거시 원본 경로 `src/renderer/src/features/dashboard/ui/AttendacePanel.tsx` 명시

**Checkpoint**: Foundation ready — user story 검증 작업 시작 가능

---

## Phase 3: User Story 1 - 월간 출석 캘린더 조회 (Priority: P1) 🎯 MVP

**Goal**: 7열 그리드 캘린더가 레거시와 동일하게 렌더링되는지 검증 (FR-001~FR-008)

**Independent Test**: 마이그레이션 패널에서 이번 달 캘린더가 7열 그리드로 표시되고, 요일 헤더, 5단계 노란색 도트, 오늘 강조, 미래 날짜 구분, 회색 빈 날짜가 모두 정상 표시되는지 확인

### Implementation for User Story 1

- [X] T006 [US1] 캘린더 그리드 레이아웃 검증: grid-cols-7, gap-x-1, gap-y-1, 요일 헤더(일~토) 일치 확인 in `migration/src/features/main-panels/ui/AttendancePanel.tsx`
- [X] T007 [US1] 일요일 빨간색(text-point-red) 적용 확인 in `migration/src/features/main-panels/ui/AttendancePanel.tsx`
- [X] T008 [US1] AttendanceDot 컴포넌트 18x18px 크기, 5단계 LEVEL_COLORS(bg-yellow-100~500) 일치 확인 in `migration/src/features/main-panels/ui/AttendancePanel.tsx`
- [X] T009 [US1] 오늘 날짜 ring-2 ring-yellow-500 ring-offset-2 강조 적용 확인 in `migration/src/features/main-panels/ui/AttendancePanel.tsx`
- [X] T010 [US1] 미래 날짜 border + bg-transparent 처리 확인 in `migration/src/features/main-panels/ui/AttendancePanel.tsx`
- [X] T011 [US1] 데이터 없는 날 bg-grey-50 처리 확인 in `migration/src/features/main-panels/ui/AttendancePanel.tsx`
- [X] T012 [US1] getLevelFromMinutes 분→시간 변환 + 5단계 매핑 로직 일치 확인 in `migration/src/features/main-panels/ui/AttendancePanel.tsx`

**Checkpoint**: 캘린더 도트가 레거시와 동일하게 렌더링됨

---

## Phase 4: User Story 2 - 월간 네비게이션 (Priority: P2)

**Goal**: 이전/다음 달 버튼이 정상 동작하고 미래 달 차단이 구현되었는지 검증 (FR-009)

**Independent Test**: 이전 달 버튼으로 과거 월 전환, 다음 달 버튼으로 복귀, 현재 월에서 다음 버튼 비활성화 확인

### Implementation for User Story 2

- [X] T013 [US2] 이전 달 버튼 ChevronRightIcon rotate-180 적용 및 onClick 동작 확인 in `migration/src/features/main-panels/ui/AttendancePanel.tsx`
- [X] T014 [US2] 다음 달 버튼 ChevronRightIcon 적용 및 onClick 동작 확인 in `migration/src/features/main-panels/ui/AttendancePanel.tsx`
- [X] T015 [US2] 현재 월에서 다음 달 버튼 disabled 상태 확인 in `migration/src/features/main-panels/ui/AttendancePanel.tsx`
- [X] T016 [US2] 월 변경 시 viewDate 업데이트 및 API 재호출 동작 확인 in `migration/src/features/main-panels/ui/AttendancePanel.tsx`

**Checkpoint**: 월 네비게이션이 레거시와 동일하게 동작함

---

## Phase 5: User Story 3 - 동기부여 메시지 표시 (Priority: P3)

**Goal**: title, content1/2, subContent 메시지가 레거시와 동일하게 표시되는지 검증 (FR-012~FR-014)

**Independent Test**: API 응답 데이터에 따라 메시지가 올바르게 표시되고, 기본 메시지 폴백이 동작하는지 확인

### Implementation for User Story 3

- [X] T017 [US3] title 표시 및 기본값("잘하고 있어요!") 폴백 확인 in `migration/src/features/main-panels/ui/AttendancePanel.tsx`
- [X] T018 [US3] content1 + ArrowNarrowUpIcon(text-point-green) 표시 확인 in `migration/src/features/main-panels/ui/AttendancePanel.tsx`
- [X] T019 [US3] content2 + ArrowNarrowDownIcon(text-point-red) 표시 확인 in `migration/src/features/main-panels/ui/AttendancePanel.tsx`
- [X] T020 [US3] getMessage 5개 캐릭터 키워드 매핑 정확성 확인 in `migration/src/features/main-panels/ui/AttendancePanel.tsx`
- [X] T021 [US3] subContent 알 수 없는 값일 때 원본 텍스트 그대로 표시 확인 in `migration/src/features/main-panels/ui/AttendancePanel.tsx`

**Checkpoint**: 동기부여 메시지가 레거시와 동일하게 표시됨

---

## Phase 6: User Story 4 - 토글 스위치 및 인텐시티 슬라이더 (Priority: P4)

**Goal**: 토글 스위치와 인텐시티 범례가 레거시와 동일하게 표시되는지 검증 (FR-010~FR-011)

**Independent Test**: "월간/연간" 토글과 "Less~More" 5단계 색상 바가 표시되는지 확인

### Implementation for User Story 4

- [X] T022 [US4] ToggleSwitch uncheckedLabel="월간" checkedLabel="연간" checked={false} 확인 in `migration/src/features/main-panels/ui/AttendancePanel.tsx`
- [X] T023 [US4] 인텐시티 범례 "Less"~"More" + 5단계 LEVEL_COLORS 바 표시 확인 in `migration/src/features/main-panels/ui/AttendancePanel.tsx`

**Checkpoint**: 정적 UI 요소가 레거시와 동일하게 표시됨

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 전체 품질 검증 및 마무리 작업

- [X] T024 barrel export에 AttendancePanel 추가/확인 in `migration/src/features/main-panels/ui/index.ts`
- [X] T025 `bun run check` (Biome lint + TypeScript typecheck) 통과 확인 in `migration/`
- [X] T026 `bun run build` 빌드 성공 확인 in `migration/`
- [ ] T027 수동 시각 검증: 레거시 앱과 마이그레이션 앱 나란히 실행하여 패널 비교 in `migration/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3~6)**: All depend on Foundational phase completion
  - US1, US2, US3, US4는 동일 파일(AttendancePanel.tsx)을 검증하므로 순차 진행 권장
- **Polish (Phase 7)**: Depends on all user stories being verified

### User Story Dependencies

- **User Story 1 (P1)**: 캘린더 기본 렌더링 — 다른 스토리의 기반이 됨
- **User Story 2 (P2)**: US1 이후 검증 권장 (동일 파일, 네비게이션 로직)
- **User Story 3 (P3)**: US1 이후 검증 권장 (동일 파일, 메시지 영역)
- **User Story 4 (P4)**: 독립 검증 가능하지만 동일 파일

### Within Each User Story

- 기존 코드 검증이므로 각 Task는 확인 후 수정이 필요한 경우에만 코드 변경
- 레거시와 불일치 발견 시 해당 Task에서 수정까지 완료

### Parallel Opportunities

- Phase 1: T002, T003, T004 병렬 가능 (서로 다른 파일 읽기)
- Phase 7: T024, T025, T026은 순차 (lint는 코드 수정 후, build는 lint 후)
- US1~US4는 동일 파일이므로 병렬 비권장

---

## Parallel Example: Phase 1

```bash
# 기존 코드 및 의존성 확인을 병렬로 수행:
Task: "레거시 AttendacePanel.tsx 읽고 비교 기준 확보 in src/renderer/src/features/dashboard/ui/AttendacePanel.tsx"
Task: "API 쿼리 훅 useAttendanceQuery 존재 확인 in migration/src/entities/dashboard/model/use-dashboard-queries.ts"
Task: "공유 UI 컴포넌트 존재 확인 in migration/src/shared/ui/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (기존 코드 확인)
2. Complete Phase 2: Foundational (@legacy 주석 추가)
3. Complete Phase 3: User Story 1 (캘린더 검증)
4. **STOP and VALIDATE**: 캘린더가 레거시와 동일하게 렌더링되는지 확인

### Incremental Delivery

1. Setup + Foundational → 기반 준비 완료
2. Verify US1 → 캘린더 동등성 확인 (MVP!)
3. Verify US2 → 네비게이션 동등성 확인
4. Verify US3 → 메시지 동등성 확인
5. Verify US4 → 정적 UI 동등성 확인
6. Polish → 빌드/렌더 검증 완료

---

## Notes

- 이 태스크는 **기존 코드 검증**이 중심이므로, 대부분의 작업은 코드 비교 및 확인
- 레거시와 불일치하는 부분이 발견되면 해당 Task에서 즉시 수정
- 모든 수정은 Constitution 원칙(레거시 존중, UI 충실도 보존)을 준수
- Commit after each verified user story
- Stop at any checkpoint to validate story independently
