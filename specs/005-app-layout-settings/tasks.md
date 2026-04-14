# Tasks: 앱 레이아웃 및 설정 시스템

**Input**: Design documents from `/specs/005-app-layout-settings/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: ThemeToggleSwitch(복잡 토글 인터랙션)과 TimeControlSection(인라인 편집+범위 검증)은 회귀 위험이 높아 단위 테스트 포함. 나머지 컴포넌트는 시각 검증으로 충분 (헌법 5원칙: 단순 마크업 이관은 테스트 강제 안 함).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (의존성 + 디렉터리)

**Purpose**: 의존성 추가, Tauri 플러그인 등록, 디렉터리 구조 생성

- [x] T001 `@tauri-apps/plugin-autostart` 패키지 설치 (`cd migration && bun add @tauri-apps/plugin-autostart`)
- [x] T002 `tauri-plugin-autostart` Rust 의존성 추가 in `migration/src-tauri/Cargo.toml` (`cargo add tauri-plugin-autostart` in src-tauri)
- [x] T003 [P] Tauri 플러그인 등록 in `migration/src-tauri/src/lib.rs` (`.plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))`)
- [x] T004 [P] Autostart 권한 추가 in `migration/src-tauri/capabilities/` (`"autostart:default"` 권한)
- [x] T005 [P] 디렉터리 구조 생성 (`entities/theme/model/`, `features/layout/ui/`, `features/layout/model/`, `features/settings/ui/`, `features/notification-settings/ui/components/`, `features/notification-settings/model/`, `shared/hooks/`, `shared/ui/theme-toggle-switch/`, `pages/dashboard-page/`)

---

## Phase 2: Foundational (공유 인프라)

**Purpose**: 테마 스토어, ThemeProvider, useModal 훅 — 모든 유저 스토리의 전제 조건

**⚠️ CRITICAL**: 이 페이즈 완료 전에 유저 스토리 작업 시작 불가

- [x] T006 테마 상태 스토어 생성 in `migration/src/entities/theme/model/use-theme-store.ts` (Zustand persist + localStorage, preference/resolvedTheme/isDark/setPreference, 시스템 테마 matchMedia 감지)
- [x] T007 [P] 테마 엔티티 re-export in `migration/src/entities/theme/index.ts`
- [x] T008 [P] ThemeProvider 생성 in `migration/src/app/providers/theme-provider.tsx` (스토어 구독 → `<html>` 요소 `dark` 클래스 토글, matchMedia 리스너로 시스템 테마 변경 감지)
- [x] T009 [P] useModal 훅 생성 in `migration/src/shared/hooks/use-modal.ts` (isOpen/open/close/toggle 반환, 레거시 `useModal`과 동일 인터페이스)
- [x] T010 typecheck 통과 확인 (Phase 2)

**Checkpoint**: 테마 스토어, ThemeProvider, useModal 준비 완료 — 유저 스토리 구현 시작 가능

---

## Phase 3: User Story 3 - 테마 전환 (Priority: P1) 🎯 MVP

**Goal**: 태양/달 아이콘이 있는 ThemeToggleSwitch 컴포넌트 포팅. 테마 스토어와 연동하여 라이트/다크 모드 전환.

**Independent Test**: ThemeToggleSwitch 단독 렌더링 후 토글 클릭 시 isDark 상태 전환, sun/moon 아이콘 교체, CSS 클래스 변경 확인.

### Tests for User Story 3

- [x] T011 [P] [US3] ThemeToggleSwitch 단위 테스트 작성 in `migration/tests/unit/shared/ui/theme-toggle-switch.test.tsx` (checked/onChange 연동, 접근성 role/button 확인, sun/moon 아이콘 조건부 렌더링)

### Implementation for User Story 3

- [x] T012 [US3] ThemeToggleSwitch 컴포넌트 포팅 in `migration/src/shared/ui/theme-toggle-switch/index.tsx` (레거시 `src/renderer/src/shared/ui/theme-toggle-switch/ThemeToggleSwitch.tsx` 참조, sun/moon SVG 인라인 아이콘, cn 사용, 버튼 접근성 속성 포함)
- [x] T013 [US3] ThemeToggleSwitch 테스트 통과 확인

**Checkpoint**: ThemeToggleSwitch 컴포넌트 독립 사용 가능, 테마 토글 인터랙션 검증 완료

---

## Phase 4: User Story 1 - 앱 레이아웃 셸 (Priority: P1)

**Goal**: 인증 후 모든 페이지에 적용되는 고정 헤더 + 콘텐츠 영역 레이아웃. 헤더에 로고 + ThemeToggleSwitch.

**Independent Test**: Header 컴포넌트 단독 렌더링 후 로고(BrandSymbol + BrandLogo) 좌측, ThemeToggleSwitch 우측 배치 확인. RootLayout에서 인증 상태에 따른 조건부 헤더 렌더링 확인.

### Implementation for User Story 1

- [x] T014 [US1] Header 컴포넌트 포팅 in `migration/src/features/layout/ui/Header.tsx` (레거시 `src/renderer/src/app/layouts/header/Header.tsx` 참조, BrandSymbol + BrandLogo 좌측, ThemeToggleSwitch 우측, fixed header + z-100, cn 사용)
- [x] T015 [US1] RootLayout 업데이트 in `migration/src/app/layouts/RootLayout.tsx` (인증 상태에 따라 Header 조건부 렌더링, 콘텐츠 영역에 헤더 높이만큼 pt-[75px]/pt-15 상단 패딩)

**Checkpoint**: 인증 후 페이지에서 고정 헤더 + 콘텐츠 영역 레이아웃 동작

---

## Phase 5: User Story 2 - 대시보드 헤더 및 탭 네비게이션 (Priority: P1)

**Goal**: 대시보드 전용 헤더(알약 모양 탭 네비게이션) + 대시보드 페이지 뼈대. 탭: 대시보드, 설정, 오류 제보, 후기 등록.

**Independent Test**: DashboardHeader 단독 렌더링 후 로고, 알약 탭 네비게이션, ThemeToggleSwitch, 알림 버튼 배치 확인. 탭 클릭 시 활성 상태 전환 확인.

### Implementation for User Story 2

- [x] T016 [US2] useNavigationTabs 훅 생성 in `migration/src/features/layout/model/use-navigation-tabs.ts` (활성 탭 상태 관리, 탭 정의: dashboard/settings/report/review, 외부 링크 처리)
- [x] T017 [US2] DashboardHeader 컴포넌트 포팅 in `migration/src/features/layout/ui/DashboardHeader.tsx` (레거시 `src/renderer/src/features/dashboard/ui/MainHeader.tsx` 참조, 좌측 로고, 중앙 알약 탭 네비게이션, 우측 ThemeToggleSwitch + 알림 버튼, cn 사용)
- [x] T018 [US2] 대시보드 페이지 뼈대 생성 in `migration/src/pages/dashboard-page/index.tsx` (DashboardHeader + useModal로 설정/알림 모달 관리, 탭 콘텐츠 영역 placeholder)
- [x] T019 [US2] 라우터에 대시보드 페이지 등록 in `migration/src/shared/config/router.tsx` (`/main` 라우트에 dashboard-page 연결, lazy loading)

**Checkpoint**: 대시보드 페이지에서 탭 네비게이션 동작, 설정/알림 버튼 표시

---

## Phase 6: User Story 4 - 설정 모달 (Priority: P2)

**Goal**: 설정 모달 포팅. OS 자동 시작 토글, 로그아웃, 회원 탈퇴, 캘리브레이션 초기화.

**Independent Test**: 설정 모달 열기/닫기 후 4개 설정 항목(자동 시작, 로그아웃, 탈퇴, 캘리브레이션 초기화)이 레거시와 동일하게 표시되는지 확인.

### Implementation for User Story 4

- [x] T020 [US4] SettingsModal 컴포넌트 포팅 in `migration/src/features/settings/ui/SettingsModal.tsx` (레거시 `src/renderer/src/features/dashboard/ui/SettingsModal.tsx` 참조, Modal 컴포넌트 재사용, NotificationToggleSwitch로 자동 시작 토글, 로그아웃/탈퇴/캘리브레이션 초기화 버튼, @tauri-apps/plugin-autostart enable/disable/isEnabled 호출, cn 사용)

**Checkpoint**: 설정 모달 독립 사용 가능, OS 자동 시작 토글 연동

---

## Phase 7: User Story 5 - 알림 설정 모달 (Priority: P2)

**Goal**: 알림 설정 모달 포팅. 알림 허용 토글, 스트레칭 주기, 거북목 경고 주기 + TimeControlSection.

**Independent Test**: 알림 설정 모달 열기 후 알림 허용 토글, 시간 편집(+/-, 인라인) 인터랙션이 레거시와 동일하게 동작하는지 확인.

### Tests for User Story 5

- [x] T021 [P] [US5] TimeControlSection 단위 테스트 작성 in `migration/tests/unit/features/notification-settings/components/time-control-section.test.tsx` (+/- 버튼 증감, 인라인 편집 모드 전환, 범위 클램핑(min/max), disabled 상태)

### Implementation for User Story 5

- [x] T022 [US5] 알림 설정 스토어 포팅 in `migration/src/features/notification-settings/model/use-notification-store.ts` (레거시 `src/renderer/src/features/notification/model/use-notificationStore.ts` 참조, Zustand persist + sessionStorage, isAllow/stretching/turtleNeck 상태)
- [x] T023 [P] [US5] TimeControlSection 컴포넌트 포팅 in `migration/src/features/notification-settings/ui/components/TimeControlSection.tsx` (레거시 `src/renderer/src/features/notification/ui/components/TimeControlSection.tsx` 참조, +/- 버튼, 인라인 편집 모드, 1-300 범위 검증, cn 사용)
- [x] T024 [US5] NotificationModal 컴포넌트 포팅 in `migration/src/features/notification-settings/ui/NotificationModal.tsx` (레거시 `src/renderer/src/features/notification/ui/NotificationModal.tsx` 참조, Modal 재사용, NotificationToggleSwitch로 알림 허용 토글, TimeControlSection으로 스트레칭/거북목 주기 설정)
- [x] T025 [US5] TimeControlSection 테스트 통과 확인

**Checkpoint**: 알림 설정 모달 독립 사용 가능, 시간 편집 인터랙션 검증 완료

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 전체 컴포넌트 일관성 검증, 대시보드 페이지 통합

- [x] T026 typecheck + lint 전체 통과 확인
- [x] T027 대시보드 페이지 통합 확인 (DashboardHeader + SettingsModal + NotificationModal + 탭 전환 모두 연동)
- [x] T028 quickstart.md 검증 — 각 컴포넌트 import 및 렌더링 정상 동작 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — 즉시 시작 가능
- **Foundational (Phase 2)**: Phase 1 완료 후 — BLOCKS all user stories
- **User Story 3 (Phase 3)**: Phase 2 완료 후 — ThemeToggleSwitch (US1, US2가 의존)
- **User Story 1 (Phase 4)**: Phase 2 + Phase 3(ThemeToggleSwitch) 완료 후
- **User Story 2 (Phase 5)**: Phase 2 + Phase 3(ThemeToggleSwitch) 완료 후
- **User Story 4 (Phase 6)**: Phase 2(useModal) 완료 후 — US1, US2와 독립
- **User Story 5 (Phase 7)**: Phase 2(useModal) 완료 후 — US4와 독립
- **Polish (Phase 8)**: 모든 유저 스토리 완료 후

### User Story Dependencies

- **US3 (테마 전환)**: Phase 2 완료 후 즉시 시작 — US1, US2의 전제 조건 (ThemeToggleSwitch)
- **US1 (레이아웃 셸)**: US3(ThemeToggleSwitch) 완료 후 — 다른 스토리 비의존
- **US2 (대시보드 헤더)**: US3(ThemeToggleSwitch) 완료 후 — 다른 스토리 비의존
- **US4 (설정 모달)**: Phase 2(useModal) 완료 후 — US1, US2, US3과 독립
- **US5 (알림 설정)**: Phase 2(useModal) 완료 후 — US4와 병렬 가능

### Parallel Opportunities

- Phase 1: T003, T004, T005 병렬 가능
- Phase 2: T007, T008, T009 병렬 가능 (다른 파일)
- Phase 3: T011(test), T012(implementation) — test 먼저 작성
- Phase 4 + Phase 6: US1(Header)과 US4(SettingsModal) 병렬 가능 (다른 파일)
- Phase 5 + Phase 6: US2(DashboardHeader)과 US4(SettingsModal) 병렬 가능
- Phase 6 + Phase 7: US4(SettingsModal)과 US5(NotificationModal) 병렬 가능
- Phase 7: T022(store), T023(TimeControlSection) 병렬 가능

---

## Parallel Example: P1 Stories

```bash
# US3 먼저 완료 (ThemeToggleSwitch — US1, US2의 전제 조건)
Task T011-T013: "ThemeToggleSwitch in shared/ui/theme-toggle-switch/"

