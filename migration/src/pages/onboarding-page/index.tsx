/**
 * 카메라 권한 안내 페이지 (/onboarding)
 *
 * 포팅 원본: src/renderer/src/pages/onboarding-page/index.tsx
 */
import { useTranslation } from 'react-i18next'
import CameraIcon from '@/assets/common/icons/camera.svg?react'
import CameraPermissionButton from './components/CameraPermissionButton'

const OnboardingPage = () => {
  const { t } = useTranslation()

  return (
    <main className="hbp:pt-[75px] hbp:h-[calc(100vh-75px)] flex h-[calc(100vh-60px)] flex-col items-center pt-15">
      <div className="hbp:mx-auto hbp:max-w-screen-lg hbp:px-10 relative w-full overflow-visible">
        <section className="hbp:gap-15 hbp:px-20 flex h-full w-full flex-col items-center justify-center gap-12 px-7">
          <CameraIcon />
          <div className="text-title-4xl-bold text-grey-900">
            {t('onboarding.camera.title')}
          </div>
          <div className="text-headline-2xl-regular text-grey-500 text-center">
            {t('onboarding.camera.description')}
            <br />
            {t('onboarding.camera.privacyNote')}
          </div>
          <CameraPermissionButton />
        </section>
      </div>
    </main>
  )
}

export default OnboardingPage
