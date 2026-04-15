# Tasks: HighlightsPanel 마이그레이션

**Input**: Design documents from `/specs/012-highlights-panel-migration/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: 정적 UI 패널 마이그레이션으로 회귀 위험이 낮아 테스트 태스크는 포함하지 않는다. 수동 검증으로 충분 (Constitution #5).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (의존성 설치)

**Purpose**: recharts 패키지 설치

- [x] T001 recharts 의존성 추가 — `bun add recharts` in `migration/`

---

## Phase 2: Foundational (공유 유틸리티)

**Purpose**: Recharts 차트에서 테마 대응을 위해 필요한 공유 유틸리티. 모든 US에 필요한 기반 인프라.

**⚠️ CRITICAL**: 이 단계가 완료되어야 US 구현 가능

- [x] T002 getColor 유틸리티 생성 in `migration/src/shared/lib/get-color.ts` — CSS 변수에서 색상값 읽기 함수 (레거시 `src/renderer/src/shared/lib/get-color.ts` 포팅)
- [x] T003 [P] useThemeApplied 훅 생성 in `migration/src/shared/hooks/use-theme-applied.ts` — useThemeStore.isDark 상태를 감지하여 Recharts 색상 재계산 트리거 (레거시 `src/renderer/src/shared/hooks/use-theme-applied.ts` 포팅)

**Checkpoint**: 공유 유틸리티 준비 완료 — US 구현 시작 가능

---

## Phase 3: User Story 1 - 하이라이트 차트 주간/월간 비교 조회 (Priority: P1) 🎯 MVP

**Goal**: 메인 대시보드에서 주간/월간 비교 막대 차트가 정상 렌더링되고 토글 전환이 동작

**Independent Test**: 메인 페이지 진입 → 하이라이트 패널에서 주간 차트 확인 → 월간 토글 전환 → 차트 데이터 갱신 확인

### Implementation for User Story 1

- [x] T004 [P] [US1] HighlightDatum 타입 및 목업 데이터 생성 in `migration/src/features/main-panels/ui/HighlightsPanel/data.ts` — 레거시 `src/renderer/src/features/dashboard/ui/HighlightsPanel/data.ts` 포팅
- [x] T005 [US1] useHighlightsChart 훅 구현 in `migration/src/features/main-panels/ui/HighlightsPanel/hooks/useHighlightsChart.ts` — API 호출 + 차트 설정 계산 통합 (레거시 `src/renderer/src/features/dashboard/ui/HighlightsPanel/hooks/useHighlightsChart.ts` 포팅, T002, T003, T004에 의존)
- [x] T006 [US1] HighlightsPanel 컴포넌트 Recharts 기반으로 교체 in `migration/src/features/main-panels/ui/HighlightsPanel.tsx` — 기존 플레이스홀더를 레거시 `src/renderer/src/features/dashboard/ui/HighlightsPanel.tsx`와 동일한 Recharts BarChart 구조로 전면 교체 (T005에 의존)

**Checkpoint**: 메인 페이지에서 하이라이트 패널이 Recharts BarChart로 렌더링되고 주간/월간 토글이 동작함

---

## Phase 4: User Story 2 - API 데이터 연동 및 로딩 상태 처리 (Priority: P2)

**Goal**: API에서 실제 데이터를 조회하여 차트에 반영, 로딩/에러 상태 UI 표시

**Independent Test**: 네트워크 탭에서 API 호출 확인 → 느린 네트워크에서 로딩 상태 UI 확인 → 서버 오류 시 에러 처리 확인

### Implementation for User Story 2

- [x] T007 [US2] useHighlightsChart 훅에 isLoading 상태 반환 추가 in `migration/src/features/main-panels/ui/HighlightsPanel/hooks/useHighlightsChart.ts` — useHighlightQuery의 isLoading을 ChartConfig 반환값에 포함하여 컴포넌트에서 로딩 상태 감지 가능하도록 수정. 로딩 중 기본값(current=0, previous=0) 처리가 레거시와 동일한지 확인 (T005에 의존)
- [x] T008 [US2] HighlightsPanel 컴포넌트에 로딩 상태 UI 추가 in `migration/src/features/main-panels/ui/HighlightsPanel.tsx` — isLoading 시 차트 영역에 로딩 인디케이터(LoadingSpinner) 표시. 레거시 main-page의 Suspense + LoadingSpinner 패턴과 일치 (T006에 의존)

**Checkpoint**: API 데이터가 차트에 정상 반영되고, 로딩/에러 상태가 적절히 처리됨

---

## Phase 5: User Story 3 - 다크/라이트 테마 대응 (Priority: P3)

**Goal**: 테마 전환 시 차트 색상이 즉시 변경됨

> **참고**: US3은 신규 코드를 작성하지 않는 검증-only 단계이다. 테마 인프라(getColor + useThemeApplied)는 Phase 2에서, 차트 색상 로직은 US1(T005)에서 이미 구현된다.

**Independent Test**: 설정에서 테마 전환 → 하이라이트 패널 차트 색상이 CSS 변수에 따라 즉시 변경되는지 확인

### Implementation for User Story 3

- [x] T009 [US3] useHighlightsChart 훅의 테마 대응 검증 in `migration/src/features/main-panels/ui/HighlightsPanel/hooks/useHighlightsChart.ts` — isDarkApplied 의존성으로 chartColors/chartConfig useMemo가 재계산되는지 확인. getColor CSS 변수가 colors.css의 light/dark 정의와 매칭되는지 검증 (T003, T005에 의존)
- [x] T010 [US3] HighlightsPanel 컴포넌트 테마 전환 동작 검증 in `migration/src/features/main-panels/ui/HighlightsPanel.tsx` — 다크/라이트 전환 시 차트 색상이 레거시와 동일하게 변경되는지 수동 비교 (T006에 의존)

**Checkpoint**: 다크/라이트 테마 전환 시 차트 색상이 즉시(1초 이내) 반영됨

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 품질 게이트 통과 및 최종 검증

- [x] T011 `bun run typecheck` 통과 확인 in `migration/` — 타입 에러 없어야 함
- [x] T012 `bun run lint` 통과 확인 in `migration/` — 린트 에러 없어야 함
- [x] T013 `bun run build` 통과 확인 in `migration/` — 빌드 성공 확인
- [ ] T014 레거시와 시각적 동일성 최종 검증 — 레거시 앱과 마이그레이션 앱을 나란히 실행하여 하이라이트 패널 비교 (색상, 간격, 폰트, 레이아웃, 차트 구조)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — 즉시 시작 가능
- **Foundational (Phase 2)**: Phase 1 완료 후 — BLOCKS all user stories
- **US1 (Phase 3)**: Phase 2 완료 후 — T004 병렬 가능, T005→T006 순차
- **US2 (Phase 4)**: US1 완료 후 — 기존 코드 위에 로딩/에러 보완
- **US3 (Phase 5)**: US1 완료 후 — 기존 코드 위에 테마 대응 검증
- **Polish (Phase 6)**: 모든 US 완료 후

### User Story Dependencies

- **US1 (P1)**: Phase 2 완료 후 시작 — 다른 US에 의존하지 않음
- **US2 (P2)**: US1 완료 후 시작 — US1 코드 위에 로딩/에러 보완
- **US3 (P3)**: US1 완료 후 시작 — US1 코드 위에 테마 검증

### Within Each User Story

- 타입/데이터 → 훅 → 컴포넌트 순서
- Core implementation before integration

### Parallel Opportunities

- T002(getColor)와 T003(useThemeApplied)은 병렬 가능 (Phase 2)
- T004(HighlightDatum)는 T002/T003과 병렬 가능 (Phase 3)

---

## Parallel Example: Phase 2+3

```bash
# Phase 2: 병렬로 유틸리티 생성
Task: "getColor 유틸리티 생성 in migration/src/shared/lib/get-color.ts"
Task: "useThemeApplied 훅 생성 in migration/src/shared/hooks/use-theme-applied.ts"

# Phase 3: Foundational 완료 후
Task: "HighlightDatum 타입 생성 in migration/src/features/main-panels/ui/HighlightsPanel/data.ts"  # Phase 2와 병렬 가능
# 그 다음 순차:
Task: "useHighlightsChart 훅 구현"  # T004 완료 후
Task: "HighlightsPanel 컴포넌트 교체"  # T005 완료 후
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: recharts 설치
2. Phase 2: getColor + useThemeApplied 생성
3. Phase 3: HighlightsPanel Recharts 기반 구현
4. **STOP and VALIDATE**: 주간/월간 차트 렌더링 확인

### Incremental Delivery

1. Setup + Foundational → 기반 준비
2. US1 완료 → 주간/월간 차트 동작 (MVP!)
3. US2 완료 → API 연동 + 로딩/에러 처리
4. US3 완료 → 테마 대응
5. Polish → typecheck/lint/build 통과 + 시각적 검증

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- 각 US는 이전 US 코드 위에 점진적으로 보완하는 구조
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- UI 스타일 절대 변경 금지 (Constitution #2)
- 레거시 참조: 모든 포팅은 plan.md에 명시된 레거시 원본 경로 기준
