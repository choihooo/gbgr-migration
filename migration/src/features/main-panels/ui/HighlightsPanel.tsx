import { useMemo, useState } from 'react'
import { useHighlightQuery } from '@/entities/dashboard/model/use-dashboard-queries'
import { PanelHeader } from '@/shared/ui/panel-header'
import { ToggleSwitch } from '@/shared/ui/toggle-switch'

const WEEKLY_LABELS = ['월', '화', '수', '목', '금', '토', '일']
const MONTHLY_LABELS = ['1주', '2주', '3주', '4주']

export function HighlightsPanel() {
  const [activePeriod, setActivePeriod] = useState<'weekly' | 'monthly'>(
    'weekly',
  )
  const today = new Date()
  const { data } = useHighlightQuery({
    period: activePeriod === 'weekly' ? 'WEEKLY' : 'MONTHLY',
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  })

  const chartData = useMemo(() => {
    const labels = activePeriod === 'weekly' ? WEEKLY_LABELS : MONTHLY_LABELS
    const current = data?.data.current ?? 6
    const previous = data?.data.previous ?? 4

    return labels.map((label, index) => ({
      label,
      current: Math.max(current - index, 1),
      previous: Math.max(previous - Math.floor(index / 2), 1),
    }))
  }, [activePeriod, data?.data.current, data?.data.previous])

  const maxValue = Math.max(
    ...chartData.flatMap(item => [item.current, item.previous]),
    1,
  )

  return (
    <section className="flex h-full flex-col rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <PanelHeader>하이라이트</PanelHeader>
        <ToggleSwitch
          uncheckedLabel="주간"
          checkedLabel="월간"
          checked={activePeriod === 'monthly'}
          onChange={checked => setActivePeriod(checked ? 'monthly' : 'weekly')}
        />
      </div>

      <div className="flex items-center justify-end">
        <span className="text-caption-xs-regular text-grey-400">횟수</span>
      </div>

      <div className="mt-6 flex min-h-[220px] flex-1 items-end justify-between gap-3">
        {chartData.map(item => (
          <div
            key={item.label}
            className="flex flex-1 flex-col items-center gap-2"
          >
            <div className="flex h-[180px] items-end gap-1">
              <div
                className="flex w-6 items-center justify-center rounded-full bg-yellow-100 text-[10px] font-medium text-yellow-700"
                style={{ height: `${(item.previous / maxValue) * 100}%` }}
              >
                {item.previous}
              </div>
              <div
                className="flex w-6 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-medium text-grey-1000"
                style={{ height: `${(item.current / maxValue) * 100}%` }}
              >
                {item.current}
              </div>
            </div>
            <span className="text-caption-2xs-medium text-grey-300">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
