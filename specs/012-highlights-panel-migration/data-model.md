# Data Model: HighlightsPanel 마이그레이션

**Feature**: 012-highlights-panel-migration
**Date**: 2026-04-15

## 엔티티

### HighlightDatum (신규 — 차트 표시용)

| 필드 | 타입 | 설명 |
|------|------|------|
| periodLabel | string | X축 라벨 ("저번 주", "이번 주", "저번 달", "이번 달") |
| value | number | 수치 (분 단위) |
| barKey | 'previous' \| 'current' | 이전 기간 / 현재 기간 구분 |

### HighlightData (기존 — API 응답 데이터)

| 필드 | 타입 | 설명 |
|------|------|------|
| current | number | 현재 기간 수치 |
| previous | number | 이전 기간 수치 |

### HighlightQueryParams (기존 — API 요청 파라미터)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| period | HighlightPeriod | O | 'WEEKLY' \| 'MONTHLY' \| 'YEARLY' |
| year | number | O | 조회 연도 |
| month | number | X | 조회 월 (MONTHLY일 때 필요) |

### HighlightResponse (기존 — API 응답 래퍼)

| 필드 | 타입 | 설명 |
|------|------|------|
| timestamp | string | 응답 시간 |
| success | boolean | 성공 여부 |
| data | HighlightData | 하이라이트 데이터 |
| code | string | 응답 코드 |
| message | string | 응답 메시지 |

## 데이터 흐름

```
useHighlightQuery(params) → HighlightResponse
  ↓ data.data (HighlightData: { current, previous })
useHighlightsChart(activePeriod) → ChartConfig
  ↓ HighlightDatum[] (레거시 data.ts 매핑 로직)
HighlightsPanel → Recharts BarChart 렌더링
```

## 상태 전이

```
activePeriod: 'weekly' ↔ 'monthly'
  ↓ 토글 전환 시
  - activePeriod 상태 업데이트
  - useHighlightQuery 파라미터 변경
  - API 재요청 (TanStack Query 캐시 활용)
  - chartData 재계산 (useMemo)
  - 차트 리렌더링
```

## 검증 규칙

- API 데이터가 없거나 로딩 중일 때: value = 0으로 기본값 표시
- Y축 도메인: 최대값 + 40 여유 → 100 단위 올림
- month 파라미터: WEEKLY일 때는 undefined (전송 안 함)
