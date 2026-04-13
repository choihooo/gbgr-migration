import MiniGiraffe from '@assets/widget/mini_giraffe.svg?react'
import MiniTurtle from '@assets/widget/mini_turtle.svg?react'

/* 실시간 자세 판별 */
type PostureState = 0 | 1 | 2 | 3 | 4 | 5 | 6

interface MiniWidgetContentProps {
  posture: PostureState
}

/* 미니 위젯 레이아웃 - 최대 50px 높이에 맞게 가로 배치 */
export function MiniWidgetContent({ posture }: MiniWidgetContentProps) {
  const isGiraffe = [1, 2, 3].includes(posture)
  const gradient = isGiraffe
    ? 'linear-gradient(180deg, var(--color-olive-green) 0.18%, var(--color-success) 99.7%)'
    : 'linear-gradient(180deg, var(--color-coral-red) 0%, var(--color-error) 100%)'

  /* 게이지 비율: 등급별 차등 적용 */
  let gaugeWidth: string
  switch (posture) {
    case 1:
    case 6:
      gaugeWidth = '100%'
      break
    case 2:
    case 5:
      gaugeWidth = '75%'
      break
    case 3:
    case 4:
      gaugeWidth = '50%'
      break
    default: // posture 0
      gaugeWidth = '25%'
      break
  }

  return (
    <div className="bg-grey-100 relative flex w-full items-center rounded-lg transition-colors duration-500 ease-in-out">
      {/* 캐릭터 이미지 영역 - 작게 */}
      <div
        className="h-full w-full rounded-lg transition-all duration-500 ease-in-out"
        style={{ width: gaugeWidth, background: gradient }}
      />
      <div className="absolute flex h-full">
        {isGiraffe ? (
          <MiniGiraffe className="h-full w-full object-contain" />
        ) : (
          <MiniTurtle className="h-full w-full object-contain" />
        )}
      </div>
    </div>
  )
}
