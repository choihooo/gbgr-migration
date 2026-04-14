# Tasks: 온보딩/보정 도메인 이관

**Input**: Design documents from `/specs/007-onboarding-calibration/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: CalibrationGate 로직에 한해 단위 테스트 포함. UI 컴포넌트는 수동 시각 검증.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Migration app**: `migration/src/` (React + TypeScript)
- **Legacy reference**: `src/renderer/src/` (read-only reference)
- **Base path**: All migration paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 에셋 복사, 의존성 설치, 공유 유틸리티 포팅

- [x] T001 온보딩 에셋 복사: `src/renderer/src/assets/onboarding/` (17개 파일) → `migration/src/assets/onboarding/`
- [x] T002 [P] 공통 에셋 복사: `src/renderer/src/assets/common/images/calibration_guide.svg` → `migration/src/assets/common/images/calibration_guide.svg`
- [x] T003 [P] 카메라 아이콘 복사: `src/renderer/src/assets/common/icons/camera.svg` → `migration/src/assets/common/icons/camera.svg` (존재 확인 후)
- [x] T004 [P] 완료 캐릭터 아이콘 복사: `src/renderer/src/assets/common/icons/completion.svg` → `migration/src/assets/common/icons/completion.svg` (존재 확인 후)
- [x] T005 react-webcam 의존성 설치: `bun add react-webcam` 및 타입 설치
- [x] T006 [P] 슬라이드 애니메이션 키프레임 추가: TailwindCSS 설정에 `animate-slide-next`, `animate-slide-prev` 키프레임 정의 in `migration/src/shared/styles/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story의 전제 조건이 되는 보정 게이트 유틸리티, 라우팅 가드, i18n 키

**⚠️ CRITICAL**: 이 단계가 완료되어야 US1~US5 작업 시작 가능

- [x] T007 calibration-gate.ts 포팅: `src/renderer/src/shared/lib/calibration-gate.ts` → `migration/src/shared/lib/calibration-gate.ts` (순수 함수 7개, localStorage 기반)
- [x] T008 [P] CalibrationGate 단위 테스트: `migration/src/shared/lib/__tests__/calibration-gate.test.ts` (getState, canAccess, lock, clear 동작 검증)
- [x] T009 CalibrationRouteGuard 컴포넌트 구현: `migration/src/shared/lib/calibration-route-guard.tsx` (canAccessCalibrationFlow 체크, 실패 시 /main 리다이렉트)
- [x] T010 use-auth-redirect.ts에 보정 상태 분기 추가: `migration/src/features/auth/model/use-auth-redirect.ts` (getCalibrationGateState 연동, initial_required→/onboarding/init, reset_requested→/onboarding/calibration, locked→/main)
- [x] T011 router.tsx에 CalibrationRouteGuard 적용: `migration/src/shared/config/router.tsx` (onboarding 하위 라우트에 가드 래핑)
- [x] T012 [P] 온보딩 i18n 키 추가: `migration/src/shared/lib/i18n/resources.ts` (ko/en 리소스에 온보딩 관련 번역 키 추가 — 슬라이드 제목/설명, 카메라 안내, 보정 안내, 완료 안내, 엔진 미연결 메시지)

**Checkpoint**: 보정 게이트 + 라우팅 가드 + i18n 준비 완료. 이후 US1~US5 병렬 작업 가능

---

## Phase 3: User Story 1 - 온보딩 소개 5단계 슬라이드 (Priority: P1) 🎯 MVP

**Goal**: `/onboarding/init`에서 5단계 소개 슬라이드가 레거시와 동일하게 동작

**Independent Test**: `/onboarding/init` 진입 → 5단계 슬라이드 내용/순서 확인 → 좌우 네비게이션 → 마지막 단계에서 다음 클릭 → `/onboarding` 이동

### Implementation for User Story 1

