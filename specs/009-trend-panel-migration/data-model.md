# Data Model: TrendPanel 이관

**Date**: 2026-04-15
**Branch**: `009-trend-panel-migration`

## Entities

### TrendPanelComponent

TrendPanel을 표현하는 최상위 UI 엔티티.

| Field | Type | Description |
|-------|------|-------------|
| placementMode | `'standalone' \| 'dashboard-slot'` | 단독 검증용 렌더링인지, 대시보드 내 배치 렌더링인지 구분 |
| className | `string \| undefined` | 상위 레이아웃이 전달하는 선택적 추가 클래스 |
| visualState | `'default'` | 이번 범위에서 유일한 시각 상태 |

**Rules**:
- 기본 상태는 항상 `default`다.
- 데이터 로딩, 에러, 빈 상태, 인터랙션 상태를 추가하지 않는다.

### TrendPanelCard

사용자가 보는 카드 컨테이너 표현.

| Field | Type | Description |
|-------|------|-------------|
| borderVisible | `boolean` | 외곽선 표시 여부 |
| backgroundTone | `'white'` | 카드 배경 톤 |
| cornerStyle | `'rounded-2xl'` | 카드 모서리 표현 |
| paddingMode | `'p-5'` | 내부 여백 |

**Rules**:
- 외곽선은 항상 표시된다.
- 카드 배경은 흰색 계열로 고정된다.
- 내부 여백은 `p-5`로 고정한다.

### HeaderSection

카드 상단의 제목과 필터 버튼 영역.

| Field | Type | Description |
|-------|------|-------------|
| title | `'자세 추이'` | 패널 제목 문구 |
| titleStyle | `'text-headline-xl-bold text-grey-800'` | 제목 타이포그래피 |
| layout | `'flex items-center justify-between'` | 제목 행 레이아웃 |

**Rules**:
- 제목은 항상 "자세 추이"로 고정된다.
- 제목과 버튼 그룹은 양쪽 정렬로 배치한다.

### FilterButtonGroup

"주간"과 "월간" 필터 버튼 쌍.

| Field | Type | Description |
|-------|------|-------------|
| defaultButton | `FilterButton` | "주간" 버튼 |
| activeButton | `FilterButton` | "월간" 버튼 |

**Rules**:
- 두 버튼은 항상 표시된다.
- 이번 범위에서 클릭 동작은 구현하지 않는다.

### FilterButton

개별 필터 버튼.

| Field | Type | Description |
|-------|------|-------------|
| label | `string` | 버튼 문구 ("주간" 또는 "월간") |
| variant | `'default' \| 'active'` | 기본 또는 활성 스타일 |
| cornerStyle | `'rounded-full'` | 버튼 모서리 |

**Rules**:
- "주간"은 기본 스타일(grey 계열)로 표시한다.
- "월간"은 활성 스타일(warning 계열)로 표시한다.
- 클릭 이벤트를 연결하지 않는다.

### ChartArea

카드 하단의 차트 영역.

| Field | Type | Description |
|-------|------|-------------|
| height | `'200px'` | 차트 영역 높이 |
| backgroundTone | `'grey-50'` | 차트 영역 배경 |
| cornerStyle | `'rounded-xl'` | 차트 영역 모서리 |

**Rules**:
- 차트 영역은 항상 200px 높이를 유지한다.
- 이번 범위에서는 빈 배경으로만 표시하고, 차트 데이터는 연결하지 않는다.

### VisualComparisonArtifact

레거시와 마이그레이션 결과를 같은 조건에서 비교하는 검증 엔티티.

| Field | Type | Description |
|-------|------|-------------|
| sourceView | `'legacy'` | 레거시 캡처 |
| targetView | `'migration'` | 마이그레이션 캡처 |
| comparisonScope | `'panel-only' \| 'dashboard-context'` | 패널 단독 비교 또는 대시보드 문맥 비교 |
| reviewStatus | `'pending' \| 'matched' \| 'needs-fix'` | 시각 일치 여부 |

## Relationships

```text
TrendPanelComponent
  ├── renders → TrendPanelCard
  ├── contains → HeaderSection
  │             └── contains → FilterButtonGroup
  │                           ├── contains → FilterButton (주간)
  │                           └── contains → FilterButton (월간)
  ├── contains → ChartArea
  └── is validated by → VisualComparisonArtifact
```

## Validation Rules

- TrendPanelComponent는 기본적으로 무의존성 정적 패널이어야 한다.
- TrendPanelCard와 ChartArea에는 사용자 상호작용 요소를 추가하지 않는다.
- FilterButtonGroup의 버튼은 클릭 동작 없이 시각적 역할만 수행한다.
- VisualComparisonArtifact는 동일 해상도 또는 동일 비율 기준으로 생성해야 한다.
- 대시보드 연결이 수행되지 않는 경우에도 `standalone` 모드 검증 산출물은 남겨야 한다.
