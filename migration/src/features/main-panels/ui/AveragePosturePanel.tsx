import { useAverageScoreQuery } from '@/entities/dashboard/model/use-dashboard-queries'
import { cn } from '@/shared/lib/cn'
import type { PanelBaseProps } from '../model/types'

type LevelInfo = {
  label: string
  tilt: string
  weight: string
}

const LEVELS: LevelInfo[] = [
  { label: '뽀각거부기', tilt: '18°', weight: '25kg' },
  { label: '꾸부정거부기', tilt: '15°', weight: '18kg' },
  { label: '아기기린', tilt: '11°', weight: '12kg' },
  { label: '쑥쑥기린', tilt: '7°', weight: '7kg' },
  { label: '꽃꼿기린', tilt: '4°', weight: '5kg' },
  { label: '프로기린', tilt: '2°', weight: '4kg' },
]

const getLevel = (score: number) => {
  if (score >= 95) return 6
  if (score >= 85) return 5
  if (score >= 75) return 4
  if (score >= 60) return 3
  if (score >= 40) return 2
  return 1
}

export function AveragePosturePanel({ className }: PanelBaseProps) {
  const { data, isLoading, isError } = useAverageScoreQuery()
  const score = data?.data.score ?? 0
  const level = getLevel(score)
  const levelInfo = LEVELS[level - 1] ?? LEVELS[0]
  const useTurtleGradient = level <= 2

  return (
    <section
      className={cn(
        'relative h-full w-full overflow-hidden rounded-3xl p-4',
        useTurtleGradient
          ? 'bg-[image:var(--color-turtle-gradient)]'
          : 'bg-[image:var(--color-average-score)]',
        className,
      )}
    >
      <div className="flex h-full justify-between gap-4">
        <div className="flex min-w-[120px] flex-col text-yellow-100">
          <p className="text-caption-sm-medium">평균 자세 점수</p>
          <p className="text-title-4xl-bold text-grey-0 mb-4">
            {isLoading ? '-' : `${score}점`}
          </p>
          <p className="text-caption-xs-meidum whitespace-nowrap text-yellow-50">
            목 평균 기울기 {isError ? '-' : levelInfo.tilt}
            <br />
            예상 하중 {isError ? '-' : levelInfo.weight}
          </p>
        </div>

        <div className="flex min-w-[128px] flex-col items-end gap-3">
          <span className="text-caption-xs-meidum rounded-full bg-yellow-50 px-2 py-1 text-yellow-500">
            {isError ? '분석 대기' : levelInfo.label}
          </span>
          <div className="relative mt-auto flex h-[172px] w-[148px] items-end justify-center overflow-hidden rounded-[28px] bg-white/16">
            <div className="absolute inset-x-6 bottom-0 h-[116px] rounded-t-[999px] bg-white/18" />
            <div className="absolute inset-x-10 bottom-0 h-[132px] rounded-t-[999px] bg-white/28" />
            <div className="absolute inset-x-[46px] bottom-[30px] h-[84px] rounded-[999px] bg-white/85" />
            <div className="absolute left-1/2 bottom-[88px] h-[28px] w-[28px] -translate-x-1/2 rounded-full bg-white/95" />
          </div>
        </div>
      </div>

      <div className="absolute inset-x-4 bottom-4">
        <p className="text-caption-sm-medium text-yellow-100">Step. {level}</p>
      </div>
    </section>
  )
}
