import { useTranslation } from 'react-i18next'

export function ResendEmailHeroSection() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-8">
      <p className="text-title-4xl-bold text-grey-700">
        {t('auth.signup.resendSentTitle')}
      </p>
      <p className="text-headline-2xl-regular text-grey-800 text-center">
        {t('auth.signup.resendSentLine1')}
        <br />
        {t('auth.signup.resendSentLine2')}
      </p>
    </div>
  )
}
