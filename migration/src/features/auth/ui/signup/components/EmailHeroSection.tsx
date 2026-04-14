import { useTranslation } from 'react-i18next'
import emailIcon from '@/assets/auth/email_icon.svg'
import { useAuthEmailStore } from '@/entities/user'

export function EmailHeroSection() {
  const { t } = useTranslation()
  const email = useAuthEmailStore(state => state.email)

  return (
    <div className="mb-12 flex flex-col items-center gap-[46px]">
      <img src={emailIcon} alt="" className="ml-5 h-[200px] w-[200px]" />
      <div className="flex flex-col items-center justify-center gap-6">
        <p className="text-title-4xl-bold text-grey-700">
          {t('auth.signup.verificationTitle')}
        </p>
        <p className="text-headline-2xl-regular text-grey-800 text-center">
          {t('auth.signup.verificationLine1Prefix')}
          <span className="text-headline-2xl-semibold text-yellow-500">
            {` ${email || t('auth.signup.verificationHighlightFallback')}`}
          </span>
          {t('auth.signup.verificationLine1Suffix')}
          <br />
          {`${t('auth.signup.verificationLine2Prefix')} `}
          <span className="text-headline-2xl-semibold">
            {t('auth.signup.verificationLine2Highlight')}
          </span>
          {t('auth.signup.verificationLine2Suffix')}
        </p>
      </div>
    </div>
  )
}
