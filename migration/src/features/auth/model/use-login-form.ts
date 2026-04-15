import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthSessionStore } from '@/entities/session'
import { useAuthEmailStore, useAuthUserStore } from '@/entities/user'
import { fetchCurrentUser } from '@/features/auth/api/auth-api'
import { useLoginMutation } from '@/features/auth/api/use-login-mutation'
import { classifyAuthError } from '@/features/auth/lib/auth-error'
import {
  clearSavedEmail,
  persistAuthSession,
  persistSavedEmail,
} from '@/features/auth/lib/session-persistence'
import { useAuthRedirect } from '@/features/auth/model/use-auth-redirect'
import { setStoredTokens } from '@/shared/api/instance'

export interface LoginFormValues {
  email: string
  password: string
  saveId: boolean
}

const initialValues: LoginFormValues = {
  email: '',
  password: '',
  saveId: false,
}

export function useLoginForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const loginMutation = useLoginMutation()
  const { navigateAfterAuth } = useAuthRedirect()
  const setSession = useAuthSessionStore(state => state.setSession)
  const setUser = useAuthUserStore(state => state.setUser)
  const setSignupEmail = useAuthEmailStore(state => state.setEmail)
  const [formValues, setFormValues] = useState<LoginFormValues>(initialValues)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail')

    if (!savedEmail) {
      return
    }

    setFormValues(previous => ({
      ...previous,
      email: savedEmail,
      saveId: true,
    }))
  }, [])

  const updateField =
    (field: keyof LoginFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value =
        field === 'saveId' ? event.target.checked : event.target.value

      setFormValues(previous => ({
        ...previous,
        [field]: value,
      }))
      setErrorMessage('')
    }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formValues.email || !formValues.password) {
      setErrorMessage(t('auth.login.missingCredentials'))
      return
    }

    if (formValues.saveId) {
      persistSavedEmail(formValues.email)
    } else {
      clearSavedEmail()
    }

    try {
      const result = await loginMutation.mutateAsync({
        email: formValues.email,
        password: formValues.password,
      })

      if (!result.success || !result.data) {
        throw new Error(result.message ?? t('auth.login.genericFailure'))
      }

      setStoredTokens(result.data.accessToken, result.data.refreshToken)

      const me = await fetchCurrentUser()

      if (!me.success || !me.data) {
        throw new Error(me.message ?? t('auth.login.restoreFailed'))
      }

      const userId = me.data.email
      const userName = me.data.name

      if (!userId || !userName) {
        throw new Error(t('auth.login.restoreFailed'))
      }

      persistAuthSession({
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        userId,
        userName,
      })

      setUser({ id: userId, name: userName })
      setSession({
        status: 'authenticated',
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        userId,
        userName,
        hydratedAt: Date.now(),
        lastErrorCode: null,
      })

      navigateAfterAuth()
    } catch (error) {
      const authError = classifyAuthError(error)

      if (authError.code === 'AUTH-UNVERIFIED') {
        setSignupEmail(formValues.email)
        setErrorMessage(t('auth.login.unverifiedRedirect'))
        navigate('/auth/verify', { replace: true })
        return
      }

      if (authError.code === 'AUTH-101' || authError.code === 'AUTH-102') {
        setErrorMessage(t('auth.login.sessionExpired'))
        return
      }

      if (authError.code === 'AUTH-INVALID-CREDENTIALS') {
        setErrorMessage(t('auth.login.invalidCredentials'))
        return
      }

      setErrorMessage(authError.message || t('auth.login.genericFailure'))
    }
  }

  return {
    formValues,
    errorMessage,
    isSubmitting: loginMutation.isPending,
    updateField,
    handleSubmit,
  }
}
