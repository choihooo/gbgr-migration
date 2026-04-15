/**
 * 온보딩 소개 5단계 슬라이드 - 정보/버튼 영역
 *
 * 포팅 원본: src/renderer/src/pages/onboarding-page/components/InfoPanel.tsx
 */

import { useTranslation } from 'react-i18next'
import FifthIcon from '@/assets/onboarding/fifth_progress_icon.svg?react'
import FirstIcon from '@/assets/onboarding/first_progress_icon.svg?react'
import FourthIcon from '@/assets/onboarding/fourth_progress_icon.svg?react'
import SecondIcon from '@/assets/onboarding/second_progress_icon.svg?react'
import ThirdIcon from '@/assets/onboarding/third_progress_icon.svg?react'
import { Button } from '@/shared/ui/button'

const STEP_ICONS = [FirstIcon, SecondIcon, ThirdIcon, FourthIcon, FifthIcon]
const STEP_PROGRESS_KEYS = ['step-1', 'step-2', 'step-3', 'step-4', 'step-5']

interface InfoPanelProps {
  currentStep: number
  onNext: () => void
  direction: 'next' | 'prev'
}

const InfoPanel = ({ currentStep, onNext, direction }: InfoPanelProps) => {
  const { t } = useTranslation()
  const userName = localStorage.getItem('userName') || '사용자'

  const stepData = t(`onboarding.init.steps.${currentStep - 1}`, {
    returnObjects: true,
    userName,
  }) as { keypoint: string; title: string; description: string }

  const StepIcon = STEP_ICONS[currentStep - 1]

  // description을 줄바꿈으로 분리
  const descriptionLines = stepData?.description
    ? stepData.description.split('\n')
    : []

  return (
    <div className="bg-grey-0 flex h-full min-w-[386px] flex-col justify-between p-10 xl:w-[clamp(386px,calc(386px+(100vw-1280px)*0.5),462px)]">
      <div className="flex flex-col">
        {/* 프로그레스바 */}
        <div className="mb-[91px]">
          <div className="flex gap-1">
            {STEP_PROGRESS_KEYS.map((progressKey, index) => (
              <span
                key={progressKey}
                className={`bg-sementic-brand-primary h-[6px] flex-[1_0_0] rounded-full ${
                  index < currentStep ? 'opacity-100' : 'opacity-20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 설명 부분 */}
        <div
          key={currentStep}
          className={`flex flex-col ${direction === 'next' ? 'animate-slide-next' : 'animate-slide-prev'}`}
        >
          <p className="text-body-md-semibold text-sementic-brand-primary flex justify-between">
            <span>{stepData?.keypoint ?? `Keypoint ${currentStep}`}</span>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50">
              <StepIcon />
            </div>
          </p>
          <p className="mt-4 flex flex-col gap-3">
            <span className="text-headline-3xl-bold text-grey-700">
              {stepData?.title}
            </span>
            {descriptionLines.length > 1 ? (
              <span className="text-body-md-meidum text-grey-400 flex flex-col gap-6">
                {descriptionLines.map(desc => (
                  <span key={`${currentStep}-${desc}`}>{desc}</span>
                ))}
              </span>
            ) : (
              <span className="text-body-md-meidum text-grey-400">
                {stepData?.description}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 버튼 */}
      <Button
        text={
          currentStep === 5
            ? t('onboarding.init.start')
            : t('onboarding.init.next')
        }
        className="h-11"
        onClick={onNext}
      />
    </div>
  )
}

export default InfoPanel
