import { PannelHeader } from '@shared/ui/panel-header'
import { ToggleSwitch } from '@shared/ui/toggle-switch'
import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  type AverageGraphPeriod,
  useAverageGraphChart,
} from './hooks/useAverageGraphChart'

const AverageGraphPannel = () => {
  const [activePeriod, setActivePeriod] = useState<AverageGraphPeriod>('weekly')

  const { data, maxDomain, fillColor, strokeColor, gridColor, yAxisTicks } =
    useAverageGraphChart(activePeriod)

  const handleToggleChange = (isMonthly: boolean) => {
    setActivePeriod(isMonthly ? 'monthly' : 'weekly')
  }

  /* 월간일 때는 12개 항목이 부모 너비 100%를 차지하도록 설정 */
  /* 12개 이하면 항상 100%, 12개 초과면 스크롤로 나머지 데이터 표시 */
  const chartWidth =
    activePeriod === 'monthly' && data.length > 12
      ? (`${(100 / 12) * data.length}%` as `${number}%`)
      : '100%'

  /* 월간일 때만 스크롤 o */
  const showScroll = activePeriod === 'monthly' && data.length > 12

  return (
    <div className="flex h-full flex-col rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <PannelHeader>바른 자세 점수</PannelHeader>
        <ToggleSwitch
          uncheckedLabel="주간"
          checkedLabel="월간"
          checked={activePeriod === 'monthly'}
          onChange={handleToggleChange}
        />
      </div>
      <p className="ml-auto flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-yellow-500" />
        <span className="text-caption-2xs-medium text-grey-300">점수</span>
      </p>

      {/* 시계열 그래프 */}
      <div
        className={`min-h-[220px] flex-1 ${showScroll ? 'overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : ''}`}
      >
        <ResponsiveContainer width={chartWidth} height="100%">
          <AreaChart
            data={data}
            margin={{ top: 20, left: 0, bottom: 0, right: 0 }}
          >
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={fillColor} stopOpacity={0.8} />
                <stop offset="95%" stopColor={fillColor} stopOpacity={0.1} />
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
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#a8a7a4', fontSize: 10, fontWeight: 400 }}
              domain={[0, maxDomain]}
              ticks={yAxisTicks}
              width={30}
            />
            {/* 그래프 hover시 스코어 표기 */}
            <Tooltip
              position={{ y: 20 }}
              contentStyle={{
                backgroundColor: 'var(--color-surface-modal)',
                border: '1px solid var(--color-dashboard-score)',
                borderRadius: '8px',
                padding: '8px 10px',
              }}
              labelFormatter={() => ''}
              itemStyle={{ fontSize: 12 }}
            />
            <Area
              type="linear"
              dataKey="score"
              stroke={strokeColor}
              strokeWidth={2}
              fill="url(#colorScore)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default AverageGraphPannel
