import { useTranslation } from 'react-i18next'
import { useResendVerification } from '@/features/auth/model/use-resend-verification'
import { AuthPageShell } from '@/features/auth/ui/shared/AuthPageShell'
import { ResendEmailHeroSection } from '@/features/auth/ui/signup/components/ResendEmailHeroSection'
import { ResendSection } from '@/features/auth/ui/signup/components/ResendSection'
import { VerifyAction } from '@/features/auth/ui/signup/components/VerifyAction'

function ResendVerificationPage() {
  const { t } = useTranslation()
  const { email, feedbackMessage, handleResend, isResending } =
    useResendVerification()

  return (
    <AuthPageShell>
      <ResendEmailHeroSection />
      <VerifyAction email={email || t('auth.signup.missingEmail')} />
      <ResendSection onClick={handleResend} disabled={isResending} />
      {feedbackMessage ? (
        <p className="text-caption-sm-regular text-success mt-4">
          {feedbackMessage}
        </p>
      ) : null}
    </AuthPageShell>
  )
}

export default ResendVerificationPage
