# Feature Specification: 공통 UI 컴포넌트 시스템

**Feature Branch**: `004-shared-ui-components`
**Created**: 2026-04-14
**Status**: Draft
**Input**: 공통 UI 컴포넌트 시스템 구현. 레거시 앱(src/)의 공통 컴포넌트들을 마이그레이션 프로젝트(migration/)로 포팅. 모든 페이지에서 재사용되는 기본 UI 컴포넌트를 shared/ui 레이어에 구현.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 텍스트 표시 일관성 확보 (Priority: P1)

개발자가 어떤 페이지에서든 동일한 타이포그래피 스타일을 사용하여 텍스트를 표시할 수 있다. 현재 로그인, 회원가입 등 인증 페이지와 향후 구현될 대시보드, 온보딩 페이지 모두에서 title, headline, body, caption의 4가지 카테고리 18가지 변형을 일관되게 적용할 수 있다.

**Why this priority**: 타이포그래피는 모든 UI 컴포넌트의 기반이 되며, 앱 전체의 시각적 일관성에 가장 큰 영향을 미친다. 다른 컴포넌트(Button 크기 등)도 타이포그래피 토큰에 의존한다.

**Independent Test**: Typography 컴포넌트 하나만 렌더링하여 18가지 변형이 레거시 앱과 동일한 폰트 크기, 굵기, 줄 간격을 출력하는지 시각적으로 비교 확인.

**Acceptance Scenarios**:

1. **Given** 개발자가 Typography 컴포넌트를 사용할 때, **When** variant 속성을 'title-4xl-bold'로 설정하면, **Then** 32px/700 굵기의 텍스트가 렌더링된다.
2. **Given** 개발자가 'as' 속성을 'h1'으로 설정하면, **When** 렌더링 시, **Then** 해당 시맨틱 HTML 태그로 출력되어 접근성 기준을 충족한다.
3. **Given** 라이트/다크 모드 전환 시, **When** Typography 컴포넌트가 표시되면, **Then** 테마에 맞는 텍스트 색상이 적용된다.

---

### User Story 2 - 로딩 상태 피드백 제공 (Priority: P1)

사용자가 데이터 로딩, API 요청 등 대기 상태에서 회전하는 스피너를 통해 시스템이 작동 중임을 시각적으로 인지할 수 있다. 인증 페이지의 폼 제출, 향후 대시보드의 데이터 로딩 등 모든 대기 상태에서 동일한 로딩 인디케이터가 표시된다.

**Why this priority**: 로딩 피드백은 사용자 경험의 핵심이며, 인증 API 호출 시 이미 필요한 상태이다. 현재 로딩 상태 표시가 없어 사용자가 중복 클릭하는 문제가 발생할 수 있다.

**Independent Test**: LoadingSpinner 컴포넌트를 단독 렌더링하여 레거시 앱의 스피너와 동일한 크기, 색상, 애니메이션이 재현되는지 확인.

**Acceptance Scenarios**:

1. **Given** 페이지가 로딩 상태일 때, **When** LoadingSpinner가 렌더링되면, **Then** 중앙에 회전 애니메이션이 표시된다.
2. **Given** 개발자가 크기를 지정하면, **When** size 속성을 변경하면, **Then** 컨텍스트에 맞는 크기의 스피너가 표시된다.

---

### User Story 3 - 모달 대화상자 표시 (Priority: P2)

사용자가 설정 변경, 확인 대화상자, 알림 등의 모달을 통해 인터랙션할 수 있다. 대시보드의 설정 모달, 세션 종료 확인, 알림 설정 등 다양한 컨텍스트에서 재사용된다.

**Why this priority**: 모달은 대시보드 설정, 알림 설정, 세션 종료 확인 등 여러 페이지에서 사용되지만, P1 컴포넌트에 의존하지 않는 독립 기능이다. 향후 대시보드 구현 시 필수적이다.

**Independent Test**: 모달을 열고 닫는 최소한의 인터랙션으로 오버레이 배경, 콘텐츠 영역, 닫기 동작이 레거시와 동일하게 동작하는지 확인.

**Acceptance Scenarios**:

1. **Given** 모달이 열리면, **When** 오버레이가 표시되면, **Then** 배경이 반투명하게 어두워지고 콘텐츠가 중앙에 위치한다.
2. **Given** 모달이 열린 상태에서, **When** 사용자가 오버레이 영역을 클릭하거나 ESC 키를 누르면, **Then** 모달이 닫힌다.
3. **Given** 모달이 열린 상태에서, **When** 사용자가 스크롤을 시도하면, **Then** 배경 페이지는 스크롤되지 않는다.