# US1과 US2는 ThemeToggleSwitch 완료 후 병렬 가능:
Task T014-T015: "Header in features/layout/ui/Header.tsx"
Task T016-T019: "DashboardHeader in features/layout/ui/DashboardHeader.tsx"
```

## Parallel Example: P2 Stories

```bash
# US4와 US5는 다른 파일이므로 병렬 가능:
Task T020: "SettingsModal in features/settings/ui/SettingsModal.tsx"
Task T021-T025: "NotificationModal in features/notification-settings/"
```

---

## Implementation Strategy

### MVP First (P1 스토리만)

1. Phase 1: Setup (T001-T005)
2. Phase 2: Foundational (T006-T010)
3. Phase 3: US3 ThemeToggleSwitch (T011-T013)
4. Phase 4: US1 Layout Shell (T014-T015)
5. Phase 5: US2 Dashboard Header (T016-T019)
6. **STOP and VALIDATE**: P1 전체 시각 검증 (헤더, 탭 네비게이션, 테마 전환)

### Incremental Delivery

1. Setup + Foundational → 기반 준비
2. US3 ThemeToggleSwitch → 테마 토글 독립 검증
3. US1 Layout Shell → 헤더 + 콘텐츠 레이아웃 적용
4. US2 Dashboard Header → 탭 네비게이션 + 대시보드 페이지 (MVP!)
5. US4 Settings Modal → 설정 기능 추가
6. US5 Notification Settings → 알림 설정 추가
7. Polish → 전체 일관성 검증

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- 모든 컴포넌트는 레거시 원본 파일 경로를 주석으로 포함
- 레거시 컴포넌트의 Props 인터페이스와 필드명 동일하게 유지
- cn 유틸리티로 Tailwind 클래스 충돌 자동 해결
- 004에서 구현된 Modal, NotificationToggleSwitch, BrandLogo, BrandSymbol 재사용
- Commit after each task or logical group
