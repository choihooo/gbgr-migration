# Data Model: AveragePosturePanel 이관

**Date**: 2026-04-15
**Branch**: `010-average-posture-panel`

## Entities

### AveragePosturePanelComponent

AveragePosturePanel을 표현하는 최상위 UI 엔티티.

| Field | Type | Description |
|-------|------|-------------|
| className | `string \| undefined` | 상위 레이아웃이 전달하는 선택적 추가 클래스 |
| visualState | `'loading' \| 'ready'` | 조회 상태에 따른 시각 상태 |
| score | `number` | 현재 평균 자세 점수 |
| level | `1 \| 2 \| 3 \| 4 \| 5` | 레거시 기준 단계 값 |

**Rules**:

- 점수 데이터가 없으면 기본 점수는 `0`으로 본다.
- 단계 값은 항상 1~5 범위 안에 있어야 한다.
- 시각 상태가 달라도 패널 레이아웃은 유지된다.

### ScoreSummary

패널 좌측 영역에 표시되는 핵심 정보 묶음.

| Field | Type | Description |
|-------|------|-------------|
| title | `'평균 자세 점수'` | 패널 제목 |
| scoreText | `string` | 점수 표시 문자열 |
| tiltText | `string` | 목 평균 기울기 문구 |
| weightText | `string` | 예상 하중 문구 |

**Rules**:

- 제목은 항상 고정 문구를 사용한다.
- 로딩 중에는 점수 위치가 유지되어야 한다.
- 기울기와 하중 문구는 단계 정보 세트와 일치해야 한다.

### LevelInfoSet

점수 구간에 대응하는 시각/문구 정보 세트.

| Field | Type | Description |
|-------|------|-------------|
| level | `1 \| 2 \| 3 \| 4 \| 5` | 단계 번호 |
| name | `string` | 단계 이름 |
| tilt | `string` | 목 평균 기울기 설명 |
| weight | `string` | 예상 하중 설명 |
| characterAsset | `string` | 단계별 캐릭터 이미지 식별 값 |

**Rules**:

- 각 단계는 하나의 이름, 하나의 기울기 문구, 하나의 하중 문구, 하나의 캐릭터 이미지와 1:1로 연결된다.
- 단계 정보 세트는 레거시 정의와 동일해야 한다.

### BackgroundVariant

패널 전체에 적용되는 배경 표현 상태.

| Field | Type | Description |
|-------|------|-------------|
| variant | `'turtle-gradient' \| 'average-score-gradient'` | 배경 종류 |
| triggerLevels | `number[]` | 해당 배경을 사용하는 단계 목록 |

**Rules**:

- 배경 종류는 2개만 허용한다.
- 배경 전환 기준은 레거시 단계 구간과 동일해야 한다.

### VisualComparisonArtifact

레거시와 마이그레이션 결과를 비교하는 검증 엔티티.

| Field | Type | Description |
|-------|------|-------------|
| sourceView | `'legacy'` | 레거시 캡처 |
| targetView | `'migration'` | 마이그레이션 캡처 |
| comparisonScope | `'panel-only' \| 'dashboard-context'` | 비교 범위 |
| reviewStatus | `'pending' \| 'matched' \| 'needs-fix'` | 검토 결과 |

## Relationships

```text
AveragePosturePanelComponent
  ├── contains → ScoreSummary
  ├── resolves → LevelInfoSet
  ├── applies → BackgroundVariant
  └── is validated by → VisualComparisonArtifact
```

## Validation Rules

- `level`은 `score`에 따라 레거시 규칙으로 계산되어야 한다.
- `ScoreSummary`의 텍스트 순서와 시각 위계는 레거시와 동일해야 한다.
- `LevelInfoSet`은 레거시와 다른 이름, 문구, 자산 조합으로 바뀌면 안 된다.
- `BackgroundVariant`는 단계별 전환 기준을 임의로 확장하거나 축소하면 안 된다.
- `VisualComparisonArtifact`는 최소한 카드 배경, 점수, 단계 이름, 캐릭터 이미지, `Step` 표기를 동시에 확인할 수 있어야 한다.
