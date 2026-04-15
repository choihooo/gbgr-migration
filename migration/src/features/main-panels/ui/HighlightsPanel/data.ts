/**
 * 하이라이트 차트 데이터 타입
 * @legacy src/renderer/src/features/dashboard/ui/HighlightsPanel/data.ts
 */

export type HighlightDatum = {
  periodLabel: string
  value: number
  barKey: 'previous' | 'current'
}

export const WEEKLY_DATA: HighlightDatum[] = [
  {
    periodLabel: '저번 주',
    value: 257,
    barKey: 'previous',
  },
  {
    periodLabel: '이번 주',
    value: 321,
    barKey: 'current',
  },
]

export const MONTHLY_DATA: HighlightDatum[] = [
  { periodLabel: '저번 달', value: 210, barKey: 'previous' },
  { periodLabel: '이번 달', value: 225, barKey: 'current' },
]
