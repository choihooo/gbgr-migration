import completionImage from '@/assets/common/icons/completion.svg'
import { useTranslation } from 'react-i18next'
import { AuthPageShell } from '@/features/auth/ui/shared/AuthPageShell'

function EmailVerificationCallbackPage() {
  const { t } = useTranslation()

  return (
    <AuthPageShell>
      <div className="mb-12 flex flex-col items-center gap-[46px]">
        <div className="flex flex-col items-center justify-center gap-6">
          <img
            src={completionImage}
            alt=""
            className="labtop:w-[560px] labtop:h-[560px] h-[415px] w-[415px]"
          />
          <p className="text-title-4xl-bold text-grey-700">
            {t('auth.signup.callbackTitle')}
          </p>
          <p className="text-headline-2xl-regular text-grey-800 text-center">
            {t('auth.signup.callbackLine1')}
            <br />
            {t('auth.signup.callbackLine2')}
            <br />
            {t('auth.signup.callbackLine3')}
          </p>
        </div>
      </div>
    </AuthPageShell>
  )
}

export default EmailVerificationCallbackPage
