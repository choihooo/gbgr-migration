import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthEmailStore } from '@/entities/user'
import { useVerifyEmailMutation } from '@/features/auth/api/use-verify-email-mutation'

export function useEmailVerificationCallback(token: string | null) {
  const { t } = useTranslation()
  const clearEmail = useAuthEmailStore(state => state.clearEmail)
  const verifyMutation = useVerifyEmailMutation()
  const processedTokenRef = useRef<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setErrorMessage(t('auth.signup.callbackMissingToken'))
      return
    }

    if (processedTokenRef.current === token) {
      return
    }

    processedTokenRef.current = token

    void verifyMutation
      .mutateAsync({ token })
      .then(result => {
        if (!result.success) {
          throw new Error(result.message ?? t('auth.signup.callbackFailed'))
        }

        clearEmail()
        setErrorMessage('')
      })
      .catch(error => {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : t('auth.signup.callbackFailed'),
        )
      })
  }, [clearEmail, t, token, verifyMutation])

  return {
    status: verifyMutation.isPending
      ? 'pending'
      : errorMessage
        ? 'error'
        : 'success',
    errorMessage,
  }
}
