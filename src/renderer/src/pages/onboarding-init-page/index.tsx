import { AnalyticsEvents, GA_STORAGE_KEYS } from '@shared/lib/analytics'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ImageDescriptionPannel from '../onboarding-page/components/ImageDescriptionPanel'
import InfoPanel from '../onboarding-page/components/InfoPanel'

const OnboardinInitPage = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')

  useEffect(() => {
    const onboardingEnterSent = localStorage.getItem(
      GA_STORAGE_KEYS.ONBOARDING_ENTER_SENT,
    )
    if (onboardingEnterSent !== 'true') {
      localStorage.setItem(GA_STORAGE_KEYS.ONBOARDING_ENTER_SENT, 'true')
      AnalyticsEvents.onboardingEnter({ step: 'posture_calibration' })
    }
  }, [])

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
      // 5단계에서 시작하기 클릭 시 카메라 권한 요청 페이지로 이동
      navigate('/onboarding')
    }
  }

  return (
    <main className="flex h-[calc(100vh-60px)] flex-col items-center">
      <div className="relative h-full w-full overflow-visible">
        <section className="flex h-full w-full items-center">
          <ImageDescriptionPannel
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

export default OnboardinInitPage