- [x] T013 [P] [US1] ImageDescriptionPanel 컴포넌트 포팅: `src/renderer/src/pages/onboarding-page/components/ImageDescriptionPanel.tsx` → `migration/src/pages/onboarding-page/components/ImageDescriptionPanel.tsx` (5단계 이미지 렌더링, dark/light 모드, prev 버튼, 이미지 프리로딩, min-w-[894px])
- [x] T014 [P] [US1] InfoPanel 컴포넌트 포팅: `src/renderer/src/pages/onboarding-page/components/InfoPanel.tsx` → `migration/src/pages/onboarding-page/components/InfoPanel.tsx` (진행 표시자, 단계별 제목/설명, 다음/시작하기 버튼, responsive width clamp)
- [x] T015 [P] [US1] FirstImageDescription 컴포넌트 포팅: `src/renderer/src/pages/onboarding-page/components/FirstImageDescription.tsx` → `migration/src/pages/onboarding-page/components/FirstImageDescription.tsx` (Giraffe/Turtle 아이콘, 환영 메시지, username 표시)
- [x] T016 [US1] OnboardingInitPage 전체 구현: `migration/src/pages/onboarding-init-page/index.tsx` (currentStep 상태 관리, direction 전환, handlePrev/handleNext, ImageDescriptionPanel + InfoPanel 조합, 완료 시 navigate('/onboarding'))

**Checkpoint**: `/onboarding/init`에서 5단계 슬라이드 전체 흐름이 레거시와 동일하게 동작

---

## Phase 4: User Story 2 - 카메라 권한 안내 (Priority: P1)

**Goal**: `/onboarding`에서 카메라 사용 안내와 진행 버튼이 레거시와 동일하게 표시

**Independent Test**: `/onboarding` 진입 → 카메라 아이콘, 안내 문구, 프라이버시 안내 확인 → 버튼 클릭 → `/onboarding/calibration` 이동

### Implementation for User Story 2

- [x] T017 [P] [US2] CameraPermissionButton 컴포넌트 포팅: `src/renderer/src/pages/onboarding-page/components/CameraPermissionButton.tsx` → `migration/src/pages/onboarding-page/components/CameraPermissionButton.tsx` (navigator.mediaDevices.getUserMedia 호출, deviceId 저장, CameraStore 대신 localStorage 직접 관리, 권한 성공 시 navigate('/onboarding/calibration'))
- [x] T018 [US2] OnboardingPage 전체 구현: `migration/src/pages/onboarding-page/index.tsx` (CameraIcon, 카메라 사용 권한 타이틀, 프라이버시 안내 문구, CameraPermissionButton 배치, 레거시 레이아웃 유지)

**Checkpoint**: `/onboarding`에서 카메라 권한 안내 화면이 레거시와 동일하게 렌더링

---

## Phase 5: User Story 3 - 보정 측정 화면 (Priority: P1)

**Goal**: `/onboarding/calibration`에서 보정 UI 레이아웃이 레거시와 동일하게 표시. 측정 엔진 미연결이므로 버튼 비활성화 + 안내 메시지

**Independent Test**: `/onboarding/calibration` 진입 → 웰컴 패널 + 카메라 뷰 placeholder + 비활성화된 측정 버튼 + 미연결 안내 메시지 확인

### Implementation for User Story 3

- [x] T019 [P] [US3] WebcamView 컴포넌트 포팅 (UI만): `src/renderer/src/pages/calibration-page/components/WebcamView.tsx` → `migration/src/pages/calibration-page/components/WebcamView.tsx` (react-webcam 렌더링, 미러링, 비디오 ref 노출, showTimer/remainingTime props. PoseDetection/PoseVisualizer는 주석 처리 또는 조건부 렌더링)
- [x] T020 [P] [US3] WelcomePanel 컴포넌트 포팅: `src/renderer/src/pages/calibration-page/components/WelcomePanel.tsx` → `migration/src/pages/calibration-page/components/WelcomePanel.tsx` (CalibrationGuide 이미지, username 표시, 측정 시작 버튼. isEngineAvailable=false 시 버튼 비활성화 + 미연결 안내 메시지 표시)
- [x] T021 [P] [US3] MeasuringPanel 컴포넌트 포팅: `src/renderer/src/pages/calibration-page/components/MeasuringPanel.tsx` → `migration/src/pages/calibration-page/components/MeasuringPanel.tsx` (step1/step2 에러 표시, 측정 중 안내 문구, NotificateMessage 연동)
- [x] T022 [US3] CalibrationPage 전체 구현: `migration/src/pages/calibration-page/index.tsx` (isEngineAvailable=false 상태 플래그, WelcomePanel/MeasuringPanel 조건부 렌더링, WebcamView 배치, 레거시 레이아웃 유지. 측정 타이머/데이터 수집 로직은 008에서 연결할 진입점만 마련)

