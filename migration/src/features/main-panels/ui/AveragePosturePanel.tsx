import { useTranslation } from 'react-i18next'
import stepFiveCharacter from '@/assets/main/averagePosture/step_five_character.png'
import stepFourCharacter from '@/assets/main/averagePosture/step_four_character.png'
import stepOneCharacter from '@/assets/main/averagePosture/step_one_character.png'
import stepThreeCharacter from '@/assets/main/averagePosture/step_three_character.png'
import stepTwoCharacter from '@/assets/main/averagePosture/step_two_character.png'
import { useAverageScoreQuery } from '@/entities/dashboard/model/use-dashboard-queries'
import { cn } from '@/shared/lib/cn'
import type { PanelBaseProps } from '../model/types'

type LevelInfo = {
  level: number
  name: string
  tilt: string
  weight: string
  character: string
}

const LEVEL_INFO: LevelInfo[] = [
  {
    level: 1,
    name: '뽀각거부기',
    tilt: '약 55–60°',
    weight: '약 26–27 kg',
    character: stepOneCharacter,
  },
  {
    level: 2,
    name: '꾸부정 거부기',
    tilt: '약 40–45°',
    weight: '약 20–22 kg',
    character: stepTwoCharacter,
  },
  {
    level: 3,
    name: '아기기린',
    tilt: '약 25–30°',
    weight: '약 16–18 kg',
    character: stepThreeCharacter,
  },
  {
    level: 4,
    name: '쑥쑥기린',
    tilt: '약 10–15°',
    weight: '약 10–12 kg',
    character: stepFourCharacter,
  },
  {
    level: 5,
    name: '꼿꼿기린',
    tilt: '약 0–5°',
    weight: '약 5–6 kg',
    character: stepFiveCharacter,
  },
]

const getLevel = (score: number): number => {
  if (score < 35) return 1
  if (score < 55) return 2
  if (score < 72) return 3
  if (score < 88) return 4
  return 5
}

export function AveragePosturePanel({ className }: PanelBaseProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useAverageScoreQuery()
  const score = data?.data.score ?? 0
  const level = getLevel(score)
  const levelInfo = LEVEL_INFO[level - 1] ?? LEVEL_INFO[0]
  const isTurtle = level <= 2

  return (
    <section
      className={cn(
        'relative h-full w-full rounded-3xl p-4',
        isTurtle
          ? 'bg-[image:var(--color-turtle-gradient)]'
          : 'bg-[image:var(--color-average-score)]',
        className,
      )}
    >
      <div className="items center flex h-full justify-between">
        <p className="text-caption-sm-medium flex min-w-[120px] flex-col text-yellow-100">
          <span>{t('dashboard.panels.averagePosture.title')}</span>
          <span className="text-title-4xl-bold text-grey-0 mb-4">
            {isLoading
              ? '-'
              : t('dashboard.panels.averagePosture.score', { value: score })}
          </span>
          <span className="text-caption-xs-meidum whitespace-nowrap text-yellow-50">
            {t('dashboard.panels.averagePosture.neckTilt', {
              value: levelInfo.tilt,
            })}
            <br />
            {t('dashboard.panels.averagePosture.expectedWeight', {
              value: levelInfo.weight,
            })}
          </span>
        </p>
        <p className="flex flex-col items-end gap-1">
          <span className="text-caption-xs-meidum h-[26px] rounded-full bg-yellow-50 px-2 py-1 whitespace-nowrap text-yellow-500">
            {levelInfo.name}
          </span>
          <img
            src={levelInfo.character}
            alt={levelInfo.name}
            className="mt-auto max-h-[208px] w-full max-w-[196px] object-contain pb-6"
          />
        </p>
      </div>

      <div className="absolute inset-x-4 bottom-4 flex flex-col">
        <p className="text-caption-body-md-meidum text-yellow text-yellow-100">
          Step. {level}
        </p>
      </div>
    </section>
  )
}
