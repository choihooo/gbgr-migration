import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PanelHeader } from '@/shared/ui/panel-header'
import { ToggleSwitch } from '@/shared/ui/toggle-switch'
import {
  type AverageGraphPeriod,
  useAverageGraphChart,
} from './AverageGraphPanel/hooks/useAverageGraphChart'

export function AverageGraphPanel() {
  const { t } = useTranslation()
  const [activePeriod, setActivePeriod] = useState<AverageGraphPeriod>('weekly')
  const { data, maxDomain, fillColor, strokeColor, gridColor, yAxisTicks } =
    useAverageGraphChart(activePeriod)

  const handleToggleChange = (isMonthly: boolean) => {
    setActivePeriod(isMonthly ? 'monthly' : 'weekly')
  }

  const chartWidth =
    activePeriod === 'monthly' && data.length > 12
      ? (`${(100 / 12) * data.length}%` as `${number}%`)
      : '100%'

  const showScroll = activePeriod === 'monthly' && data.length > 12

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <PanelHeader>{t('dashboard.panels.averageGraph.title')}</PanelHeader>
        <ToggleSwitch
          uncheckedLabel={t('dashboard.panels.averageGraph.weekly')}
          checkedLabel={t('dashboard.panels.averageGraph.monthly')}
          checked={activePeriod === 'monthly'}
          onChange={handleToggleChange}
        />
      </div>
      <p className="ml-auto flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-yellow-500" />
        <span className="text-caption-2xs-medium text-grey-300">
          {t('dashboard.panels.averageGraph.score')}
        </span>
      </p>

      <div
        className={`min-h-[220px] min-w-0 flex-1 ${showScroll ? 'overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : ''}`}
      >
        <ResponsiveContainer
          width={chartWidth}
          height="100%"
          minWidth={0}
          minHeight={0}
        >
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
    </section>
  )
}