**Checkpoint**: 보정 화면 UI가 레거시와 동일한 레이아웃으로 렌더링, 측정 버튼 비활성화 상태

---

## Phase 6: User Story 4 - 보정 완료 후 메인 진입 (Priority: P1)

**Goal**: `/onboarding/completion`에서 완료 안내와 메인 이동 버튼이 레거시와 동일하게 동작

**Independent Test**: `/onboarding/completion` 진입 → 완료 캐릭터, 안내 문구 확인 → 시작하기 버튼 클릭 → 세션 생성 → `/main` 이동

### Implementation for User Story 4

- [x] T023 [US4] OnboardingCompletionPage 전체 구현: `migration/src/pages/onboarding-completion-page/index.tsx` (CompletionCharacter 아이콘, "자세 등록 완료" 타이틀, 안내 문구, useCreateSessionMutation 연동, useLevelQuery 연동, sessionStartDistance localStorage 저장, 버튼 클릭 시 세션 생성 후 navigate('/main'))

**Checkpoint**: 보정 완료 → 메인 진입 흐름이 정상 동작

---

## Phase 7: User Story 5 - 보정 상태 라우팅 (Priority: P2)

**Goal**: 보정 상태에 따라 로그인 후 올바른 경로로 자동 이동

**Independent Test**: localStorage 조작으로 보정 상태 변경 → 로그인 → 이동 경로 검증 (initial_required→/onboarding/init, reset_requested→/onboarding/calibration, locked→/main)

### Tests for User Story 5

- [x] T024 [US5] 보정 상태 라우팅 단위 테스트: `migration/src/features/auth/model/__tests__/use-auth-redirect.test.ts` (보정 상태별 리다이렉트 경로 검증, CalibrationGateState mock)

### Implementation for User Story 5

- [x] T025 [US5] 보정 라우트 가드 엣지케이스 처리: `migration/src/shared/lib/calibration-route-guard.tsx` 보완 (localStorage 손상 시 initial_required로 폴백, userId null 처리, 보정 완료 사용자가 보정 라우트 직접 URL 접근 시 /main 리다이렉트 검증)

**Checkpoint**: 모든 보정 상태에서 올바른 라우팅 분기 동작 확인

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 전체 흐름 통합 검증 및 마무리

- [x] T026 전체 온보딩 흐름 E2E 검증: `/onboarding/init` → 5단계 슬라이드 → 카메라 안내 → 보정 화면(UI 확인) → 완료 → `/main` (수동 시나리오)
- [x] T027 [P] 레거시-마이그레이션 시각 비교: 각 단계 스크린샷 캡처 후 레이아웃/텍스트/이미지/버튼 정합성 확인 (SC-002)
- [x] T028 [P] dark/light 모드 전환 시 온보딩 화면 정상 렌더링 확인 (슬라이드 이미지 dark variant 교체, 텍스트 색상)
- [x] T029 [P] i18n ko/en 전환 시 모든 온보딩 문자열 정상 표시 확인
- [x] T030 lint, typecheck, build 통과 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (에셋 필요) - BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 (i18n 키, 애니메이션 키프레임)
- **US2 (Phase 4)**: Depends on Phase 2 (i18n 키). US1과 독립적이지만 흐름상 US1 이후 권장
- **US3 (Phase 5)**: Depends on Phase 2 (i18n 키, 에셋). US1/US2와 독립적
- **US4 (Phase 6)**: Depends on Phase 2 (session entity). US3 완료 후 권장 (완료 화면은 보정 후 진입)
- **US5 (Phase 7)**: Depends on Phase 2 (calibration-gate, auth-redirect). 독립적
- **Polish (Phase 8)**: Depends on US1~US5 전체 완료