---

### User Story 4 - 토글 스위치로 상태 전환 (Priority: P2)

사용자가 토글 스위치를 통해 ON/OFF 상태를 전환할 수 있다. 알림 설정, 테마 전환 등 다양한 설정 항목에서 사용된다. 일반 토글과 알림용 토글(레이블 포함) 두 가지 변형이 있다.

**Why this priority**: 설정 페이지와 대시보드의 알림 설정에서 필수적으로 사용되며, P1 컴포넌트와 독립적으로 구현 가능하다.

**Independent Test**: 토글을 클릭하여 ON/OFF 상태 전환, 레이블 표시, 비활성화 상태가 레거시와 동일하게 동작하는지 확인.

**Acceptance Scenarios**:

1. **Given** 토글이 OFF 상태일 때, **When** 사용자가 토글을 클릭하면, **Then** ON 상태로 전환되며 onChange 콜백이 호출된다.
2. **Given** 알림 토글 변형에서, **When** 렌더링되면, **Then** uncheckedLabel과 checkedLabel이 상태에 따라 표시된다.
3. **Given** 토글이 비활성화 상태일 때, **When** 사용자가 클릭을 시도하면, **Then** 상태가 변경되지 않는다.

---

### User Story 5 - 카운트다운 시각 표시 (Priority: P3)

사용자가 카운트다운 진행 상태를 SVG 세그먼트로 시각적으로 확인할 수 있다. value 0-5의 카운트다운 값을 5개 세그먼트가 순차적으로 켜지는 형태로 표시하며, 세션 타이머, 측정 카운트다운 등에서 활용된다.

**Why this priority**: 특정 도메인(세션, 측정)에서 사용되지만 독립적으로 구현 가능하다.

**Independent Test**: Timer에 value 0-5를 전달하여 활성 세그먼트 패턴이 레거시와 일치하는지 확인.

**Acceptance Scenarios**:

1. **Given** Timer에 value 5가 전달되면, **When** 렌더링되면, **Then** 활성 세그먼트가 없는 상태로 표시된다.
2. **Given** Timer에 value 0이 전달되면, **When** 렌더링되면, **Then** 5개 세그먼트가 모두 활성화되어 표시된다.
3. **Given** Timer에 size prop이 전달되면, **When** size=64로 설정하면, **Then** 64x64px SVG가 렌더링된다.

---

### User Story 6 - 패널 헤더로 섹션 구분 (Priority: P3)

개발자가 대시보드 패널, 설정 섹션 등에서 제목과 부가 정보를 표시하는 헤더를 일관되게 구성할 수 있다. 대시보드의 출석 패널, 평균 그래프 패널, 레벨 진행 패널 등 모든 패널의 상단에 사용된다.

**Why this priority**: 대시보드 구현 시 다수의 패널에서 반복 사용되지만, 대시보드 스펙 이전까지는 사용되지 않는다.

**Independent Test**: PanelHeader에 제목과 부가 요소를 전달하여 레거시 패널 헤더와 동일한 레이아웃이 출력되는지 확인.

**Acceptance Scenarios**:

1. **Given** PanelHeader에 제목이 전달되면, **When** 렌더링되면, **Then** 좌측에 제목 텍스트가 표시된다.
2. **Given** 우측 영역에 추가 요소가 전달되면, **When** 렌더링되면, **Then** 제목과 함께 우측 정렬로 표시된다.

---

### User Story 7 - 알림 메시지 표시 (Priority: P3)

사용자가 단계별 안내, 완료 확인 등의 메시지를 명확하게 인지할 수 있다. 자세 측정 중 단계 안내, 설정 변경 확인 등의 컨텍스트에서 default(단계 번호)와 success(완료)의 2가지 유형으로 메시지가 표시된다.

**Why this priority**: 자세 측정 세션과 알림 시스템에서 사용되지만, P1/P2 컴포넌트 이후에 구현해도 무방하다.

**Independent Test**: 각 메시지 유형별로 아이콘, 색상, 텍스트가 레거시와 동일하게 표시되는지 확인.

**Acceptance Scenarios**:

1. **Given** 알림 메시지가 표시될 때, **When** variant가 'default'이면, **Then** 단계 번호와 함께 기본 스타일로 표시되고 에러 메시지가 하단에 나타날 수 있다.
2. **Given** 알림 메시지가 표시될 때, **When** variant가 'success'이면, **Then** 성공 아이콘과 함께 노란색 테두리 스타일로 표시된다.

---

### Edge Cases

