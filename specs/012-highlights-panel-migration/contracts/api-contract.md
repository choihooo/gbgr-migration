# API Contract: HighlightsPanel

**Feature**: 012-highlights-panel-migration
**Date**: 2026-04-15

## 백엔드 API (기존 — 변경 없음)

### GET /dashboard/highlight

하이라이트 데이터를 조회합니다.

**Request:**

| 파라미터 | 위치 | 타입 | 필수 | 설명 |
|----------|------|------|------|------|
| period | query | string | O | 'WEEKLY' \| 'MONTHLY' |
| year | query | number | O | 조회 연도 |
| month | query | number | X | 조회 월 (MONTHLY일 때) |

**Response (200):**

```json
{
  "timestamp": "2026-04-15T10:00:00",
  "success": true,
  "data": {
    "current": 321,
    "previous": 257
  },
  "code": "SUCCESS",
  "message": "OK"
}
```

**참고**: 이 API는 기존 레거시와 동일하며, 마이그레이션 프로젝트에 이미 구현되어 있습니다.
- API 함수: `migration/src/entities/dashboard/api/dashboard-api.ts` — `getHighlight()`
- 쿼리 훅: `migration/src/entities/dashboard/model/use-dashboard-queries.ts` — `useHighlightQuery()`

## 내부 인터페이스

### useHighlightsChart(activePeriod) → ChartConfig

**입력:**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| activePeriod | 'weekly' \| 'monthly' | 선택된 기간 |

**출력 (ChartConfig):**
| 필드 | 타입 | 설명 |
|------|------|------|
| data | HighlightDatum[] | 차트 데이터 배열 (2개: previous, current) |
| unitLabel | string | "단위: 분/일" |
| maxDomain | number | Y축 최대값 (100 단위 올림) |
| barSize | number | 막대 너비 (130) |
| barRadius | [number, number, number, number] | 막대 상단 라운딩 [8,8,0,0] |
| categoryGap | number | 막대 간 간격 (64) |
| chartColors | { previous, current } | 막대 색상 (CSS 변수 기반) |
| labelColor | string | current 라벨 색상 |
| previousLabelColor | string | previous 라벨 색상 |
| labelStyle | { fontSize, fontWeight, fill } | 라벨 폰트 스타일 |
| labelPosition | 'center' | 라벨 위치 |
| gridColor | string | 그리드 선 색상 |
| yAxisTicks | number[] | Y축 눈금 배열 |

### getColor(cssVar, fallback) → string

**입력:**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| cssVar | string | CSS 변수명 (예: '--color-grey-100') |
| fallback | string | 폴백 색상 값 |

**출력:** CSS 변수의 계산된 색상 값 (hex 문자열)
