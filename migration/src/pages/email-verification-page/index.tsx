import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthEmailStore } from '@/entities/user'
import { AuthPageShell } from '@/features/auth/ui/shared/AuthPageShell'
import { EmailHeroSection } from '@/features/auth/ui/signup/components/EmailHeroSection'
import { ResendSection } from '@/features/auth/ui/signup/components/ResendSection'
import { Button } from '@/shared/ui/button'

function EmailVerificationPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const email = useAuthEmailStore(state => state.email)
  const [resendCount, setResendCount] = useState(0)

  return (
    <AuthPageShell>
      <EmailHeroSection />
      <Button
        onClick={() => navigate('/auth/login')}
        text={t('auth.login.submit')}
        className="text-body-xl-medium h-[49px] w-[440px]"
      />
      <ResendSection onClick={() => setResendCount(previous => previous + 1)} />
      {resendCount > 0 ? (
        <p className="text-caption-sm-regular text-success mt-4">
          {t('auth.signup.verificationResent', {
            email: email || t('auth.signup.verificationHighlightFallback'),
          })}
        </p>
      ) : null}
    </AuthPageShell>
  )
}

export default EmailVerificationPage
