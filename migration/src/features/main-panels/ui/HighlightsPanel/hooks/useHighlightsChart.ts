/**
 * 하이라이트 차트 설정 훅
 * 목데이터 + 차트 설정(색상, 도메인, 라벨 등)을 통합 관리한다.
 * @legacy src/renderer/src/features/dashboard/ui/HighlightsPanel/hooks/useHighlightsChart.ts
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useThemeApplied } from '@/shared/hooks/use-theme-applied'
import { getColor } from '@/shared/lib/get-color'

import type { HighlightDatum } from '../data'

export type HighlightPeriod = 'weekly' | 'monthly'

type ChartColors = {
  previous: string
  current: string
}

export type ChartConfig = {
  data: HighlightDatum[]
  unitLabel: string
  maxDomain: number
  barSize: number
  barRadius: [number, number, number, number]
  categoryGap: number
  chartColors: ChartColors
  labelColor: string
  previousLabelColor: string
  labelStyle: {
    fontSize: number
    fontWeight: number
    fill: string
  }
  labelPosition: 'center' | 'top' | 'insideTop'
  gridColor: string
  yAxisTickColor: string
  yAxisTicks: number[]
  isLoading: boolean
}

export function useHighlightsChart(activePeriod: HighlightPeriod): ChartConfig {
  const { t } = useTranslation()
  const isDarkApplied = useThemeApplied()
  void isDarkApplied

  const chartData = useMemo<HighlightDatum[]>(() => {
    return activePeriod === 'weekly'
      ? [
          {
            periodLabel: t('dashboard.panels.highlights.previousWeek'),
            value: 257,
            barKey: 'previous',
          },
          {
            periodLabel: t('dashboard.panels.highlights.currentWeek'),
            value: 321,
            barKey: 'current',
          },
        ]
      : [
          {
            periodLabel: t('dashboard.panels.highlights.previousMonth'),
            value: 210,
            barKey: 'previous',
          },
          {
            periodLabel: t('dashboard.panels.highlights.currentMonth'),
            value: 225,
            barKey: 'current',
          },
        ]
  }, [activePeriod, t])

  const chartColors: ChartColors = {
    previous: getColor('--color-grey-100', '#e3e1df'),
    current: getColor('--color-sementic-brand-primary', '#ffbf00'),
  }

  const gridColorValue = getColor('--color-grey-50', '#efeeed')
  const yAxisTickColorValue = getColor('--color-grey-300', '#a8a7a4')

  const currentLabelColor = getColor('--color-yellow-50', '#fff9e6')
  const prevLabelColor = getColor('--color-grey-0', '#ffffff')

  const domainPadding = 40

  const calculatedMaxValue =
    chartData.length > 0
      ? chartData.reduce((acc, item) => Math.max(acc, item.value), 0) +
        domainPadding
      : domainPadding
  const maxValue = Math.ceil(calculatedMaxValue / 100) * 100
  const ticks: number[] = Array.from(
    { length: maxValue / 100 + 1 },
    (_, i) => i * 100,
  )

  const chartConfig: ChartConfig = {
    data: chartData,
    unitLabel: t('dashboard.panels.highlights.unit'),
    maxDomain: maxValue,
    barSize: 130,
    barRadius: [8, 8, 0, 0],
    categoryGap: 64,
    chartColors,
    labelColor: currentLabelColor,
    previousLabelColor: prevLabelColor,
    labelStyle: {
      fontSize: 22,
      fontWeight: 700,
      fill: currentLabelColor,
    },
    labelPosition: 'center',
    gridColor: gridColorValue,
    yAxisTickColor: yAxisTickColorValue,
    yAxisTicks: ticks,
    isLoading: false,
  }

  return chartConfig
}
