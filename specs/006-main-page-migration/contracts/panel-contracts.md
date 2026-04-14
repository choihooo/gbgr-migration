# Panel Component Contracts

**Feature**: 006-main-page-migration
**Date**: 2026-04-14

## 패널 컴포넌트 공통 계약

모든 패널 컴포넌트는 다음 공통 계약을 따른다.

### 공통 Props (PanelBaseProps)

```typescript
interface PanelBaseProps {
  className?: string;
}
```

### 공통 스타일 계약

- 모든 패널은 `rounded-3xl bg-grey-0` 컨테이너를 사용한다.
- 패널 간 간격은 레거시와 동일한 `gap` 값을 사용한다.
- 패널 내부 패딩은 레거시와 동일한 값을 사용한다.

---

## 개별 패널 계약

### 1. AveragePosturePanel

```typescript
// Props: 없음 (데이터는 내부 쿼리로 조회)
// Data: useAverageScoreQuery()
// Renders: 그라데이션 배경 + 점수 + 레벨 + 캐릭터 이미지
// Interactions: 없음 (표시 전용)
```

### 2. AttendancePanel

```typescript
// Props: 없음
// Data: useAttendanceQuery(year, month)
// Internal State: viewDate (현재 조회 월)
// Renders: 월간 캘린더 + 활동 레벨 색상 + 동기부여 메시지
// Interactions: 월 이전/다음 버튼
```

### 3. TotalDistancePanel

```typescript
// Props: 없음
// Data: useLevelQuery()
// Internal State: isOpen (상세 모달)
// Renders: 거리 표시 + 진행 바 + 스케일 마커
// Interactions: 상세 보기 모달 열기
```

### 4. AverageGraphPanel

```typescript
// Props: 없음
// Data: usePostureGraphQuery(period)
// Internal State: activePeriod ('weekly' | 'monthly')
// Renders: 영역 그래프 + 기간 토글
// Interactions: 주간/월간 전환 토글
```

### 5. HighlightsPanel

```typescript
// Props: 없음
// Data: useHighlightQuery(period)
// Internal State: activePeriod ('weekly' | 'monthly')
// Renders: 막대 그래프 + 기간 토글
// Interactions: 주간/월간 전환 토글
```

### 6. PosePatternPanel

```typescript
// Props: 없음
// Data: usePosturePatternQuery()
// Renders: 2x2 메트릭 그리드 + TIP 섹션
// Interactions: 없음 (표시 전용)
```

### 7. WebcamPanel

```typescript
interface WebcamPanelProps {
  onToggleWebcam: () => void;
  onSendMetrics: () => Promise<void>;
}

// Data: useCameraStore(), useLevelQuery()
// Renders: 비디오 피드 영역 + 컨트롤 버튼
// Interactions: 시작/정지, 보이기/숨기기, 위젯 토글
```

### 8. MiniRunningPanel

```typescript
// Props: 없음
// Data: useCameraStore()
// Renders: cameraState에 따라 ExitPanel 또는 RunningPanel
// Interactions: 없음 (상태에 따른 조건부 렌더링)
```

---

## 레이아웃 컴포넌트 계약

### MainContent

```typescript
// Props: 없음
// Renders: 2열 그리드 (grid-cols-[1fr_minmax(336px,400px)])
// Children: LeftPanelArea, RightPanelArea
```

### LeftPanelArea

```typescript
// Props: 없음
// Renders: 스크롤 컨테이너 (overflow-y-auto, custom-scrollbar)
// Children: AveragePosturePanel, AttendancePanel,
//           TotalDistancePanel, AverageGraphPanel,
//           HighlightsPanel, PosePatternPanel
```

### RightPanelArea

```typescript
// Props: 없음
// Renders: 스크롤 컨테이너 (overflow-y-auto, custom-scrollbar)
// Children: WebcamPanel, MiniRunningPanel
```

---

## 스토어 계약

### useCameraStore

```typescript
interface CameraState {
  cameraState: 'show' | 'hide' | 'exit';
  widgetState: 'show' | 'hide';
  setCameraState: (state: 'show' | 'hide' | 'exit') => void;
  setWidgetState: (state: 'show' | 'hide') => void;
  toggleCamera: () => void;
  toggleWidget: () => void;
}

// persist: { key: 'camera-store', storage: localStorage }
```
