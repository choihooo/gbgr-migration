/**
 * 온보딩 소개 1단계 - 환영 메시지 + 캐릭터
 *
 * 포팅 원본: src/renderer/src/pages/onboarding-page/components/FirstImageDescription.tsx
 */

import { useTranslation } from 'react-i18next'
import GiraffeIcon from '@/assets/onboarding/giraffe.svg?react'
import TurtleIcon from '@/assets/onboarding/turtle.svg?react'

const FirstImageDescription = () => {
  const { t } = useTranslation()
  const userName = localStorage.getItem('userName') || '사용자'

  return (
    <div className="relative flex h-full flex-col items-center justify-center">
      <p className="bg-grey-0 text-headline-2xl-semibold text-grey-600 mb-18 h-[81px] w-full max-w-[894px] min-w-[734px] rounded-[24px] p-6">
        {t('onboarding.init.greeting', { userName })}
      </p>
      <div className="flex w-7/10 items-end justify-between">
        <TurtleIcon />
        <GiraffeIcon />
      </div>
    </div>
  )
}

export default FirstImageDescription
