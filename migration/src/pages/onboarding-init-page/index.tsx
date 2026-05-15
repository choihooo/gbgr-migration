/**
 * 온보딩 소개 5단계 슬라이드 페이지
 *
 * 포팅 원본: src/renderer/src/pages/onboarding-init-page/index.tsx
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ImageDescriptionPanel from '@/pages/onboarding-page/components/ImageDescriptionPanel'
import InfoPanel from '@/pages/onboarding-page/components/InfoPanel'

const OnboardingInitPage = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')

  const handlePrev = () => {
    if (currentStep > 1) {
      setDirection('prev')
      setCurrentStep(currentStep - 1)
    }
  }

  const handleNext = () => {
    if (currentStep < 5) {
      setDirection('next')
      setCurrentStep(currentStep + 1)
    } else {
      navigate('/onboarding')
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-60px)] flex-col items-center overflow-x-hidden">
      <div className="relative h-full w-full overflow-visible">
        <section className="flex h-full w-full flex-col items-center xl:flex-row xl:items-stretch">
          <ImageDescriptionPanel
            currentStep={currentStep}
            onPrev={handlePrev}
            direction={direction}
          />
          <InfoPanel
            currentStep={currentStep}
            onNext={handleNext}
            direction={direction}
          />
        </section>
      </div>
    </main>
  )
}

export default OnboardingInitPage
