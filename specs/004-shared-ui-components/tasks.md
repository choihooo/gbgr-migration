# Tasks: 공통 UI 컴포넌트 시스템

**Input**: Design documents from `/specs/004-shared-ui-components/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Modal과 ToggleSwitch는 복잡한 인터랙션(ESC 닫기, 스크롤 락, 동적 인디케이터)이 있어 단위 테스트를 포함. 나머지 컴포넌트는 시각 검증만으로 충분 (헌법 5원칙: 단순 마크업 이관은 테스트 강제 안 함).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (공유 인프라)

**Purpose**: cn 유틸리티와 에셋 준비 — 모든 컴포넌트의 전제 조건

- [x] T001 `clsx`, `tailwind-merge` 의존성 추가 (`bun add clsx tailwind-merge`)
- [x] T002 cn 유틸리티 생성 in `migration/src/shared/lib/cn.ts` (clsx + twMerge 래퍼)
- [x] T003 [P] Loading.mov 에셋 복사 from `src/renderer/src/assets/video/Loading.mov` to `migration/src/assets/video/Loading.mov`
- [x] T004 [P] InfoIcon SVG 컴포넌트 추가 in `migration/src/shared/ui/icons/ui-icons.tsx` (레거시 info-circle.svg 인라인 변환)

---

## Phase 2: Foundational (기존 컴포넌트 표준화)

**Purpose**: 기존 Button, TextField의 joinClasses → cn 교체. 모든 신규 컴포넌트가 동일한 유틸리티를 공유하게 함.

**⚠️ CRITICAL**: 이 페이즈 완료 전에 신규 컴포넌트 작업 시작 불가

- [x] T005 Button 컴포넌트 joinClasses → cn 교체 in `migration/src/shared/ui/button/index.tsx`
- [x] T006 [P] TextField 컴포넌트 joinClasses → cn 교체 in `migration/src/shared/ui/input-field/index.tsx`
- [x] T007 typecheck + lint 통과 확인

**Checkpoint**: cn 유틸리티 표준화 완료 — 유저 스토리 구현 시작 가능

---

## Phase 3: User Story 1 - Typography (Priority: P1) 🎯 MVP

**Goal**: 18가지 텍스트 변형을 제공하는 Typography 컴포넌트 포팅. 앱 전체 시각 일관성의 기반.

**Independent Test**: Typography 단독 렌더링 후 18가지 variant가 레거시와 동일한 폰트 크기/굵기 출력하는지 시각 비교.

### Implementation for User Story 1

- [x] T008 [US1] Typography 컴포넌트 포팅 in `migration/src/shared/ui/typography/index.tsx` (레거시 `src/renderer/src/shared/ui/typography/Typography.tsx` 참조, cn 사용)

**Checkpoint**: Typography 컴포넌트 독립 사용 가능

---

## Phase 4: User Story 2 - LoadingSpinner (Priority: P1)

**Goal**: MOV 비디오 기반 로딩 스피너 포팅. API 대기 상태에서 사용자 피드백 제공.

**Independent Test**: LoadingSpinner 단독 렌더링 후 레거시와 동일한 비디오 재생, 크기 변형(sm/md/lg) 확인.

### Implementation for User Story 2

- [x] T009 [US2] LoadingSpinner 컴포넌트 포팅 in `migration/src/shared/ui/loading-spinner/index.tsx` (레거시 `src/renderer/src/shared/ui/loading/LoadingSpinner.tsx` 참조, cn 사용, Loading.mov 임포트 경로 조정)

**Checkpoint**: LoadingSpinner 컴포넌트 독립 사용 가능

---

## Phase 5: User Story 3 - Modal (Priority: P2)

**Goal**: 오버레이 + ESC 닫기 + 스크롤 락이 통합된 Modal 컴포넌트 구현. 레거시 ModalPortal에 기능 확장.

**Independent Test**: 모달 열고 닫기(ESC, 오버레이 클릭), 배경 스크롤 잠금 동작 확인.

### Tests for User Story 3

- [x] T010 [P] [US3] Modal 단위 테스트 작성 in `migration/tests/unit/shared/ui/modal.test.tsx` (열림/닫힘, ESC, 오버레이 클릭, 스크롤 락 검증)

### Implementation for User Story 3

- [x] T011 [US3] Modal 컴포넌트 구현 in `migration/src/shared/ui/modal/index.tsx` (레거시 ModalPortal 기반 + 오버레이/ESC/스크롤락 추가, ReactDOM.createPortal 사용)
- [x] T012 [US3] Modal 테스트 통과 확인

**Checkpoint**: Modal 컴포넌트 독립 사용 가능

---

## Phase 6: User Story 4 - ToggleSwitch (Priority: P2)

**Goal**: ON/OFF 토글 스위치 포팅. 일반 토글(레이블 슬라이딩 인디케이터) + 알림용 소형 토글.

**Independent Test**: 토글 클릭 시 상태 전환, 레이블 표시, 비활성화 상태 동작 확인.

### Tests for User Story 4

- [x] T013 [P] [US4] ToggleSwitch 단위 테스트 작성 in `migration/tests/unit/shared/ui/toggle-switch.test.tsx` (상태 전환, onChange 콜백, 비활성화, 접근성 role=switch 확인)

### Implementation for User Story 4

- [x] T014 [US4] ToggleSwitch 컴포넌트 포팅 in `migration/src/shared/ui/toggle-switch/index.tsx` (레거시 ToggleSwitch + NotificationToggleSwitch 동시 포팅, forwardRef, cn 사용, 동적 인디케이터 계산 유지)
- [x] T015 [US4] ToggleSwitch 테스트 통과 확인

**Checkpoint**: ToggleSwitch, NotificationToggleSwitch 컴포넌트 독립 사용 가능

---

## Phase 7: User Story 5 - Timer (Priority: P3)

**Goal**: SVG 세그먼트 카운트다운 시각 표시 컴포넌트 포팅. value 0-5 세그먼트 표시.

**Independent Test**: Timer에 value 0-5 전달 시 활성 세그먼트 패턴이 레거시와 일치하는지 확인.

### Implementation for User Story 5

- [x] T016 [US5] Timer 컴포넌트 포팅 in `migration/src/shared/ui/timer/index.tsx` (레거시 `src/renderer/src/shared/ui/timer/Timer.tsx` 참조, SVG 세그먼트 맵 + centerPathMap 그대로 이관, CSS 변수 사용)

**Checkpoint**: Timer 컴포넌트 독립 사용 가능

---

## Phase 8: User Story 6 - PanelHeader (Priority: P3)

**Goal**: 패널 제목 + info 아이콘이 포함된 PanelHeader 포팅.

**Independent Test**: PanelHeader에 children 전달 시 레거시와 동일한 레이아웃(텍스트 + info 아이콘) 출력 확인.

### Implementation for User Story 6

- [x] T017 [US6] PanelHeader 컴포넌트 포팅 in `migration/src/shared/ui/panel-header/index.tsx` (레거시 PannelHeader 참조, InfoIcon은 T004에서 생성한 ui-icons.tsx에서 임포트)

**Checkpoint**: PanelHeader 컴포넌트 독립 사용 가능

---

## Phase 9: User Story 7 - NotificateMessage (Priority: P3)

**Goal**: 알림 메시지 컴포넌트 포팅. default/success 2가지 변형. CVA → Record 매핑 변환.

**Independent Test**: default/success 변형 각각 렌더링 후 레거시와 동일한 스타일, 단계 번호/성공 아이콘, 에러 메시지 영역 확인.

### Implementation for User Story 7

- [x] T018 [US7] NotificateMessage 컴포넌트 포팅 in `migration/src/shared/ui/notification-message/index.tsx` (레거시 NotificateMessage + icons.tsx 참조, CVA → Record 매핑 변환, SuccessIcon/ErrorIcon은 status-icons.tsx에서 임포트)

**Checkpoint**: NotificateMessage 컴포넌트 독립 사용 가능

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: 전체 컴포넌트 일관성 검증

- [x] T019 typecheck + lint 전체 통과 확인
- [x] T020 기존 인증 페이지(LoginForm, SignUpForm 등)에서 신규 Typography 교체 여부 검토 (필요 시 적용)
- [x] T021 quickstart.md 검증 — 각 컴포넌트 import 및 렌더링 정상 동작 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — 즉시 시작 가능
- **Foundational (Phase 2)**: Phase 1 완료 후 — BLOCKS all user stories
- **User Stories (Phase 3-9)**: Phase 2 완료 후 시작
  - US1-US2 (P1) → US3-US4 (P2) → US5-US7 (P3) 우선순위 순서
  - 동일 우선순위 내에서는 병렬 가능
- **Polish (Phase 10)**: 모든 유저 스토리 완료 후

### User Story Dependencies

- **US1 (Typography)**: Phase 2 완료 후 즉시 시작 — 다른 스토리 비의존
- **US2 (LoadingSpinner)**: Phase 2 + T003(에셋) 완료 후 — 다른 스토리 비의존
- **US3 (Modal)**: Phase 2 완료 후 — 다른 스토리 비의존
- **US4 (ToggleSwitch)**: Phase 2 완료 후 — 다른 스토리 비의존
- **US5 (Timer)**: Phase 2 완료 후 — 다른 스토리 비의존
- **US6 (PanelHeader)**: Phase 2 + T004(InfoIcon) 완료 후 — 다른 스토리 비의존
- **US7 (NotificateMessage)**: Phase 2 완료 후 — 다른 스토리 비의존

### Parallel Opportunities

- Phase 1: T003, T004 병렬 가능
- Phase 2: T005, T006 병렬 가능 (다른 파일)
- P1 스토리: T008(Typography), T009(LoadingSpinner) 병렬 가능
- P2 스토리: T010-T012(Modal), T013-T015(ToggleSwitch) 병렬 가능
- P3 스토리: T016(Timer), T017(PanelHeader), T018(NotificateMessage) 병렬 가능

---

## Parallel Example: P1 Stories

```bash
# T008과 T009는 다른 파일이므로 병렬 실행 가능:
Task T008: "Typography in migration/src/shared/ui/typography/index.tsx"
Task T009: "LoadingSpinner in migration/src/shared/ui/loading-spinner/index.tsx"
```

## Parallel Example: P2 Stories

```bash
# Modal과 ToggleSwitch는 다른 파일이므로 병렬 실행 가능:
Task T010-T012: "Modal in migration/src/shared/ui/modal/ + tests"
Task T013-T015: "ToggleSwitch in migration/src/shared/ui/toggle-switch/ + tests"
```

---

## Implementation Strategy

### MVP First (P1 스토리만)

1. Phase 1: Setup (T001-T004)
2. Phase 2: Foundational (T005-T007)
3. Phase 3-4: US1 Typography + US2 LoadingSpinner (T008-T009)
4. **STOP and VALIDATE**: P1 컴포넌트 시각 검증
5. 인증 페이지에 Typography 교체 적용 검토

### Incremental Delivery

1. Setup + Foundational → 기반 준비
2. US1 Typography → 시각 검증 → 인증 페이지에 적용 (MVP!)
3. US2 LoadingSpinner → 시각 검증 → 로딩 상태에 적용
4. US3-US4 (P2) → Modal, ToggleSwitch 추가
5. US5-US7 (P3) → Timer, PanelHeader, NotificateMessage 추가
6. Polish → 전체 일관성 검증

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- 모든 컴포넌트는 레거시 원본 파일 경로를 주석으로 포함
- 레거시 컴포넌트의 Props 인터페이스와 필드명 동일하게 유지
- cn 유틸리티로 Tailwind 클래스 충돌 자동 해결
- CVA 의존성은 추가하지 않고 Record 매핑으로 대체
- Commit after each task or logical group
