import FifthIcon from '@assets/onboarding/fifth_progress_icon.svg?react'
import FirstIcon from '@assets/onboarding/first_progress_icon.svg?react'
import FourthIcon from '@assets/onboarding/fourth_progress_icon.svg?react'
import SecondIcon from '@assets/onboarding/second_progress_icon.svg?react'
import ThirdIcon from '@assets/onboarding/third_progress_icon.svg?react'
import { Button } from '@shared/ui/button'

// 단계별 아이콘
const STEP_ICONS = [FirstIcon, SecondIcon, ThirdIcon, FourthIcon, FifthIcon]

// 단계별 데이터 (userName은 컴포넌트에서 주입)
const getStepData = (userName: string) => [
  {
    title: '바른 자세 분석',
    description: `이제부터 ${userName}님이 일하는 동안 웹캠을 통해 실시간으로 자세를 분석해 드릴게요.`,
  },
  {
    title: '실시간 위젯 피드백',
    description:
      '화면 상단 작은 위젯의 기린과 거북이가 실시간 자세 피드백을 제공해요.',
  },
  {
    title: '데이터로 보는 대시보드',
    description: [
      '주간, 월간 단위의 개인화 통계와 패턴 분석을 통해 나도 몰랐던 나의 자세 습관을 발견할 수 있어요.',
      'AI가 제안하는 맞춤형 팁을 통해 자발적이고 지속적인 변화를 느껴보세요.',
    ],
  },
  {
    title: '스마트 알림',
    description:
      '자세가 심하게 나빠지거나 스트레칭이 필요한 순간을 AI가 정확하게 포착하여 똑똑하게 알려드려요.',
  },
  {
    title: '즐거운 게임을 통한 자세 교정',
    description: [
      '건강 관리는 지루하다는 편견을 깨기 위해 게이미페케이션 요소를 넣었어요.',
      '바른 자세를 유지할수록 나의 캐릭터가 레벨업하고 더 빨리 달려 보상을 받을 수 있어요.',
    ],
  },
]

interface InfoPanelProps {
  currentStep: number
  onNext: () => void
  direction: 'next' | 'prev'
}

const InfoPanel = ({ currentStep, onNext, direction }: InfoPanelProps) => {
  const userName = localStorage.getItem('userName') || '사용자'
  const STEP_DATA = getStepData(userName)
  const stepData = STEP_DATA[currentStep - 1]
  const StepIcon = STEP_ICONS[currentStep - 1]

  return (
    <div className="bg-grey-0 flex h-full min-w-[386px] flex-col justify-between p-10 xl:w-[clamp(386px,calc(386px+(100vw-1280px)*0.5),462px)]">
      <div className="flex flex-col">
        {/* 현재 단계 프로그레스바 */}
        <div className="mb-[91px]">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <span
                key={index}
                className={`bg-sementic-brand-primary h-[6px] flex-[1_0_0] rounded-full ${
                  index < currentStep ? 'opacity-100' : 'opacity-20'
                }`}
              />
            ))}
          </div>
        </div>

        {/*설명 부분 */}
        <div
          key={currentStep}
          className={`flex flex-col ${direction === 'next' ? 'animate-slide-next' : 'animate-slide-prev'}`}
        >
          {/* Keypoint */}
          <p className="text-body-md-semibold text-sementic-brand-primary flex justify-between">
            <span>Keypoint {currentStep}</span>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50">
              <StepIcon />
            </div>
          </p>
          {/* 서비스 설명 */}
          <p className="mt-4 flex flex-col gap-3">
            <span className="text-headline-3xl-bold text-grey-700">
              {stepData.title}
            </span>
            {Array.isArray(stepData.description) ? (
              <span className="text-body-md-meidum text-grey-400 flex flex-col gap-6">
                {stepData.description.map((desc, index) => (
                  <span key={index}>{desc}</span>
                ))}
              </span>
            ) : (
              <span className="text-body-md-meidum text-grey-400">
                {stepData.description}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 버튼 부분 */}
      <Button
        text={currentStep === 5 ? '시작하기' : '다음'}
        className="h-11"
        onClick={onNext}
      />
    </div>
  )
}

export default InfoPanel
