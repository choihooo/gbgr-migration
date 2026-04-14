# Tasks: 메인 페이지 이관

**Input**: Design documents from `/specs/006-main-page-migration/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: 이번 이관은 주로 UI 레이아웃과 패널 컴포넌트 복제이므로, 회귀 위험이 높은 카메라 스토어 상태 전환과 레이아웃 조합 로직에 대해서만 단위 테스트를 포함한다. 나머지는 수동 시각 검증으로 충분하다.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Migration app**: `migration/src/` (프론트엔드 소스)
- **레거시 참조**: `src/renderer/src/` (읽기 전용, 포팅 원본)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 메인 페이지 이관에 필요한 공통 인프라 및 스타일 추가

- [x] T001 메인 패널 공통 타입 정의 — `migration/src/features/main-panels/model/types.ts`
  - PanelBaseProps, CameraState 타입 등 패널 전반에서 사용하는 공통 타입 정의
  - 레거시 원본: `src/renderer/src/features/dashboard/ui/` 내 각 패널 props 참고

- [x] T002 [P] 커스텀 스크롤바 스타일 추가 — `migration/src/shared/styles/scrollbar.css`
  - 레거시 `custom-scrollbar` 클래스와 `overscroll-y-contain` 동작을 포팅
  - 레거시 원본: `src/renderer/src/shared/styles/base.css`의 scrollbar 관련 정의
  - `style.css`에 import 추가

- [x] T003 [P] 레거시에서 사용하는 누락된 아이콘 컴포넌트 추가 — `migration/src/shared/ui/icons/`
  - 마이그레이션 앱에 없는 아이콘을 레거시 SVG에서 포팅:
    - `ui-icons.tsx`: HideIcon, ShowIcon, WidgetIcon (WebcamPanel용)
    - `ui-icons.tsx`: ArrowNarrowDownIcon, ArrowNarrowUpIcon (AttendancePanel 월 이동)
    - `ui-icons.tsx`: CalendarIcon, ChevronRightIcon, ClockIcon, HourglassIcon, ThumbupIcon (PosePatternPanel)
  - 레거시 원본: `src/renderer/src/assets/common/icons/` 참고

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 사용자 스토리가 의존하는 데이터 페칭 계층, 스토어, API 클라이언트 구축

**⚠️ CRITICAL**: 이 단계가 완료되어야 패널 컴포넌트 구현 가능

- [x] T004 대시보드 API 클라이언트 및 엔드포인트 정의 — `migration/src/entities/dashboard/api/dashboard-api.ts`
  - 평균 점수, 출석, 레벨, 자세 그래프, 하이라이트, 자세 패턴 API 함수 정의
  - 레거시 원본: `src/renderer/src/entities/dashboard/api/` 참고
  - 이번 범위에서는 함수 시그니처와 반환 타입만 정의 (실제 응답 모킹 가능)

- [x] T005 [P] 세션 API 클라이언트 및 엔드포인트 정의 — `migration/src/entities/session/api/session-api.ts`
  - 세션 생성, 중지, 일시정지, 재개 API 함수 정의
  - 레거시 원본: `src/renderer/src/entities/session/api/` 참고

- [x] T006 대시보드 쿼리 훅 구현 — `migration/src/entities/dashboard/model/`
  - `use-average-score-query.ts` — 평균 자세 점수 조회
  - `use-attendance-query.ts` — 출석 현황 조회
  - `use-level-query.ts` — 레벨/이동거리 조회
  - `use-posture-graph-query.ts` — 자세 그래프 데이터 조회
  - `use-highlight-query.ts` — 하이라이트 데이터 조회
  - `use-posture-pattern-query.ts` — 자세 패턴 데이터 조회
  - 레거시 원본: `src/renderer/src/entities/dashboard/model/` 참고

- [x] T007 [P] 세션 뮤테이션 훅 구현 — `migration/src/entities/session/model/`
  - `use-create-session-mutation.ts` — 세션 생성
  - `use-stop-session-mutation.ts` — 세션 중지
  - `use-resume-session-mutation.ts` — 세션 재개
  - `use-pause-session-mutation.ts` — 세션 일시정지
  - 레거시 원본: `src/renderer/src/entities/session/model/` 참고

- [x] T008 [P] 카메라 상태 스토어 구현 — `migration/src/features/main-panels/model/use-camera-store.ts`
  - Zustand persist 스토어: cameraState('show'|'hide'|'exit'), widgetState('show'|'hide')
  - setCameraState, setWidgetState, toggleCamera, toggleWidget 액션
  - localStorage persist 설정
  - 레거시 원본: `src/renderer/src/widgets/camera/model/use-camera-store.ts`

**Checkpoint**: 데이터 계층 준비 완료 — 패널 컴포넌트 구현 시작 가능

---

## Phase 3: User Story 1 - 대시보드 메인 화면을 동일하게 본다 (Priority: P1) 🎯 MVP

**Goal**: 레거시와 동일한 메인 전용 헤더, 2열 그리드 레이아웃, 독립 스크롤 구조를 복원한다.

**Independent Test**: 로그인 상태에서 `/main` 진입 → 메인 전용 헤더와 2열 레이아웃 표시 확인, 좌/우 영역 독립 스크롤 동작 확인

### Implementation for User Story 1

- [x] T009 [US1] DashboardHeader 컴포넌트 수정 — `migration/src/features/layout/ui/DashboardHeader.tsx`
  - 레거시 MainHeader와 동일한 스타일(알약형 컨테이너, 회색 배경, 로고+탭+토글+알림 버튼) 적용
  - 알림 버튼 클릭 시 NotificationModal 열기 연결
  - 레거시 원본: `src/renderer/src/features/dashboard/ui/MainHeader.tsx`

- [x] T010 [US1] MainContent 2열 그리드 컨테이너 구현 — `migration/src/features/dashboard/ui/MainContent.tsx`
  - `grid-cols-[1fr_minmax(336px,400px)]` 기반 2열 레이아웃
  - 레거시와 동일한 gap, clamp 기반 간격
  - 좌측 영역 하단에 마지막 갱신 문구 "마지막 갱신일: 2025.10.22(수) 17:52"를 레거시와 동일한 위치와 스타일(`text-caption-xs-regular text-grey-200`)로 표시
  - 레거시 원본: `src/renderer/src/pages/main-page/index.tsx` L258-261

- [x] T011 [US1] LeftPanelArea 좌측 스크롤 컨테이너 구현 — `migration/src/features/dashboard/ui/LeftPanelArea.tsx`
  - `overflow-y-auto`, `custom-scrollbar`, `overscroll-y-contain` 적용
  - 패널 자리표시자(placeholder) 컴포넌트 포함 (Phase 4에서 실제 패널로 교체)
  - 레거시 원본: `src/renderer/src/pages/main-page/index.tsx`의 좌측 컬럼 구조

- [x] T012 [US1] RightPanelArea 우측 스크롤 컨테이너 구현 — `migration/src/features/dashboard/ui/RightPanelArea.tsx`
  - 좌측과 동일한 스크롤 스타일 적용
  - 웹캠/러닝 자리표시자 포함
  - 레거시 원본: `src/renderer/src/pages/main-page/index.tsx`의 우측 컬럼 구조

- [x] T013 [US1] 메인 페이지 조합 훅 구현 — `migration/src/features/dashboard/model/use-main-page.ts`
  - 페이지 조립 책임만 담당 (데이터 로직은 각 패널이 자체 처리)
  - 페이지 마운트/언마운트 시 필요한 초기화 로직

- [x] T014 [US1] 대시보드 페이지 엔트리 포인트 수정 — `migration/src/pages/dashboard-page/index.tsx`
  - DashboardHeader + MainContent 조합으로 페이지 재구성
  - 기존 "대시보드 콘텐츠 (구현 예정)" 플레이스홀더 제거
  - NotificationModal 연결

- [x] T015 [US1] 메인 페이지 엔트리 포인트 확인 — `migration/src/pages/main-page/index.tsx`
  - DashboardPage로 정상 위임되는지 확인
  - 필요시 ProtectedRoute 가드 연결 상태 점검

**Checkpoint**: 메인 페이지 레이아웃이 레거시와 동일한 구조로 렌더링되는지 확인 (빈 패널 자리포시자 포함)

---

## Phase 4: User Story 2 - 주요 대시보드 패널을 한 화면에서 확인한다 (Priority: P1)

**Goal**: 평균 자세 점수, 출석 현황, 이동거리, 그래프, 하이라이트, 자세 패턴, 웹캠, 러닝 요약 패널을 레거시와 동일한 배치와 카드 외형으로 복원한다.

**Independent Test**: `/main` 진입 후 8개 패널의 존재 여부, 배치 순서, 카드 컨테이너 스타일(`rounded-3xl`, `bg-grey-0`, 간격)이 레거시와 동일한지 비교

### Implementation for User Story 2

- [x] T016 [P] [US2] AveragePosturePanel 구현 — `migration/src/features/main-panels/ui/AveragePosturePanel.tsx`
  - 그라데이션 배경 + 점수 + 레벨 + 캐릭터 이미지 레이아웃
  - `useAverageScoreQuery` 연결 (로딩/에러 상태 포함)
  - 엣지 케이스: 캘리브레이션 데이터가 없거나 손상된 상태에서도 패널 카드 외형이 깨지지 않도록 fallback UI 제공
  - 레거시 원본: `src/renderer/src/features/dashboard/ui/AveragePosture/AveragePosturePanel.tsx`

- [x] T017 [P] [US2] AttendancePanel 구현 — `migration/src/features/main-panels/ui/AttendancePanel.tsx`
  - 월간 캘린더 그리드(4x4) + 활동 레벨 색상 + 월 이동 버튼 + 동기부여 메시지
  - `useAttendanceQuery` 연결, viewDate 내부 상태 관리
  - 엣지 케이스: 데이터가 비어있거나 지연되더라도 카드 레이아웃이 무너지지 않도록 처리
  - 레거시 원본: `src/renderer/src/features/dashboard/ui/AttendacePanel.tsx`

- [x] T018 [P] [US2] TotalDistancePanel 구현 — `migration/src/features/main-panels/ui/TotalDistancePanel.tsx`
  - 거리 표시 + 진행 바 + 스케일 마커 + 메달 아이콘
  - `useLevelQuery` 연결
  - 엣지 케이스: 데이터가 비어있어도 진행 바 카드 외형 유지
  - 레거시 원본: `src/renderer/src/features/dashboard/ui/TotalDistancePanel.tsx`

- [x] T019 [P] [US2] AverageGraphPanel 구현 — `migration/src/features/main-panels/ui/AverageGraphPanel.tsx`
  - 영역 그래프 + 주간/월간 토글 스위치
  - `usePostureGraphQuery` 연결, activePeriod 내부 상태 관리
  - 엣지 케이스: 데이터가 비어있을 때 빈 그래프 상태 UI 제공
  - 레거시 원본: `src/renderer/src/features/dashboard/ui/AverageGraph/AverageGraphPannel.tsx`

- [x] T020 [P] [US2] HighlightsPanel 구현 — `migration/src/features/main-panels/ui/HighlightsPanel.tsx`
  - 막대 그래프(현재/이전 기간 이중 색상) + 주간/월간 토글
  - `useHighlightQuery` 연결
  - 엣지 케이스: 데이터가 비어있을 때 빈 막대 그래프 상태 UI 제공
  - 레거시 원본: `src/renderer/src/features/dashboard/ui/HighlightsPanel.tsx`

- [x] T021 [P] [US2] PosePatternPanel 구현 — `migration/src/features/main-panels/ui/PosePatternPanel.tsx`
  - 2x2 메트릭 그리드(최악 시간, 최악 요일, 회복 시간, 스트레칭) + TIP 섹션
  - `usePosturePatternQuery` 연결
  - 엣지 케이스: 데이터가 없을 때 기본 placeholder 텍스트 표시
  - 레거시 원본: `src/renderer/src/features/dashboard/ui/PosePatternPanel.tsx`

- [x] T022 [P] [US2] WebcamPanel 구현 — `migration/src/features/main-panels/ui/WebcamPanel.tsx`
  - 비디오 피드 영역 + 시작/정지 + 보이기/숨기기 버튼 UI
  - `useCameraStore` 연결, 세션 뮤테이션 훅 연결 (UI 진입점만)
  - 이번 범위에서는 실제 비디오 스트리밍이 아닌 대체 상태 UI 표시
  - 엣지 케이스: 웹캠 접근 권한이 없거나 초기화가 실패해도 우측 영역 전체가 사라지지 않고 권한 요청/에러 대체 UI 표시
  - 레거시 원본: `src/renderer/src/features/dashboard/ui/WebcamPanel.tsx`

- [x] T023 [P] [US2] MiniRunningPanel 구현 — `migration/src/features/main-panels/ui/MiniRunningPanel.tsx`
  - `useCameraStore` 상태에 따른 ExitPanel/RunningPanel 조건부 렌더링
  - 레거시 원본: `src/renderer/src/features/dashboard/ui/MiniRunningPanel.tsx`

- [x] T024 [US2] LeftPanelArea에 좌측 6개 패널 조합 — `migration/src/features/dashboard/ui/LeftPanelArea.tsx`
  - AveragePosturePanel → AttendancePanel → TotalDistancePanel → AverageGraphPanel → HighlightsPanel → PosePatternPanel 순서로 배치
  - Phase 3의 자리표시자를 실제 패널로 교체
  - 레거시와 동일한 그룹 구조와 간격 적용

- [x] T025 [US2] RightPanelArea에 우측 2개 패널 조합 — `migration/src/features/dashboard/ui/RightPanelArea.tsx`
  - WebcamPanel → MiniRunningPanel 순서로 배치
  - Phase 3의 자리표시자를 실제 패널로 교체
  - 레거시와 동일한 구분선 구조 적용

**Checkpoint**: `/main`에서 8개 패널이 레거시와 동일한 순서, 그룹 구조, 카드 외형으로 표시되는지 확인

---

## Phase 5: User Story 3 - 메인 페이지의 상호작용을 이어서 사용한다 (Priority: P2)

**Goal**: 알림 모달 열기, 웹캠 표시 상태 변경, 보호 화면 접근 제어 등 메인 페이지의 기본 상호작용을 복원한다.

**Independent Test**: 메인 헤더 알림 버튼 → 모달 열림/닫힘, 웹캠 토글 → 상태 변화, 미인증 → 인증 흐름 복귀 확인

### Tests for User Story 3

- [x] T026 [P] [US3] 카메라 스토어 상태 전환 단위 테스트 — `migration/src/features/main-panels/model/__tests__/use-camera-store.test.ts`
  - 상태 전환: exit → show → hide → show → exit
  - toggleCamera, toggleWidget 동작 검증
  - localStorage persist 동작 검증

### Implementation for User Story 3

- [x] T027 [US3] DashboardHeader에 알림 모달 연결 — `migration/src/features/layout/ui/DashboardHeader.tsx`
  - 기존 `useModal` 훅으로 알림 버튼 클릭 시 `NotificationModal` 열기/닫기
  - 모달이 열려 있을 때 배경 레이아웃 유지 확인

- [x] T028 [US3] WebcamPanel에 카메라 토글 상호작용 연결 — `migration/src/features/main-panels/ui/WebcamPanel.tsx`
  - `useCameraStore` 기반 보이기/숨기기 토글 동작
  - 상태 변화에 따른 패널 UI 업데이트 (show → 비디오 영역, hide → 숨김 상태, exit → 종료 상태)
  - 세션 뮤테이션 진입점 연결 (시작 → create, 정지 → stop, 일시정지 → pause, 재개 → resume)

- [x] T029 [US3] MiniRunningPanel에 카메라 상태 반영 — `migration/src/features/main-panels/ui/MiniRunningPanel.tsx`
  - `useCameraStore` 상태 변화에 따라 ExitPanel ↔ RunningPanel 전환
  - 전환 애니메이션 레거시와 동일하게 적용

- [x] T030 [US3] 메인 페이지 보호 라우트 점검 — `migration/src/shared/config/router.tsx`
  - ProtectedRoute가 `/main` 경로에 정상 적용되어 있는지 확인
  - 미인증 상태에서 `/main` 접근 시 로그인 페이지로 리다이렉트 확인

**Checkpoint**: 알림 모달, 웹캠 토글, 보호 라우트가 레거시와 동일하게 동작하는지 확인

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 전체 품질 검증 및 시각 비교

- [x] T031 [P] 메인 페이지 레이아웃 조합 단위 테스트 — `migration/src/features/dashboard/ui/__tests__/MainContent.test.tsx`
  - 2열 그리드 렌더링, 좌/우 패널 영역 존재 여부, 독립 스크롤 속성 검증

- [ ] T032 레거시와 마이그레이션 메인 페이지 시각 비교 검증
  - 레거시 앱과 마이그레이션 앱을 나란히 실행
  - 패널 배치 순서, 그룹 구조, 간격, 색상, 둥근 모서리 일치 확인
  - before/after 스크린샷 캡처

- [x] T033 lint, typecheck, 빌드 통합 검증
  - `bun run lint` — Biome 린트 통과 (이번 브랜치 파일 모두 통과, 기존 코드 12개 a11y 경고는 별도 이슈)
  - `bun run typecheck` — TypeScript 타입 체크 통과 ✅
  - `bun run build` — 프로덕션 빌드 성공 ✅ (275 modules, 2.25s)
  - 자동 수정: import 정렬 30개 파일, 포맷팅 수정
  - 아이콘 a11y: `ui-icons.tsx` 10개, `nav-icons.tsx` 4개 SVG에 `role="img"` + `aria-label` 추가

- [ ] T034 quickstart.md 검증 시나리오 실행
  - quickstart.md에 기재된 검증 방법을 순서대로 실행하여 모두 통과 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Phase 1 완료 후 시작
- **User Story 1 (Phase 3)**: Phase 2 완료 후 시작 — 레이아웃 MVP
- **User Story 2 (Phase 4)**: Phase 3 완료 후 시작 (패널 자리표시자를 실제 패널로 교체)
- **User Story 3 (Phase 5)**: Phase 4 완료 후 시작 (패널에 상호작용 추가)
- **Polish (Phase 6)**: Phase 5 완료 후 시작

### User Story Dependencies

- **User Story 1 (P1)**: Phase 2 이후 독립 시작 가능 — 레이아웃 뼈대
- **User Story 2 (P1)**: User Story 1 완료 후 (자리표시자 → 실제 패널 교체)
- **User Story 3 (P2)**: User Story 2 완료 후 (패널에 상호작용 추가)

### Cross-Phase File Dependencies

다음 파일은 여러 Phase에서 수정되므로 순차 실행 필수:

| 파일 | Phase 3 (US1) | Phase 5 (US3) | 설명 |
|------|---------------|---------------|------|
| `features/layout/ui/DashboardHeader.tsx` | T009 (스타일 적용) | T027 (알림 모달 연결) | T027은 T009 완료 후 실행 |
| `features/main-panels/ui/WebcamPanel.tsx` | T022 (기본 UI) | T028 (상호작용 추가) | T028은 T022 완료 후 실행 |
| `features/main-panels/ui/MiniRunningPanel.tsx` | T023 (조건부 렌더링) | T029 (상태 반영 애니메이션) | T029는 T023 완료 후 실행 |

### Within Each User Story

- 공통 타입/스타일 → 스토어/쿼리 → UI 컴포넌트 → 페이지 조합
- [P] 마크된 태스크는 병렬 실행 가능 (서로 다른 파일, 의존성 없음)

### Parallel Opportunities

- **Phase 1**: T002, T003 병렬 가능
- **Phase 2**: T005, T007, T008 병렬 가능 (T004 선행 필요)
- **Phase 4**: T016~T023 모두 병렬 가능 (서로 다른 패널 파일)
- **Phase 5**: T026 테스트 병렬 가능
- **Phase 6**: T031, T033 병렬 가능

---

## Parallel Example: User Story 2 (패널 구현)

```bash
# 8개 패널 컴포넌트를 모두 병렬로 구현:
Task T016: "AveragePosturePanel — migration/src/features/main-panels/ui/AveragePosturePanel.tsx"
Task T017: "AttendancePanel — migration/src/features/main-panels/ui/AttendancePanel.tsx"
Task T018: "TotalDistancePanel — migration/src/features/main-panels/ui/TotalDistancePanel.tsx"
Task T019: "AverageGraphPanel — migration/src/features/main-panels/ui/AverageGraphPanel.tsx"
Task T020: "HighlightsPanel — migration/src/features/main-panels/ui/HighlightsPanel.tsx"
Task T021: "PosePatternPanel — migration/src/features/main-panels/ui/PosePatternPanel.tsx"
Task T022: "WebcamPanel — migration/src/features/main-panels/ui/WebcamPanel.tsx"
Task T023: "MiniRunningPanel — migration/src/features/main-panels/ui/MiniRunningPanel.tsx"

