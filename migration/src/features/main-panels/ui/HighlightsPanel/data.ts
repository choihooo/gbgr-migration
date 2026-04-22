/**
 * 하이라이트 차트 데이터 타입
 * @legacy src/renderer/src/features/dashboard/ui/HighlightsPanel/data.ts
 */

export type HighlightDatum = {
  periodLabel: string
  value: number
  barKey: 'previous' | 'current'
}

export const WEEKLY_DATA: HighlightDatum[] = []

export const MONTHLY_DATA: HighlightDatum[] = []
