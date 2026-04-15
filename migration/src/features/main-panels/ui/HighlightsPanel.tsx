/**
 * 하이라이트 패널 - 주간/월간 비교 막대 차트
 * @legacy src/renderer/src/features/dashboard/ui/HighlightsPanel.tsx
 */

import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import type { Props as RechartsLabelProps } from 'recharts/types/component/Label'
import { LoadingSpinner } from '@/shared/ui/loading-spinner'
import { PanelHeader } from '@/shared/ui/panel-header'
import { ToggleSwitch } from '@/shared/ui/toggle-switch'

import type { HighlightDatum } from './HighlightsPanel/data'
import {
  type HighlightPeriod,
  useHighlightsChart,
} from './HighlightsPanel/hooks/useHighlightsChart'

function isCartesianViewBox(
  viewBox: RechartsLabelProps['viewBox'],
): viewBox is { x: number; y: number; width: number; height: number } {
  return (
    viewBox != null &&
    'x' in viewBox &&
    'y' in viewBox &&
    'width' in viewBox &&
    'height' in viewBox
  )
}

export function HighlightsPanel() {
  const [activePeriod, setActivePeriod] = useState<HighlightPeriod>('weekly')

  const {
    data,
    unitLabel,
    maxDomain,
    barSize,
    barRadius,
    categoryGap,
    chartColors,
    labelColor,
    previousLabelColor,
    labelStyle,
    labelPosition,
    gridColor,
    yAxisTickColor,
    yAxisTicks,
    isLoading,
  } = useHighlightsChart(activePeriod)

  const handleToggleChange = (isMonthly: boolean) => {
    setActivePeriod(isMonthly ? 'monthly' : 'weekly')
  }

  return (
    <div className="flex h-full flex-col rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <PanelHeader>하이라이트</PanelHeader>
        <ToggleSwitch
          uncheckedLabel="주간"
          checkedLabel="월간"
          checked={activePeriod === 'monthly'}
          onChange={handleToggleChange}
        />
      </div>

      <div className="flex items-center justify-end">
        <span className="text-caption-xs-regular text-grey-400">
          {unitLabel}
        </span>
      </div>

      <div className="mt-6 min-h-[220px] flex-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              barSize={barSize}
              barCategoryGap={categoryGap}
              margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="previousBarGradient"
                  x1="0"
                  y1="1"
                  x2="0"
                  y2="0"
                >
                  <stop offset="0%" stopColor={chartColors.previous} />
                  <stop offset="100%" stopColor={chartColors.previous} />
                </linearGradient>
                <linearGradient
                  id="currentBarGradient"
                  x1="0"
                  y1="1"
                  x2="0"
                  y2="0"
                >
                  <stop offset="0%" stopColor={chartColors.current} />
                  <stop offset="100%" stopColor={chartColors.current} />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                stroke={gridColor}
                strokeDasharray="0"
              />

              <XAxis
                dataKey="periodLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fill: yAxisTickColor, fontSize: 10, fontWeight: 400 }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: yAxisTickColor, fontSize: 10, fontWeight: 400 }}
                domain={[0, maxDomain]}
                ticks={yAxisTicks}
                width={30}
              />

              <Bar dataKey="value" radius={barRadius} background={false}>
                {data.map((datum: HighlightDatum) => (
                  <Cell
                    key={datum.periodLabel}
                    fill={
                      datum.barKey === 'current'
                        ? 'url(#currentBarGradient)'
                        : 'url(#previousBarGradient)'
                    }
                  />
                ))}

                <LabelList
                  dataKey="value"
                  position={labelPosition}
                  content={(props: RechartsLabelProps) => {
                    const { value, index, viewBox } = props
                    if (!isCartesianViewBox(viewBox) || index == null)
                      return null

                    const { x, y, width, height } = viewBox

                    const datum = data[index] as HighlightDatum | undefined
                    if (!datum) return null

                    const isCurrent = datum.barKey === 'current'

                    const cx = x + width / 2
                    const cy = y + height / 2

                    const fill = isCurrent ? labelColor : previousLabelColor

                    let text: string
                    if (typeof value === 'number') text = value.toString()
                    else if (typeof value === 'string') text = value
                    else return null

                    return (
                      <text
                        x={cx}
                        y={cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={labelStyle.fontSize}
                        fontWeight={labelStyle.fontWeight}
                        fill={fill}
                      >
                        {text}
                      </text>
                    )
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
