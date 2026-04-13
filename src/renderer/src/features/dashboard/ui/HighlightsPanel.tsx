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

import { PannelHeader } from '@shared/ui/panel-header'
import { ToggleSwitch } from '@shared/ui/toggle-switch'
import type { HighlightDatum } from './HighlightsPanel/data'
import {
  type HighlightPeriod,
  useHighlightsChart,
} from './HighlightsPanel/hooks/useHighlightsChart'

const HighlightsPanel = () => {
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
    yAxisTicks,
  } = useHighlightsChart(activePeriod)

  const handleToggleChange = (isMonthly: boolean) => {
    setActivePeriod(isMonthly ? 'monthly' : 'weekly')
  }

  return (
    <div className="flex h-full flex-col rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <PannelHeader>하이라이트</PannelHeader>
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
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barSize={barSize}
            barCategoryGap={categoryGap}
            margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
          >
            {/* 이번주/이번달(진한색), 저번주/저번달(연한색)용 그라디언트 정의 */}
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
              tick={{ fill: '#a8a7a4', fontSize: 10, fontWeight: 400 }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#a8a7a4', fontSize: 10, fontWeight: 400 }}
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
                      ? 'url(#currentBarGradient)' // 이번 주/달
                      : 'url(#previousBarGradient)' // 저번 주/달
                  }
                />
              ))}

              <LabelList
                dataKey="value"
                position={labelPosition}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                content={(props: any) => {
                  const { value, index, viewBox } = props
                  if (viewBox == null || index == null) return null

                  const { x, y, width, height } = viewBox as {
                    x: number
                    y: number
                    width: number
                    height: number
                  }

                  const datum = data[index] as HighlightDatum | undefined
                  if (!datum) return null

                  const isCurrent = datum.barKey === 'current'

                  // 막대 중앙 좌표
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
      </div>
    </div>
  )
}

export default HighlightsPanel
