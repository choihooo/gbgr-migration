# 008 대시보드 패널 마이그레이션 분석

## 기준

이 문서는 레거시 메인 대시보드에서 실제로 렌더되는 패널만 기준으로 정리한다.
판단 기준은 `src/renderer/src/pages/main-page/index.tsx`의 실제 JSX 조립 순서다.

## 레거시 메인 대시보드 실제 렌더 패널

### 좌측 영역

| 순서 | 패널 | 역할 | 레거시 렌더 위치 |
|---|---|---|---|
| 1 | `AveragePosturePanel` | 평균 자세 점수 | `src/renderer/src/pages/main-page/index.tsx:269` |
| 2 | `AttendacePanel` | 출석 현황 | `src/renderer/src/pages/main-page/index.tsx:271` |
| 3 | `TotalDistancePanel` | 총 이동거리 및 레벨 진행 정보 | `src/renderer/src/pages/main-page/index.tsx:280` |
| 4 | `AverageGraphPannel` | 바른 자세 점수 그래프 | `src/renderer/src/pages/main-page/index.tsx:293` |
| 5 | `HighlightsPanel` | 하이라이트 | `src/renderer/src/pages/main-page/index.tsx:306` |
| 6 | `PosePatternPanel` | 자세 패턴 분석 | `src/renderer/src/pages/main-page/index.tsx:312` |

### 우측 영역

| 순서 | 패널 | 역할 | 레거시 렌더 위치 |
|---|---|---|---|
| 7 | `WebcamPanel` | 웹캠/세션 제어 패널 | `src/renderer/src/pages/main-page/index.tsx:323` |
| 8 | `MiniRunningPanel` | 우측 하단 상태 패널 | `src/renderer/src/pages/main-page/index.tsx:332` |

## `MiniRunningPanel` 분기 규칙

`MiniRunningPanel`은 단일 고정 UI가 아니라 `cameraState`에 따라 내부 패널이 바뀐다.

| 조건 | 실제 렌더 패널 | 근거 |
|---|---|---|
| 기본 상태 | `RunningPanel` | `src/renderer/src/features/dashboard/ui/MiniRunningPanel.tsx:9` |
| `cameraState === 'exit'` | `ExitPanel` | `src/renderer/src/features/dashboard/ui/MiniRunningPanel.tsx:7` |

정리하면, 메인 대시보드의 우측 하단 패널은 외형상 하나의 슬롯이지만
마이그레이션 단위로는 `MiniRunningPanel`, `RunningPanel`, `ExitPanel`을 함께 봐야 한다.

## 메인 대시보드에 실제로는 붙지 않는 패널

아래 컴포넌트는 레거시 `features/dashboard/ui`에 존재하지만,
현재 메인 대시보드 조립 코드에는 포함되지 않는다.

- `CharacterPanel`
- `TrendPanel`
- `LevelProgressPanel`

따라서 메인 대시보드 기준 패널 마이그레이션 범위에서는 우선순위를 낮게 둔다.

## 실제 렌더 패널 기준 마이그레이션 우선순위

영향 범위가 작은 순서와 공통 의존성을 기준으로 재정리한다.

### Tier 1 — 단일 조회 또는 정적 구조 중심

| 순서 | 패널 | 주요 의존성 | 외부 패키지 | 복잡도 |
|---|---|---|---|---|
| 1 | `AveragePosturePanel` | `useAverageScoreQuery` | 없음 | 중간 |
| 2 | `TotalDistancePanel` | `useLevelQuery`, `useModal` | 없음 | 중간 |
| 3 | `PosePatternPanel` | `usePosturePatternQuery` | 없음 | 중간 |

### Tier 2 — 렌더 구조 또는 내부 구성이 비교적 큼

| 순서 | 패널 | 주요 의존성 | 외부 패키지 | 복잡도 |
|---|---|---|---|---|
| 4 | `AttendacePanel` | `useAttendanceQuery` | 없음 | 높음 |
| 5 | `AverageGraphPannel` | `usePostureGraphQuery` | 차트 라이브러리 의존 여부 확인 필요 | 높음 |
| 6 | `HighlightsPanel` | `useHighlightQuery`, `useThemeApplied` | `recharts` | 높음 |

### Tier 3 — 세션/카메라 상태와 강하게 결합

| 순서 | 패널 | 주요 의존성 | 외부 패키지 | 복잡도 |
|---|---|---|---|---|
| 7 | `RunningPanel` | `usePostureStore`, `useCameraStore` | 없음 | 높음 |
| 8 | `ExitPanel` | `useLevelQuery`, `useSessionReportQuery` | `recharts` | 높음 |
| 9 | `MiniRunningPanel` | `useCameraStore` | 없음 | 낮음 |
| 10 | `WebcamPanel` | 세션 mutation 4개, `useLevelQuery` | 없음 | 높음 |

`MiniRunningPanel` 자체는 단순하지만, 실제 완성도 있는 이관을 위해서는
`RunningPanel`과 `ExitPanel` 선행 포팅이 사실상 필요하다.

## 공통 의존성 맵

### entities/dashboard

- `useAverageScoreQuery` — `AveragePosturePanel`
- `useAttendanceQuery` — `AttendacePanel`
- `useLevelQuery` — `TotalDistancePanel`, `WebcamPanel`, `ExitPanel`
- `usePostureGraphQuery` — `AverageGraphPannel`
- `useHighlightQuery` — `HighlightsPanel`
- `usePosturePatternQuery` — `PosePatternPanel`

### entities/session

- `useCreateSessionMutation` — `WebcamPanel`
- `useStopSessionMutation` — `WebcamPanel`
- `usePauseSessionMutation` — `WebcamPanel`
- `useResumeSessionMutation` — `WebcamPanel`
- `useSessionReportQuery` — `ExitPanel`

### entities/posture

- `usePostureStore` — `RunningPanel`

### widgets/camera

- `useCameraStore` — `MiniRunningPanel`, `RunningPanel`

### shared

- `useModal` — `TotalDistancePanel`
- `useThemeApplied` — `HighlightsPanel`

### 외부 패키지

- `recharts` — `HighlightsPanel`, `ExitPanel`

## 이관 메모

1. 메인 대시보드 기준 실제 대상은 8개 패널이다.
2. 우측 하단 슬롯은 `MiniRunningPanel` 1개로 보이지만 구현상 `RunningPanel`과 `ExitPanel` 분기까지 포함해 검토해야 한다.
3. `CharacterPanel`, `TrendPanel`, `LevelProgressPanel`은 현재 메인 대시보드 실사용 범위가 아니다.
4. 레거시 UI 스타일은 절대 변경하지 않고, 동일 구조와 동일 배치를 유지한 채 Tauri 네이티브 UI로 이관해야 한다.
