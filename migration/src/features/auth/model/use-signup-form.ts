import { type ChangeEvent, type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthEmailStore } from '@/entities/user'
import {
  useCheckEmailMutation,
  useSignupMutation,
} from '@/features/auth/api/use-signup-mutation'
import {
  type SignupFormValues,
  validateEmail,
  validateName,
  validatePassword,
} from '@/features/auth/lib/validators'
import { buildAuthVerifyCallbackUrl } from '@/features/auth/lib/callback-url'

interface DuplicateCheckState {
  message: string
  success: boolean | null
}

const initialValues: SignupFormValues = {
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
}

export function useSignupForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setEmail } = useAuthEmailStore()
  const checkEmailMutation = useCheckEmailMutation()
  const signupMutation = useSignupMutation()
  const [formValues, setFormValues] = useState<SignupFormValues>(initialValues)
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheckState>({
    message: '',
    success: null,
  })

  const emailError = validateEmail(formValues.email)
  const passwordError = formValues.password
    ? validatePassword(formValues.password)
    : ''
  const nameError = formValues.name ? validateName(formValues.name) : ''

  const confirmPasswordMessage = !formValues.confirmPassword
    ? ''
    : formValues.password !== formValues.confirmPassword || passwordError
      ? passwordError || t('auth.signup.confirmPasswordMismatch')
      : t('auth.signup.confirmPasswordMatch')

  const isFormValid =
    !validateEmail(formValues.email) &&
    !validatePassword(formValues.password) &&
    !validateName(formValues.name) &&
    formValues.confirmPassword.length > 0 &&
    formValues.password === formValues.confirmPassword

  const updateField =
    (field: keyof SignupFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value

      setFormValues(previous => ({
        ...previous,
        [field]: nextValue,
      }))

      if (field === 'email' && duplicateCheck.success !== null) {
        setDuplicateCheck({ message: '', success: null })
      }
    }

  const handleDuplicateCheck = async () => {
    const validationMessage = validateEmail(formValues.email)

    if (validationMessage) {
      setDuplicateCheck({ message: validationMessage, success: false })
      return
    }

    try {
      const result = await checkEmailMutation.mutateAsync(formValues.email)

      const isDuplicate = result.data?.isDuplicate ?? false
      setDuplicateCheck({
        message: isDuplicate
          ? t('auth.signup.duplicateExists')
          : t('auth.signup.duplicateAvailable'),
        success: !isDuplicate,
      })
    } catch {
      setDuplicateCheck({
        message: t('auth.signup.duplicateCheckFailed'),
        success: false,
      })
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (duplicateCheck.success !== true) {
      setDuplicateCheck({
        message: t('auth.signup.duplicateRequired'),
        success: false,
      })
      return
    }

    if (!isFormValid) {
      return
    }

    try {
      const result = await signupMutation.mutateAsync({
        email: formValues.email,
        password: formValues.password,
        name: formValues.name,
        avatar: '',
        callbackUrl: buildAuthVerifyCallbackUrl(),
      })

      if (!result.success) {
        throw new Error(result.message ?? t('auth.signup.submitFailed'))
      }

      setEmail(formValues.email)
      navigate('/auth/verify')
    } catch {
      setDuplicateCheck({
        message: t('auth.signup.submitFailed'),
        success: false,
      })
    }
  }

  return {
    formValues,
    duplicateCheck,
    emailError,
    passwordError,
    nameError,
    confirmPasswordMessage,
    isFormValid,
    isSubmitting: signupMutation.isPending,
    isCheckingDuplicate: checkEmailMutation.isPending,
    updateField,
    handleDuplicateCheck,
    handleSubmit,
  }
}