### User Story Dependencies

- **US1 (P1)**: Phase 2 이후 즉시 시작 가능
- **US2 (P1)**: US1과 독립. 병렬 가능
- **US3 (P1)**: US1/US2와 독립. 병렬 가능
- **US4 (P1)**: US3 완료 후 권장 (세션 생성은 보정 완료 컨텍스트 필요)
- **US5 (P2)**: Phase 2 완료 후 독립 시작 가능

### Within Each User Story

- 컴포넌트 포팅 태스크(병렬) → 페이지 조립 태스크(순차)
- 각 스토리 완료 후 독립 검증

### Parallel Opportunities

- Phase 1: T001~T006 모두 병렬 가능
- Phase 2: T007 → T008, T012 병렬. T009~T011은 T007 이후 병렬
- Phase 3 (US1): T013, T014, T015 병렬 → T016 순차
- Phase 4 (US2): T017 → T018 순차 (같은 폴더)
- Phase 5 (US3): T019, T020, T021 병렬 → T022 순차
- Phase 8: T027, T028, T029 병렬

---

## Parallel Example: User Story 1

```bash
# Launch all US1 components in parallel:
Task T013: "ImageDescriptionPanel 컴포넌트 포팅 in migration/src/pages/onboarding-page/components/ImageDescriptionPanel.tsx"
Task T014: "InfoPanel 컴포넌트 포팅 in migration/src/pages/onboarding-page/components/InfoPanel.tsx"
Task T015: "FirstImageDescription 컴포넌트 포팅 in migration/src/pages/onboarding-page/components/FirstImageDescription.tsx"

# After all three complete:
Task T016: "OnboardingInitPage 전체 구현 in migration/src/pages/onboarding-init-page/index.tsx"
```

## Parallel Example: User Story 3

```bash
# Launch all US3 components in parallel:
Task T019: "WebcamView 컴포넌트 포팅 in migration/src/pages/calibration-page/components/WebcamView.tsx"
Task T020: "WelcomePanel 컴포넌트 포팅 in migration/src/pages/calibration-page/components/WelcomePanel.tsx"
Task T021: "MeasuringPanel 컴포넌트 포팅 in migration/src/pages/calibration-page/components/MeasuringPanel.tsx"

# After all three complete:
Task T022: "CalibrationPage 전체 구현 in migration/src/pages/calibration-page/index.tsx"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (에셋 복사, 의존성)
2. Complete Phase 2: Foundational (calibration-gate, 라우팅, i18n)
3. Complete Phase 3: US1 (온보딩 소개 슬라이드)
4. **STOP and VALIDATE**: 5단계 슬라이드 전환 동작 확인

### Incremental Delivery

1. Setup + Foundational → 기반 준비 완료
2. US1 → 온보딩 소개 슬라이드 동작 (MVP)
3. US2 → 카메라 권한 안내 추가
4. US3 → 보정 화면 UI 추가 (엔진 미연결)
5. US4 → 완료 화면 + 메인 진입
6. US5 → 보정 상태 라우팅 가드 완성
7. Polish → 전체 흐름 통합 검증

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- 모든 UI 컴포넌트는 레거시 CSS 클래스를 그대로 사용 (AGENTS.md: UI 스타일 변경 금지)
- calibration-gate.ts는 레거시에서 직접 복사 후 마이그레이션 앱 alias에 맞게 import 경로만 수정
- 측정 엔진 미연결 상태에서는 WelcomePanel의 측정 버튼이 비활성화 (FR-017)
- 008 스펙에서 isEngineAvailable=true로 전환 시 실제 측정 로직 연결