# 모든 패널 완료 후:
Task T024: "LeftPanelArea에 좌측 6개 패널 조합"
Task T025: "RightPanelArea에 우측 2개 패널 조합"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001~T003)
2. Complete Phase 2: Foundational (T004~T008)
3. Complete Phase 3: User Story 1 (T009~T015)
4. **STOP and VALIDATE**: `/main`에서 레이아웃 뼈대가 레거시와 동일한지 확인
5. 시각 비교 후 다음 단계 진행

### Incremental Delivery

1. Setup + Foundational → 데이터 계층 준비 완료
2. Add User Story 1 → 레이아웃 뼈대 확인 (빈 패널) → MVP!
3. Add User Story 2 → 8개 패널 채움 → 시각 검증
4. Add User Story 3 → 상호작용 추가 → 동작 검증
5. Polish → 최종 품질 게이트 통과

### Parallel Team Strategy

단일 개발자 환경이므로 순차 진행:
1. Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
2. Phase 4에서 8개 패널을 에이전트 병렬로 구현 가능

---

## Notes

- [P] 태스크 = 서로 다른 파일, 의존성 없음
- [Story] 라벨 = 해당 사용자 스토리에 속한 태스크
- 모든 패널은 레거시의 `rounded-3xl bg-grey-0` 컨테이너 스타일 사용
- 레거시 원본 파일 경로를 각 태스크에 명시하여 추적 가능
- 각 체크포인트에서 레거시와의 시각 비교 수행
- UI 스타일은 절대 임의로 변경하지 않음 (Constitution 원칙 2)
