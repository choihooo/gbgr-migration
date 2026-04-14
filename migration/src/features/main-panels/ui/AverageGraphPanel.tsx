import { useState } from 'react'
import { usePostureGraphQuery } from '@/entities/dashboard/model/use-dashboard-queries'
import { PanelHeader } from '@/shared/ui/panel-header'
import { ToggleSwitch } from '@/shared/ui/toggle-switch'

type GraphDatum = {
  label: string
  score: number
}

const WEEKLY_DATA: GraphDatum[] = [
  { label: '월', score: 62 },
  { label: '화', score: 68 },
  { label: '수', score: 73 },
  { label: '목', score: 70 },
  { label: '금', score: 78 },
  { label: '토', score: 75 },
  { label: '일', score: 82 },
]

const MONTHLY_DATA: GraphDatum[] = [
  { label: '1주', score: 62 },
  { label: '2주', score: 69 },
  { label: '3주', score: 75 },
  { label: '4주', score: 81 },
]

function buildAreaPath(values: number[], width: number, height: number) {
  if (values.length === 0) return ''
  const step = values.length === 1 ? 0 : width / (values.length - 1)

  const points = values.map((value, index) => {
    const x = step * index
    const y = height - (value / 100) * height
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  })

  return `${points.join(' ')} L ${width} ${height} L 0 ${height} Z`
}

export function AverageGraphPanel() {
  const [activePeriod, setActivePeriod] = useState<'weekly' | 'monthly'>(
    'weekly',
  )
  const { data } = usePostureGraphQuery()
  const source = data?.data.points
  const graphData =
    source && Object.keys(source).length > 0
      ? Object.entries(source).map(([label, score]) => ({ label, score }))
      : activePeriod === 'weekly'
        ? WEEKLY_DATA
        : MONTHLY_DATA

  const path = buildAreaPath(
    graphData.map(item => item.score),
    280,
    140,
  )

  return (
    <section className="flex h-full flex-col rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <PanelHeader>바른 자세 점수</PanelHeader>
        <ToggleSwitch
          uncheckedLabel="주간"
          checkedLabel="월간"
          checked={activePeriod === 'monthly'}
          onChange={checked => setActivePeriod(checked ? 'monthly' : 'weekly')}
        />
      </div>
      <p className="ml-auto flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-yellow-500" />
        <span className="text-caption-2xs-medium text-grey-300">점수</span>
      </p>

      <div className="mt-4 flex min-h-[220px] flex-1 flex-col justify-between">
        <div className="bg-grey-25 relative h-[160px] rounded-2xl px-3 pt-4 pb-2">
          <div className="text-caption-2xs-medium text-grey-300 absolute inset-x-3 top-4 flex justify-between">
            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
          </div>
          <svg
            viewBox="0 0 280 140"
            className="mt-5 h-[120px] w-full"
            role="img"
            aria-label="바른 자세 점수 추이 그래프"
          >
            <title>바른 자세 점수 추이 그래프</title>
            <defs>
              <linearGradient
                id="average-graph-fill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#FFE28A" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FFE28A" stopOpacity="0.12" />
              </linearGradient>
            </defs>
            <path d={path} fill="url(#average-graph-fill)" />
            <polyline
              fill="none"
              stroke="#FFCB31"
              strokeWidth="2"
              points={graphData
                .map((item, index) => {
                  const x =
                    graphData.length === 1
                      ? 0
                      : (280 / (graphData.length - 1)) * index
                  const y = 140 - (item.score / 100) * 140
                  return `${x},${y}`
                })
                .join(' ')}
            />
          </svg>
        </div>

        <div className="text-caption-2xs-medium text-grey-300 mt-4 grid grid-cols-4 gap-2 text-center">
          {graphData.map(item => (
            <span key={item.label}>{item.label}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
