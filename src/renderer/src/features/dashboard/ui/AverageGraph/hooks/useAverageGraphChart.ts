import { usePostureGraphQuery } from '@entities/dashboard'
import { useThemeApplied } from '@shared/hooks/use-theme-applied'
import { getColor } from '@shared/lib/get-color'
import { useMemo } from 'react'

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

export function useAverageGraphChart(activePeriod: AverageGraphPeriod) {
  const { data: apiData } = usePostureGraphQuery()
  const isDarkApplied = useThemeApplied()

  /* 그래프 색상 */
  const chartConfig = useMemo<ChartConfig>(() => {
    const gridColorValue = getColor('--color-grey-50', '#efeeed')
    const fillColorValue = getColor('--color-yellow-200', '#ffe28a')
    const strokeColorValue = getColor(
      '--color-sementic-brand-primary',
      '#ffbf00',
    )

    /* API 데이터를 그래프 형식으로 변환 */
    let data: AverageGraphDatum[] = []

    if (apiData?.data?.points && Object.keys(apiData.data.points).length > 0) {
      const points = apiData.data.points
      const sortedEntries = Object.entries(points).sort(([dateA], [dateB]) =>
        dateA.localeCompare(dateB),
      )

      /* 주간: 최근 7일, 월간: 전체 31일 */
      const slicedEntries =
        activePeriod === 'weekly' ? sortedEntries.slice(-7) : sortedEntries

      data = slicedEntries.map(([_, score], index) => ({
        periodLabel: (index + 1).toString(), // 1부터 시작
        // eslint-disable-next-line react-hooks/purity
        score: score === 0 ? Math.floor(Math.random() * 40) + 30 : score, // 0이면 임시 랜덤 데이터 (50~80)
      }))
    } else {
      /* 데이터가 없을 때 임시 데이터 생성 */
      const length = activePeriod === 'weekly' ? 7 : 31
      data = Array.from({ length }, (_, index) => ({
        periodLabel: (index + 1).toString(), // 1~7 또는 1~31
        // eslint-disable-next-line react-hooks/purity
        score: Math.floor(Math.random() * 30) + 50, // 50~80 사이 랜덤 값
      }))
    }

    /* 최댓값 100 */
    const domainMax = 100

    /* y축 눈금 */
    const ticks: number[] = [25, 50, 75, 100]

    return {
      data,
      maxDomain: domainMax,
      fillColor: fillColorValue,
      strokeColor: strokeColorValue,
      gridColor: gridColorValue,
      yAxisTicks: ticks,
    }
  }, [activePeriod, apiData, isDarkApplied])

  return chartConfig
}
