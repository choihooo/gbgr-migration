# 008 대시보드 패널 마이그레이션 분석

## 마이그레이션 대상

레거시 `src/renderer/src/features/dashboard/ui/`의 12개 메인 대시보드 패널을
`migration/` Tauri + React 프로젝트로 이관.

## 패널별 분석 및 마이그레이션 순서

영향 범위가 작은 순으로 정렬. 의존성이 없는 패널부터 옮기고,
공통 의존성(entities/dashboard, entities/session 등)은 필요할 때마다 함께 이관.

### Tier 1 — 의존성 없음, 즉시 이관 가능

| 순서 | 패널 | 줄 수 | 의존 스토어/API | 외부 패키지 | 자식 컴포넌트 | 복잡도 |
|---|---|---|---|---|---|---|
| 1 | CharacterPanel | 10 | 없음 | 없음 | 없음 | 낮음 |
| 2 | TrendPanel | 21 | 없음 | 없음 | 없음 | 낮음 |
| 3 | LevelProgressPanel | 28 | 없음 | 없음 | 없음 | 낮음 |

### Tier 2 — 스토어 1~2개 의존

| 순서 | 패널 | 줄 수 | 의존 스토어/API | 외부 패키지 | 자식 컴포넌트 | 복잡도 |
|---|---|---|---|---|---|---|
| 4 | MiniRunningPanel | 13 | `useCameraStore` | 없음 | ExitPanel, RunningPanel | 낮음 |
| 5 | AveragePosturePanel | 54 | `useAverageScoreQuery` | 없음 | 없음 | 중간 |
| 6 | TotalDistancePanel | 79 | `useLevelQuery`, `useModal` | 없음 | TotalDistanceModal (lazy) | 중간 |
| 7 | PosePatternPanel | 146 | `usePosturePatternQuery` | 없음 | PatternHeader (forwardRef) | 중간 |

### Tier 3 — 복잡한 의존성 또는 외부 패키지

| 순서 | 패널 | 줄 수 | 의존 스토어/API | 외부 패키지 | 자식 컴포넌트 | 복잡도 |
|---|---|---|---|---|---|---|
| 8 | WebcamPanel | 175 | 세션 mutation 4개, `useLevelQuery` | 없음 | WebcamView | 중간 |
| 9 | HighlightsPanel | 183+151 | `useHighlightQuery`, `useThemeApplied` | `recharts` | 없음 | 높음 |
| 10 | RunningPanel | 185 | `usePostureStore`, `useCameraStore` | 없음 | 없음 | 높음 |
| 11 | AttendacePanel | 293 | `useAttendanceQuery` | 없음 | Calendar (중첩) | 높음 |
| 12 | ExitPanel | 230 | `useLevelQuery`, `useSessionReportQuery` | `recharts` | 없음 | 높음 |

## 공통 의존성 맵

패널 이관 시 함께 가져와야 할 스토어/API 후크:

### entities/dashboard
- `useLevelQuery` — TotalDistancePanel, WebcamPanel, ExitPanel
- `useAttendanceQuery` — AttendacePanel
- `usePosturePatternQuery` — PosePatternPanel
- `useAverageScoreQuery` — AveragePosturePanel
- `useHighlightQuery` — HighlightsPanel

### entities/session
- `useCreateSessionMutation` — WebcamPanel
- `useStopSessionMutation` — WebcamPanel
- `usePauseSessionMutation` — WebcamPanel
- `useResumeSessionMutation` — WebcamPanel
- `useSessionReportQuery` — ExitPanel

### entities/posture
- `usePostureStore` — RunningPanel

### widgets/camera
- `useCameraStore` — MiniRunningPanel, RunningPanel

### shared
- `useModal` — TotalDistancePanel
- `useThemeApplied` — HighlightsPanel

### 외부 패키지 (신규 설치 필요)
- `recharts` — HighlightsPanel, ExitPanel

## 이관 전략

1. **Tier 1** 먼저 이관 — 스토어/API 의존 없이 UI만 복사
2. 공통 의존성은 패널 이관 시 필요한 것만 함께 포팅
3. **Tier 2** 이관 — 필요한 스토어/API 훅을 `entities/` 아래에 포팅
4. `recharts` 설치 후 **Tier 3** 이관
5. MiniRunningPanel은 ExitPanel, RunningPanel 이관 후 작업
6. 각 패널 이관 후 레거시와 UI 비교 검증