- Typography에 매우 긴 텍스트가 전달될 때 줄바꿈이 올바르게 처리되는가?
- Modal이 중첩으로 열릴 때 스크롤 락과 z-index가 올바르게 관리되는가?
- Timer 컴포넌트에 0-5 외의 값이 전달되지 않도록 TypeScript 타입으로 보장되는가?
- ToggleSwitch가 빠르게 연속 클릭될 때 상태가 일관되게 유지되는가?
- 로딩 스피너의 애니메이션이 모션 감소 설정(prefers-reduced-motion)을 존중하는가?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 시스템은 title, headline, body, caption 카테고리의 20가지 텍스트 변형을 제공해야 한다.
- **FR-002**: 시스템은 레거시 앱과 동일한 폰트 크기, 굵기, 줄 간격을 유지해야 한다.
- **FR-003**: 모든 텍스트는 시맨틱 HTML 태그 선택(as 속성)을 지원하여 접근성을 충족해야 한다.
- **FR-004**: 시스템은 회전 애니메이션 로딩 스피너를 제공해야 한다.
- **FR-005**: 로딩 스피너는 크기 조절이 가능해야 한다.
- **FR-006**: 시스템은 오버레이 기반 모달 대화상자를 제공해야 한다.
- **FR-007**: 모달은 ESC 키 및 오버레이 클릭으로 닫기를 지원해야 한다.
- **FR-008**: 모달 오픈 시 배경 스크롤이 잠겨야 한다.
- **FR-009**: 시스템은 ON/OFF 상태 전환 토글 스위치를 제공해야 한다.
- **FR-010**: 토글 스위치는 상태별 레이블 표시를 지원하는 알림용 변형이 있어야 한다.
- **FR-011**: 시스템은 value 0-5 값을 SVG 세그먼트로 시각 표시하는 카운트다운 표시 컴포넌트를 제공해야 한다.
- **FR-013**: 시스템은 패널 제목과 우측 부가 영역을 포함하는 패널 헤더를 제공해야 한다.
- **FR-014**: 시스템은 default, success의 2가지 유형 알림 메시지를 제공해야 한다.
- **FR-015**: 기존에 마이그레이션된 Button, TextField 컴포넌트의 스타일이 레거시와 일치하는지 검증해야 한다.
- **FR-016**: 모든 컴포넌트는 라이트/다크 테마를 지원해야 한다.
- **FR-017**: 기존 Button, TextField 컴포넌트와 새로 추가되는 컴포넌트 간 스타일 유틸리티(cn 함수 등)가 일관되어야 한다.

### Key Entities

- **TypographyVariant**: title-4xl-bold, headline-3xl-regular 등 18가지 텍스트 스타일 변형. 카테고리(title/headline/body/caption), 크기, 굵기로 구성.
- **NotificationType**: default, success의 2가지 알림 메시지 유형. default는 단계 번호, success는 체크 아이콘 표시.
- **ButtonVariant**: primary, sub, grey의 3가지 버튼 스타일 (기존 구현 검증 범위).
- **ToggleState**: ON/OFF 이진 상태와 checkedLabel/uncheckedLabel 속성.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 마이그레이션된 컴포넌트가 레거시 앱과 픽셀 단위로 동일한 시각적 출력을 생성한다 (스크린샷 비교 기준).
- **SC-002**: 각 컴포넌트가 독립적으로 import되어 다른 컴포넌트 없이도 정상 렌더링된다.
- **SC-003**: 9개 마이그레이션 대상 컴포넌트(7 신규 + 2 기존) 중 7개 이상이 이 스펙에서 포팅 완료된다.
- **SC-004**: 모든 컴포넌트가 기존 Button, TextField와 일관된 스타일 유틸리티를 공유한다.

## Assumptions

- 레거시 앱의 CSS 변수 기반 색상 시스템(colors.css)과 타이포그래피 토큰(typography.css)은 001-migration-scaffold에서 이미 마이그레이션되었다.
- Tailwind CSS v4의 테마 시스템을 통해 레거시의 CSS 변수가 이미 구성되어 있다.
- 레거시의 Class Variance Authority(CVA) 의존성은 Tailwind 유틸리티 클래스 직접 매핑으로 대체한다 (기존 Button 구현 방식과 동일).
- 공통 유틸리티(cn 함수)는 shared/lib에 이미 존재하거나 이 스펙에서 통합 생성한다.
- IntensitySlider, ThemeToggleSwitch, PageMoveButton은 특정 도메인(측정, 설정, 네비게이션)에 종속적이므로 이 스펙 범위에서 제외한다. 해당 도메인 스펙에서 함께 다룬다.
