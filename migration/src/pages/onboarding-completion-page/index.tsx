/**
 * 보정 완료 페이지 (/onboarding/completion)
 *
 * 포팅 원본: src/renderer/src/pages/onboarding-completion-page/index.tsx
 */

import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import CompletionCharacter from '@/assets/common/icons/completion.svg?react'
import { useCreateSessionMutation } from '@/entities/session'
import { Button } from '@/shared/ui/button'

const OnboardingCompletionPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { mutate: createSession, isPending } = useCreateSessionMutation()

  const handleStart = () => {
    createSession(undefined, {
      onSuccess: () => {
        navigate('/main')
      },
    })
  }

  return (
    <main className="hbp:h-[calc(100vh-75px)] flex h-[calc(100vh-60px)] flex-col items-center">
      <div className="relative flex w-full flex-col items-center justify-center px-7">
        {/* 캐릭터 영역 */}
        <CompletionCharacter className="labtop:w-[560px] labtop:h-[560px] h-[415px] w-[415px]" />

        {/* 텍스트 영역 */}
        <div className="mb-12 flex flex-col items-center gap-4">
          <h1 className="text-title-4xl-bold text-grey-700">
            {t('onboarding.completion.title')}
          </h1>
          <p className="text-headline-2xl-regular text-grey-500 text-center">
            {t('onboarding.completion.description')}
          </p>
        </div>

        {/* 버튼 */}
        <div className="pb-30">
          <Button
            variant="primary"
            size="xl"
            className="w-[440px]"
            text={
              isPending
                ? t('onboarding.completion.creatingSession')
                : t('onboarding.completion.button')
            }
            onClick={handleStart}
            disabled={isPending}
          />
        </div>
      </div>
    </main>
  )
}

export default OnboardingCompletionPage
