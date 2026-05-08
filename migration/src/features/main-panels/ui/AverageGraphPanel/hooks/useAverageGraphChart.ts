import { useMemo } from 'react'

import { usePostureGraphQuery } from '@/entities/dashboard/model/use-dashboard-queries'
import { useThemeApplied } from '@/shared/hooks/use-theme-applied'
import { getColor } from '@/shared/lib/get-color'

type AverageGraphDatum = {
  periodLabel: string
  score: number
}

export type AverageGraphPeriod = 'weekly' | 'monthly'

type ChartConfig = {
  data: AverageGraphDatum[]
  maxDomain: number
  fillColor: string
  strokeColor: string
  gridColor: string
  yAxisTicks: number[]
}

export function useAverageGraphChart(
  activePeriod: AverageGraphPeriod,
): ChartConfig {
  const { data: apiData } = usePostureGraphQuery()
  const isDarkApplied = useThemeApplied()

  const chartConfig = useMemo<ChartConfig>(() => {
    void isDarkApplied

    const gridColorValue = getColor('--color-grey-50', '#efeeed')
    const fillColorValue = getColor('--color-yellow-200', '#ffe28a')
    const strokeColorValue = getColor(
      '--color-sementic-brand-primary',
      '#ffbf00',
    )

    let data: AverageGraphDatum[] = []

    if (apiData?.data?.points && Object.keys(apiData.data.points).length > 0) {
      const sortedEntries = Object.entries(apiData.data.points).sort(
        ([dateA], [dateB]) => dateA.localeCompare(dateB),
      )

      const slicedEntries =
        activePeriod === 'weekly' ? sortedEntries.slice(-7) : sortedEntries

      data = slicedEntries.map(([_, score], index) => ({
        periodLabel: (index + 1).toString(),
        score,
      }))
    } else {
      const length = activePeriod === 'weekly' ? 7 : 31

      data = Array.from({ length }, (_, index) => ({
        periodLabel: (index + 1).toString(),
        score: 0,
      }))
    }

    return {
      data,
      maxDomain: 100,
      fillColor: fillColorValue,
      strokeColor: strokeColorValue,
      gridColor: gridColorValue,
      yAxisTicks: [25, 50, 75, 100],
    }
  }, [activePeriod, apiData, isDarkApplied])

  return chartConfig
}
