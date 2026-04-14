import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useResendVerification } from '@/features/auth/model/use-resend-verification'
import { AuthPageShell } from '@/features/auth/ui/shared/AuthPageShell'
import { EmailHeroSection } from '@/features/auth/ui/signup/components/EmailHeroSection'
import { ResendSection } from '@/features/auth/ui/signup/components/ResendSection'
import { Button } from '@/shared/ui/button'

function EmailVerificationPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { feedbackMessage, handleResend, isResending } = useResendVerification()

  return (
    <AuthPageShell>
      <EmailHeroSection />
      <Button
        onClick={() => navigate('/auth/login')}
        text={t('auth.login.submit')}
        className="text-body-xl-medium h-[49px] w-[440px]"
      />
      <ResendSection onClick={handleResend} disabled={isResending} />
      {feedbackMessage ? (
        <p className="text-caption-sm-regular text-success mt-4">
          {feedbackMessage}
        </p>
      ) : null}
    </AuthPageShell>
  )
}

export default EmailVerificationPage
