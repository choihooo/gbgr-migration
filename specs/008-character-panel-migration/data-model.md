# Data Model: CharacterPanel 이관

**Date**: 2026-04-15
**Branch**: `008-character-panel-migration`

## Entities

### CharacterPanelComponent

CharacterPanel을 표현하는 최상위 UI 엔티티.

| Field | Type | Description |
|-------|------|-------------|
| placementMode | `'standalone' \| 'dashboard-slot'` | 단독 검증용 렌더링인지, 대시보드 내 배치 렌더링인지 구분 |
| className | `string \| undefined` | 상위 레이아웃이 전달하는 선택적 추가 클래스 |
| visualState | `'default'` | 이번 범위에서 유일한 시각 상태 |

**Rules**:
- 기본 상태는 항상 `default`다.
- 데이터 로딩, 에러, 빈 상태, 인터랙션 상태를 추가하지 않는다.

### CharacterPanelCard

사용자가 보는 카드 컨테이너 표현.

| Field | Type | Description |
|-------|------|-------------|
| borderVisible | `boolean` | 외곽선 표시 여부 |
| backgroundTone | `'white'` | 카드 배경 톤 |
| cornerStyle | `'rounded-2xl'` | 카드 모서리 표현 |
| paddingMode | `'none'` | 내부 여백 상태 |

**Rules**:
- 외곽선은 항상 표시된다.
- 카드 배경은 흰색 계열로 고정된다.
- 내부 여백은 추가하지 않는다.

### CharacterVisualArea

카드 내부의 정사각형 비주얼 영역.

| Field | Type | Description |
|-------|------|-------------|
| aspectRatio | `'square'` | 가로세로 비율 |
| widthMode | `'full'` | 카드 가로폭 전체 사용 |
| backgroundTone | `'warning-300/30'` | 내부 비주얼 배경 톤 |
| cornerStyle | `'rounded-2xl'` | 내부 영역 모서리 표현 |

**Rules**:
- 비주얼 영역은 항상 정사각형 비율을 유지한다.
- 별도 텍스트, 버튼, 이미지 자산 없이 색면만 표시한다.

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
CharacterPanelComponent
  ├── renders → CharacterPanelCard
  ├── contains → CharacterVisualArea
  └── is validated by → VisualComparisonArtifact
```

## Validation Rules

- CharacterPanelComponent는 기본적으로 무의존성 정적 패널이어야 한다.
- CharacterPanelCard와 CharacterVisualArea에는 사용자 상호작용 요소를 추가하지 않는다.
- VisualComparisonArtifact는 동일 해상도 또는 동일 비율 기준으로 생성해야 한다.
- 대시보드 연결이 수행되지 않는 경우에도 `standalone` 모드 검증 산출물은 남겨야 한다.
