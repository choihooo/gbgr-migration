# Data Model: 메인 페이지 이관

**Feature**: 006-main-page-migration
**Date**: 2026-04-14

## Entities

### 1. MainPageLayout

메인 페이지의 전체 화면 구조를 표현하는 레이아웃 엔티티.

| Field | Type | Description |
|-------|------|-------------|
| header | DashboardHeader | 메인 전용 상단 헤더 |
| leftPanelArea | LeftPanelArea | 좌측 대시보드 스크롤 영역 |
| rightPanelArea | RightPanelArea | 우측 웹캠/러닝 스크롤 영역 |

**Relationships**: 1개 헤더 + 1개 좌측 영역 + 1개 우측 영역으로 구성

### 2. LeftPanelArea (좌측 대시보드 패널 집합)

| Panel | Component | Data Source | Description |
|-------|-----------|-------------|-------------|
| 평균 자세 점수 | AveragePosturePanel | `useAverageScoreQuery` | 자세 점수 + 레벨 + 캐릭터 이미지 |
| 출석 현황 | AttendancePanel | `useAttendanceQuery` | 월간 캘린더 + 활동 레벨 |
| 이동거리 | TotalDistancePanel | `useLevelQuery` | 레벨 진행바 + 거리 표시 |
| 평균 그래프 | AverageGraphPanel | `usePostureGraphQuery` | 시계열 그래프 + 주간/월간 토글 |
| 하이라이트 | HighlightsPanel | `useHighlightQuery` | 막대 그래프 + 주간/월간 토글 |
| 자세 패턴 | PosePatternPanel | `usePosturePatternQuery` | 2x2 그리드 메트릭 + TIP |

### 3. RightPanelArea (우측 웹캠/러닝 영역)

| Panel | Component | Data Source | Description |
|-------|-----------|-------------|-------------|
| 웹캠 | WebcamPanel | `useCameraStore`, 세션 뮤테이션 | 비디오 피드 + 컨트롤 버튼 |
| 러닝 요약 | MiniRunningPanel | `useCameraStore` | 상태에 따라 ExitPanel/RunningPanel 전환 |

### 4. CameraState (웹캠 상태)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| cameraState | `'show' \| 'hide' \| 'exit'` | `'exit'` | 현재 카메라 표시 상태 |
| widgetState | `'show' \| 'hide'` | `'hide'` | 위젯 윈도우 표시 상태 |

**Storage**: Zustand persist → localStorage

**State Transitions**:
```
'exit' → 'show' (세션 시작)
'show' → 'hide' (일시정지)
'hide' → 'show' (재개)
'show' → 'exit' (세션 종료)
'hide' → 'exit' (세션 종료)
```

### 5. MainPageInteractionState (메인 페이지 상호작용 상태)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| isNotificationModalOpen | boolean | false | 알림 설정 모달 열림 여부 |
| activeTab | NavigationTab | 'dashboard' | 현재 활성 탭 |

**Storage**: 컴포넌트 로컬 상태 (useModal, useNavigationTabs)

### 6. PanelDataEntities (패널 데이터)

#### AverageScoreData

| Field | Type | Description |
|-------|------|-------------|
| score | number | 평균 자세 점수 |
| level | number | 자세 레벨 (1-6) |
| tilt | string | 기울기 정보 |
| weight | string | 체중 분포 정보 |

#### AttendanceData

| Field | Type | Description |
|-------|------|-------------|
| year | number | 연도 |
| month | number | 월 |
| days | AttendanceDay[] | 일별 출석 데이터 |

#### AttendanceDay

| Field | Type | Description |
|-------|------|-------------|
| date | string | 날짜 (YYYY-MM-DD) |
| hours | number | 사용 시간 |
| level | number | 활동 레벨 (0-5) |

#### LevelData

| Field | Type | Description |
|-------|------|-------------|
| currentLevel | number | 현재 레벨 |
| totalDistance | number | 총 이동 거리 |
| nextLevelDistance | number | 다음 레벨所需 거리 |
| progress | number | 진행률 (0-100) |

#### PostureGraphData

| Field | Type | Description |
|-------|------|-------------|
| period | 'weekly' \| 'monthly' | 조회 기간 |
| dataPoints | GraphDataPoint[] | 그래프 데이터 포인트 |

#### HighlightData

| Field | Type | Description |
|-------|------|-------------|
| period | 'weekly' \| 'monthly' | 조회 기간 |
| currentBars | BarData[] | 현재 기간 막대 데이터 |
| previousBars | BarData[] | 이전 기간 막대 데이터 |

#### PosePatternData

| Field | Type | Description |
|-------|------|-------------|
| worstTime | string | 최악 자세 시간대 |
| worstDay | string | 최악 자세 요일 |
| recoveryTime | string | 회복 소요 시간 |
| stretchingTip | string | 스트레칭 팁 |

## Validation Rules

- 카메라 상태 전환은 정의된 transition만 허용
- 출석 캘린더의 월은 1-12 범위
- 자세 점수는 0-100 범위
- 자세 레벨은 1-6 범위
- 활동 레벨은 0-5 범위
- 이동거리, 진행률은 0 이상

## Scope Notes

- 이번 범위에서는 **패널 데이터 엔티티의 타입 정의와 쿼리 훅 구조**까지만 구현한다.
- 실데이터 API 연동, 실시간 계산, 그래프 렌더링 로직은 후속 단계에서 구현한다.
- 세션 뮤테이션(useCreateSession, useStopSession 등)은 타입 정의만 하고 UI 진입점만 연결한다.
