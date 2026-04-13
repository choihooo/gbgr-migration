import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthEmailStore } from '@/entities/user'
import { AuthPageShell } from '@/features/auth/ui/shared/AuthPageShell'
import { ResendEmailHeroSection } from '@/features/auth/ui/signup/components/ResendEmailHeroSection'
import { ResendSection } from '@/features/auth/ui/signup/components/ResendSection'
import { VerifyAction } from '@/features/auth/ui/signup/components/VerifyAction'

function ResendVerificationPage() {
  const { t } = useTranslation()
  const email = useAuthEmailStore(state => state.email)
  const [resendCount, setResendCount] = useState(0)

  return (
    <AuthPageShell>
      <ResendEmailHeroSection />
      <VerifyAction email={email || t('auth.signup.missingEmail')} />
      <ResendSection onClick={() => setResendCount(previous => previous + 1)} />
      {resendCount > 0 ? (
        <p className="text-caption-sm-regular text-success mt-4">
          {t('auth.signup.resendSentToast')}
        </p>
      ) : null}
    </AuthPageShell>
  )
}

export default ResendVerificationPage
