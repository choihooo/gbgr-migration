import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthEmailStore } from '@/entities/user'
import { useResendVerificationEmailMutation } from '@/features/auth/api/use-resend-verification-email-mutation'

export function useResendVerification() {
  const { t } = useTranslation()
  const email = useAuthEmailStore(state => state.email)
  const resendMutation = useResendVerificationEmailMutation()
  const [feedbackMessage, setFeedbackMessage] = useState('')

  const handleResend = async () => {
    if (!email) {
      setFeedbackMessage(t('auth.signup.missingEmail'))
      return
    }

    try {
      const result = await resendMutation.mutateAsync({
        email,
        callbackUrl: `${window.location.origin}/auth/verify-callback`,
      })

      if (!result.success) {
        throw new Error(result.message ?? t('auth.signup.resendFailed'))
      }

      setFeedbackMessage(
        t('auth.signup.verificationResent', {
          email,
        }),
      )
    } catch (error) {
      setFeedbackMessage(
        error instanceof Error ? error.message : t('auth.signup.resendFailed'),
      )
    }
  }

  return {
    email,
    feedbackMessage,
    isResending: resendMutation.isPending,
    handleResend,
  }
}
