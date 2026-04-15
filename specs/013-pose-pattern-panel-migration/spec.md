# Feature Specification: PosePatternPanel 정적 패널 이관

**Feature Branch**: `013-pose-pattern-panel-migration`
**Created**: 2026-04-15
**Status**: Draft
**Input**: User description: "PosePatternPanel 이거 ui 레거시에서 마이그레이션으로 완전 스타일 똑같이 이관해줘"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 자세 패턴 분석 패널 표시 (Priority: P1)

사용자가 메인 대시보드에서 자세 패턴 분석 패널을 볼 수 있다. 패널에는 안좋은 시간, 안좋은 요일, 회복까지 평균 시간, 추천 스트레칭 4가지 카드가 2x2 그리드로 표시되며, 상단에 TIP 영역이 포함되어 있다.

**Why this priority**: 이 패널의 핵심 가치는 사용자에게 자세 패턴 인사이트를 제공하는 것이며, 전체 UI가 레거시와 동일하게 표시되는 것이 가장 중요하다.

**Independent Test**: 마이그레이션된 패널을 렌더링하고 레거시 패널과 나란히 비교하여 모든 시각적 요소가 동일한지 확인한다.

**Acceptance Scenarios**:

1. **Given** 사용자가 메인 대시보드에 진입함, **When** 자세 패턴 분석 패널이 렌더링됨, **Then** 패널 헤더에 "자세 패턴 분석" 텍스트가 표시됨
2. **Given** 패널이 렌더링됨, **When** API 데이터가 정상적으로 수신됨, **Then** 4개의 패턴 카드(안좋은 시간, 안좋은 요일, 회복까지 평균, 추천 스트레칭)가 2x2 그리드로 표시됨
3. **Given** 패널이 렌더링됨, **When** TIP 영역이 표시됨, **Then** "{worstDay} {worstTime}에 자세가 급격히 나빠져요! 이 시간대에 맞춰 스트레칭 알림을 설정해드릴까요?" 메시지가 표시됨

---

### User Story 2 - API 데이터 없을 때 기본값 표시 (Priority: P2)

API 서버에서 자세 패턴 데이터를 받지 못한 경우에도 패널이 깨지지 않고 기본값으로 표시된다. 안좋은 시간은 "오후 2시", 안좋은 요일은 "수요일", 회복 평균은 "18분", 추천 스트레칭은 "목돌리기"가 기본값이다.

**Why this priority**: 빈 데이터 상태에서도 패널이 정상적으로 보여야 사용자 경험이 저하되지 않는다.

**Independent Test**: API 응답을 null/undefined로 설정하고 패널이 기본값으로 정상 렌더링되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** API 데이터가 null임, **When** 패널이 렌더링됨, **Then** 안좋은 시간에 "오후 2시"가 표시됨
2. **Given** API 데이터가 null임, **When** 패널이 렌더링됨, **Then** 안좋은 요일에 "수요일"이 표시됨
3. **Given** API 데이터가 null임, **When** 패널이 렌더링됨, **Then** 회복 평균에 "18분"이 표시됨
4. **Given** API 데이터가 null임, **When** 패널이 렌더링됨, **Then** 추천 스트레칭에 "목돌리기"가 표시됨

---

### User Story 3 - 시간 및 요일 포맷 변환 (Priority: P3)

API에서 받은 raw 데이터를 사용자 친화적인 형식으로 변환하여 표시한다. 시간은 "14:00:00" → "오후 2시"로, 요일은 "FRIDAY" → "금요일"로 변환된다.

**Why this priority**: 데이터 포맷 변환은 사용자에게 의미 있는 정보를 전달하기 위한 필수 기능이다.

**Independent Test**: 다양한 시간/요일 데이터를 입력하여 변환 결과가 올바른지 확인한다.

**Acceptance Scenarios**:

1. **Given** worstTime이 "09:00:00"임, **When** 시간 포맷 변환이 적용됨, **Then** "오전 9시"로 표시됨
2. **Given** worstTime이 "14:00:00"임, **When** 시간 포맷 변환이 적용됨, **Then** "오후 2시"로 표시됨
3. **Given** worstTime이 "00:00:00"임, **When** 시간 포맷 변환이 적용됨, **Then** "오전 12시"로 표시됨
4. **Given** worstDay가 "MONDAY"임, **When** 요일 포맷 변환이 적용됨, **Then** "월요일"로 표시됨
5. **Given** worstDay가 "SUNDAY"임, **When** 요일 포맷 변환이 적용됨, **Then** "일요일"로 표시됨

---

### Edge Cases

