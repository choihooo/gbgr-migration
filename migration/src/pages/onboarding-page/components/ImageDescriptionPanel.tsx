/**
 * 온보딩 소개 5단계 슬라이드 - 이미지/설명 영역
 *
 * 포팅 원본: src/renderer/src/pages/onboarding-page/components/ImageDescriptionPanel.tsx
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import firstDarkImage from '@/assets/onboarding/first_dark_image.png'
import firstImage from '@/assets/onboarding/first_image.png'
import fourthDarkImage from '@/assets/onboarding/fourth_dark_image.png'
import fourthImage from '@/assets/onboarding/fourth_image.png'
import PrevIcon from '@/assets/onboarding/prev_icon.svg?react'
import RockIcon from '@/assets/onboarding/rock_icon.svg?react'
import secondDarkImage from '@/assets/onboarding/second_dark_image.png'
import secondImage from '@/assets/onboarding/second_image.png'
import thirdDarkImage from '@/assets/onboarding/third_dark_image.png'
import thirdImage from '@/assets/onboarding/third_image.png'
import FirstImageDescription from './FirstImageDescription'

const STEP_IMAGES_LIGHT = [
  null,
  firstImage,
  secondImage,
  thirdImage,
  fourthImage,
]
const STEP_IMAGES_DARK = [
  null,
  firstDarkImage,
  secondDarkImage,
  thirdDarkImage,
  fourthDarkImage,
]

interface ImageDescriptionPanelProps {
  currentStep: number
  onPrev: () => void
  direction: 'next' | 'prev'
}

const ImageDescriptionPanel = ({
  currentStep,
  onPrev,
  direction,
}: ImageDescriptionPanelProps) => {
  const { t } = useTranslation()
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  // 이미지 프리로드
  useEffect(() => {
    const allImages = [...STEP_IMAGES_LIGHT, ...STEP_IMAGES_DARK].filter(
      (src): src is string => src !== null,
    )

    allImages.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }, [])

  const stepImages = isDark ? STEP_IMAGES_DARK : STEP_IMAGES_LIGHT
  const stepImage = stepImages[currentStep - 1]

  return (
    <div className="h-full min-w-[894px] flex-1">
      <div className="relative flex h-full flex-col items-center justify-center px-20">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={onPrev}
            className="absolute top-5 left-5 cursor-pointer p-2"
          >
            <PrevIcon className="[&_path:first-child]:fill-grey-25 [&_path:last-child]:stroke-grey-500 hover:[&_path:first-child]:fill-grey-0 [&_path:last-child]:fill-none" />
          </button>
        )}

        <div
          key={currentStep}
          className={`flex aspect-[784/510] w-full max-w-[1010px] items-center p-5 ${direction === 'next' ? 'animate-slide-next' : 'animate-slide-prev'}`}
        >
          {currentStep === 1 ? (
            <FirstImageDescription />
          ) : (
            stepImage && (
              <img
                key={`${currentStep}-${isDark}`}
                src={stepImage}
                alt={`step ${currentStep}`}
                className={`animate-fade-in h-full object-contain ${!isDark ? 'border-grey-100 rounded-[12px] border shadow-[0_0_24px_0_rgba(0,0,0,0.12)]' : ''}`}
                loading="eager"
                fetchPriority="high"
              />
            )
          )}
        </div>

        <p className="text-body-xl-semibold text-grey-300 absolute bottom-6 flex items-center gap-1">
          <RockIcon />
          <span>{t('onboarding.init.privacyNote')}</span>
        </p>
      </div>
    </div>
  )
}

export default ImageDescriptionPanel
