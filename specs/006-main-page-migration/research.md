# Research: 메인 페이지 이관

**Feature**: 006-main-page-migration
**Date**: 2026-04-14
**Status**: Complete

## R1: 메인 페이지 레이아웃 구조 이관 방식

**Decision**: 레거시의 CSS Grid 2열 레이아웃을 Tailwind CSS 클래스로 직접 변환하여 이관한다.

**Rationale**:
- 레거시는 `grid-cols-[1fr_minmax(336px,400px)]` 구조를 사용한다.
- 마이그레이션 앱은 이미 Tailwind CSS 4.2.2를 사용하므로 동일한 방식으로 재현 가능하다.
- `@container` 기반 반응형 브레이크포인트도 기존 `breakpoint.css`에 정의된 규칙을 그대로 활용할 수 있다.

**Alternatives considered**:
- CSS Flexbox: 레거시가 Grid를 사용하므로 충실도 측면에서 부적합
- 별도 CSS 모듈: Tailwind 유틸리티로 충분히 재현 가능하여 불필요

## R2: 독립 스크롤 구현 방식

**Decision**: 각 컬럼(좌/우)에 `overflow-y-auto`와 `custom-scrollbar` CSS 클래스를 적용하여 독립 스크롤을 구현한다.

**Rationale**:
- 레거시는 `overscroll-y-contain`과 커스텀 스크롤바(`custom-scrollbar` 클래스)를 사용한다.
- 커스텀 스크롤바 스타일은 `shared/styles/scrollbar.css`에 신규 추가한다.
- WebKit과 Firefox 모두 지원하는 CSS를 사용한다.

**Alternatives considered**:
- 가상 스크롤 라이브러리(virtual-scroller): 이번 범위의 콘텐츠 양에는 오버엔지니어링
- 전역 스크롤: 레거시와 다른 동작이므로 부적합

## R3: 패널 컴포넌트 아키텍처

**Decision**: 각 패널을 `features/main-panels/ui/`에 독립 컴포넌트로 배치하고, 페이지 조합은 `features/dashboard/ui/`에서 담당한다.

**Rationale**:
- 레거시의 각 패널(AveragePosturePanel, AttendancePanel 등)은 독립적인 컴포넌트로 분리되어 있다.
- FSD 아키텍처에서 features 레이어에 배치하는 것이 기존 패턴과 일치한다.
- 패널 내부 로직(쿼리, 상태)은 model/에, UI는 ui/에 분리하는 기존 컨벤션을 따른다.

**Alternatives considered**:
- `features/dashboard/` 내부에 모든 패널 배치: dashboard 기능이 과도하게 비대해짐
- `shared/ui/`에 배치: 패널은 도메인 특화이므로 shared에 부적합

## R4: 대시보드 데이터 페칭 전략

**Decision**: TanStack Query 훅을 `entities/dashboard/model/`에 정의하고, 각 패널에서는 해당 훅만 호출한다. 이번 범위에서는 실데이터 대신 Mock/Placeholder 데이터를 사용할 수도 있다.

**Rationale**:
- 레거시는 커스텀 훅(`useAverageScoreQuery`, `useAttendanceQuery` 등)으로 데이터를 페칭한다.
- 마이그레이션 앱도 TanStack Query 5를 사용하므로 동일한 패턴 적용 가능하다.
- spec FR-012에 따라 복잡한 데이터 연동은 후속 단계이므로, 이번에는 쿼리 훅 구조와 로딩/에러 상태까지만 구현한다.

**Alternatives considered**:
- SWR: 프로젝트에서 이미 TanStack Query를 사용하므로 추가 의존성 불필요
- 로컬 상태로 관리: 서버 상태는 TanStack Query가 적합

## R5: 알림 모달 재사용 방식

**Decision**: 기존 `features/notification-settings/ui/NotificationModal.tsx`를 그대로 재사용한다.

**Rationale**:
- 마이그레이션 앱에 이미 이관된 알림 설정 모달이 존재한다.
- spec Assumption에 따라 "알림 설정 모달은 이미 이관된 모달 컴포넌트를 재사용"한다.
- 추가 작업 없이 `DashboardHeader`의 알림 버튼 클릭 시 기존 모달을 열면 된다.

**Alternatives considered**:
- 신규 작성: 이미 이관된 컴포넌트가 있으므로 비효율적

## R6: 웹캠 상태 관리 방식

**Decision**: `useCameraStore`를 Zustand persist 스토어로 `features/main-panels/model/`에 신규 생성한다.

**Rationale**:
- 레거시는 `useCameraStore`에서 카메라 상태('show', 'hide', 'exit')를 관리하고 localStorage에 persist한다.
- Zustand persist는 기존 마이그레이션 앱에서도 사용하는 패턴이다.
- 카메라 상태는 웹캠 패널과 러닝 패널 모두에서 사용되므로 스토어로 공유하는 것이 적합하다.

**Alternatives considered**:
- React Context: 여러 컴포넌트에서 구독하는 상태에는 Zustand가 더 적합
- URL 상태: 카메라 상태는 URL에 노출할 필요 없는 UI 상태

## R7: 메인 페이지 상호작용 범위

**Decision**: 이번 범위에서는 다음 상호작용만 구현한다:
1. 알림 모달 열기/닫기 (기존 컴포넌트 재사용)
2. 웹캠 표시 상태 토글 (카메라 스토어 활용)
3. 보호 라우트 인증 가드 (기존 ProtectedRoute 재사용)

**Rationale**:
- spec FR-016/FR-017에 따라 위젯 창 제어, 세션 종료, 메트릭 전송 보장은 후속 단계이다.
- spec FR-015에 따라 마지막 갱신 문구는 레거시 표시값을 그대로 유지한다.
- 기본 상호작용만으로 메인 페이지의 동적인 느낌을 충분히 재현할 수 있다.

**Alternatives considered**:
- 전체 상호작용 이관: spec에서 명시적으로 후속 단계로 분리됨

## R8: 디자인 토큰 이관 전략

**Decision**: 레거시의 색상, 타이포그래피, 간격 값을 기존 `shared/styles/`의 CSS 커스텀 프로퍼티로 매핑한다. 부족한 값은 신규 추가한다.

**Rationale**:
- 마이그레이션 앱의 `colors.css`는 이미 레거시 색상 체계를 기반으로 구축되어 있다.
- `typography.css`도 유사한 체계를 가지고 있다.
- 패널에 사용되는 특수 그라데이션, 그림자 등은 필요시 추가한다.

**Alternatives considered**:
- Tailwind 직접 사용: CSS 커스텀 프로퍼티 기반이 유지보수에 유리
- styled-components: 프로젝트에서 사용하지 않는 방식

## R9: 세션/미터크 관련 로직 범위

**Decision**: 이번 범위에서는 세션 뮤테이션 훅의 타입과 시그니처만 정의하고, 실제 API 호출 구현은 후속 단계로 둔다.

**Rationale**:
- spec FR-014에 따라 복잡한 분석 로직은 이번 범위에서 제외한다.
- 세션 생성/중지/일시정지/재개 뮤테이션은 웹캠 패널의 버튼에 연결되지만, 이번에는 UI 진입점만 구현한다.
- TanStack Query 뮤테이션 훅 구조를 미리 정의해두면 후속 이관이 수월해진다.

**Alternatives considered**:
- 전체 로직 이관: spec에서 명시적으로 후속 단계로 분리됨
- 아예 미정의: 후속 작업 시 구조 재설계 비용 발생