- worstTime이 "12:00:00"인 경우 "오후 12시"로 올바르게 표시되는가?
- worstTime이 "00:00:00"인 경우 "오전 12시"로 올바르게 표시되는가?
- API 데이터가 부분적으로만 존재하는 경우 (worstTime만 있고 worstDay가 없는 경우) 각 항목별로 기본값이 올바르게 적용되는가?
- recovery 값이 0인 경우 "0분"으로 표시되는가?
- stretching 값이 빈 문자열인 경우 기본값 "목돌리기"가 표시되는가?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 패널은 레거시 PosePatternPanel과 완전히 동일한 시각적 스타일로 렌더링되어야 한다 (픽셀 퍼펙트)
- **FR-002**: 패널 상단에 "자세 패턴 분석" 헤더가 표시되어야 한다
- **FR-003**: TIP 영역이 노란색(yellow-400) 텍스트로 "TIP" 레이블과 오른쪽 화살표 아이콘과 함께 표시되어야 한다
- **FR-004**: TIP 영역 아래에 "{worstDay} {worstTime}에 자세가 급격히 나빠져요! 이 시간대에 맞춰 스트레칭 알림을 설정해드릴까요?" 메시지가 표시되어야 한다
- **FR-005**: 4개의 패턴 카드가 2x2 그리드(grid-cols-2)로 배치되어야 한다
- **FR-006**: 각 패턴 카드에는 아이콘(회색 배경 원형 래퍼 포함)과 타이틀이 상단에, 값이 하단에 표시되어야 한다
- **FR-007**: "안좋은 시간" 카드는 시계 아이콘과 포맷된 시간을 표시해야 한다
- **FR-008**: "안좋은 요일" 카드는 캘린더 아이콘과 포맷된 요일을 표시해야 한다
- **FR-009**: "회복까지 평균" 카드는 모래시계 아이콘과 "{N}분" 형식의 값을 표시해야 한다
- **FR-010**: "추천 스트레칭" 카드는 엄지척 아이콘과 스트레칭 이름을 표시해야 한다
- **FR-011**: 시간 데이터는 "HH:MM:SS" → "오전/오후 N시" 형식으로 변환되어야 한다
- **FR-012**: 요일 데이터는 영어 대문자(예: "FRIDAY") → 한국어 요일(예: "금요일")로 변환되어야 한다
- **FR-013**: API 데이터가 없을 경우 기본값(worstTime: "오후 2시", worstDay: "수요일", recovery: 18, stretching: "목돌리기")이 표시되어야 한다

### Key Entities

- **PosePatternData**: 자세 패턴 분석 결과 데이터
  - worstTime: string (예: "14:00:00") - 자세가 가장 안좋은 시간
  - worstDay: string (예: "FRIDAY") - 자세가 가장 안좋은 요일
  - recovery: number (예: 18) - 자세 회복까지 평균 소요 시간(분)
  - stretching: string (예: "목돌리기") - 추천 스트레칭 이름

- **PatternCard**: 4개의 패턴 카드 각각의 구조
  - icon: 해당 카드의 아이콘 (시계, 캘린더, 모래시계, 엄지척)
  - title: 카드 제목 (안좋은 시간, 안좋은 요일, 회복까지 평균, 추천 스트레칭)
  - value: 표시할 값

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 마이그레이션된 PosePatternPanel을 레거시 패널과 나란히 놓았을 때 시각적으로 구분할 수 없어야 한다
- **SC-002**: 모든 텍스트 스타일(폰트 크기, 굵기, 색상)이 레거시와 정확히 일치해야 한다
- **SC-003**: 모든 레이아웃 간격(gap, padding, margin)이 레거시와 정확히 일치해야 한다
- **SC-004**: 아이콘 스타일(색상, 크기, 배경 원형)이 레거시와 정확히 일치해야 한다
- **SC-005**: API 데이터가 없는 상태에서도 패널이 정상적으로 렌더링되어야 한다
- **SC-006**: 기존에 마이그레이션된 다른 패널(CharacterPanel, TrendPanel, AveragePosturePanel)과 동일한 코드 패턴과 구조를 따라야 한다

## Assumptions

- 기존 마이그레이션된 공유 UI 컴포넌트(PanelHeader, ui-icons)를 그대로 재사용한다
- usePosturePatternQuery 훅은 이미 마이그레이션되어 사용 가능하다
- 이 패널은 정적 UI 패널로, 새로운 상태 저장이나 라우팅이 필요하지 않다
- 레거시의 PatternHeader 컴포넌트(아이콘에 bg-grey-50 원형 배경 래퍼 포함)의 스타일이 마이그레이션 버전에도 동일하게 적용되어야 한다
- 기존 마이그레이션된 PosePatternPanel.tsx 파일이 이미 존재하며, 스타일을 레거시와 완전히 동일하게 맞추는 작업이 필요하다
