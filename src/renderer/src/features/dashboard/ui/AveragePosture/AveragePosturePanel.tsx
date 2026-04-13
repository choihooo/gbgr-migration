import { useAverageScoreQuery } from '@entities/dashboard'
import { LEVEL_INFO, getLevel } from './levelConfig'

const AveragePosturePanel = () => {
  const { data, isLoading } = useAverageScoreQuery()
  const score = data?.data.score ?? 0
  const level = getLevel(score)
  const levelInfo = LEVEL_INFO[level - 1]

  const isTurtle = level <= 2

  return (
    <div
      className={`relative h-full w-full rounded-3xl p-4 ${
        isTurtle
          ? 'bg-[image:var(--color-turtle-gradient)]'
          : 'bg-[image:var(--color-average-score)]'
      }`}
    >
      <div className="items center flex h-full justify-between">
        <p className="text-caption-sm-medium flex min-w-[120px] flex-col text-yellow-100">
          <span>평균 자세 점수</span>
          <span className="text-title-4xl-bold text-grey-0 mb-4">
            {isLoading ? '-' : `${score}점`}
          </span>
          <span className="text-caption-xs-meidum whitespace-nowrap text-yellow-50">
            목 평균 기울기 {levelInfo.tilt}
            <br />
            예상 하중 {levelInfo.weight}
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
    </div>
  )
}

export default AveragePosturePanel
