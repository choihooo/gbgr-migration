import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthEmailStore } from '@/entities/user'
import {
  type SignupFormValues,
  validateEmail,
  validateName,
  validatePassword,
} from '@/features/auth/lib/validators'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/input-field'
import {
  ErrorStatusIcon,
  SuccessStatusIcon,
} from '@/shared/ui/icons/status-icons'
import { PasswordField } from '@/features/auth/ui/login/components/PasswordField'

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

export function SignUpForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setEmail } = useAuthEmailStore()
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

  const handleDuplicateCheck = () => {
    const validationMessage = validateEmail(formValues.email)

    if (validationMessage) {
      setDuplicateCheck({ message: validationMessage, success: false })
      return
    }

    const isDuplicate = formValues.email.toLowerCase() === 'test@gbgr.kr'

    setDuplicateCheck({
      message: isDuplicate
        ? t('auth.signup.duplicateExists')
        : t('auth.signup.duplicateAvailable'),
      success: !isDuplicate,
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
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

    setEmail(formValues.email)
    navigate('/auth/verify')
  }

  const emailMessage = emailError || duplicateCheck.message
  const showEmailMessage = Boolean(emailMessage)
  const emailIsSuccess =
    !emailError && duplicateCheck.success === true && duplicateCheck.message

  return (
    <form
      onSubmit={handleSubmit}
      className="hbp:w-[550px] hbp:gap-[75px] flex w-110 flex-col gap-15"
    >
      <div className="hbp:gap-[12.5px] flex w-full flex-col gap-[10px]">
        <label
          htmlFor="email"
          className="text-body-lg-semibold hbp:text-headline-2xl-semibold text-grey-600"
        >
          {t('auth.signup.email')} <span className="text-error">*</span>
        </label>
        <div className="hbp:gap-[12.5px] flex w-full items-center justify-center gap-[10px]">
          <TextField
            id="email"
            type="email"
            placeholder={t('auth.signup.emailPlaceholder')}
            value={formValues.email}
            onChange={updateField('email')}
            className={`hbp:text-body-xl-regular aspect-[338/60] flex-1 ${
              emailError
                ? '!border-error'
                : duplicateCheck.success === true
                  ? '!border-success'
                  : duplicateCheck.success === false
                    ? '!border-error'
                    : ''
            }`}
          />
          <Button
            onClick={handleDuplicateCheck}
            text={t('auth.signup.duplicateCheck')}
            size="sm"
            disabled={duplicateCheck.success === true}
            className="hbp:w-[115px] hbp:h-[50px] hbp:text-body-xl-medium w-[92px] whitespace-nowrap"
          />
        </div>
        {showEmailMessage ? (
          <div
            className={`flex gap-1.5 ${
              emailError || duplicateCheck.success === false
                ? 'text-error'
                : 'text-success'
            }`}
          >
            {emailIsSuccess ? (
              <SuccessStatusIcon className="h-5 w-5 shrink-0" />
            ) : (
              <ErrorStatusIcon className="h-5 w-5 shrink-0" />
            )}
            <p className="text-caption-sm-regular">{emailMessage}</p>
          </div>
        ) : null}
      </div>

      <div className="hbp:gap-1.5 flex flex-col gap-1">
        <label
          htmlFor="password"
          className="text-body-lg-semibold hbp:text-headline-2xl-semibold text-grey-600"
        >
          {t('auth.signup.password')} <span className="text-error">*</span>
        </label>
        <p className="hbp:mb-[7.5px] text-caption-sm-medium hbp:text-body-md-medium text-grey-300 mb-[6px]">
          {t('auth.signup.passwordGuide')}
        </p>
        <PasswordField
          value={formValues.password}
          onChange={updateField('password')}
          hasValue={Boolean(formValues.password)}
          className="mb-2"
        />

        <PasswordField
          value={formValues.confirmPassword}
          onChange={updateField('confirmPassword')}
          hasValue={Boolean(formValues.confirmPassword)}
          placeholder={t('auth.signup.confirmPasswordPlaceholder')}
          className={
            !formValues.confirmPassword
              ? ''
              : !passwordError &&
                  formValues.password === formValues.confirmPassword
                ? '!border-success'
                : '!border-error'
          }
        />

        {confirmPasswordMessage ? (
          <div
            className={`mt-1 flex gap-1.5 ${
              passwordError || formValues.password !== formValues.confirmPassword
                ? 'text-error'
                : 'text-success'
            }`}
          >
            {passwordError || formValues.password !== formValues.confirmPassword ? (
              <ErrorStatusIcon className="h-5 w-5 shrink-0" />
            ) : (
              <SuccessStatusIcon className="h-5 w-5 shrink-0" />
            )}
            <p className="text-caption-sm-regular">{confirmPasswordMessage}</p>
          </div>
        ) : null}
      </div>

      <div className="hbp:gap-1.5 flex flex-col gap-1">
        <label
          htmlFor="name"
          className="text-body-lg-semibold hbp:text-headline-2xl-semibold text-grey-600"
        >
          {t('auth.signup.name')} <span className="text-error">*</span>
        </label>
        <p className="hbp:mb-[7.5px] text-caption-sm-medium hbp:text-body-md-medium text-grey-300 mb-[6px]">
          {t('auth.signup.nameGuide')}
        </p>
        <TextField
          id="name"
          type="text"
          placeholder={t('auth.signup.namePlaceholder')}
          value={formValues.name}
          onChange={updateField('name')}
          className={`hbp:text-body-xl-regular ${
            nameError ? '!border-error' : formValues.name ? '!border-success' : ''
          }`}
        />

        {formValues.name || nameError ? (
          <div
            className={`mt-1 flex items-center gap-1.5 ${
              nameError ? 'text-error' : 'text-success'
            }`}
          >
            {nameError ? (
              <ErrorStatusIcon className="h-5 w-5 shrink-0" />
            ) : (
              <SuccessStatusIcon className="h-5 w-5 shrink-0" />
            )}
            <p className="text-caption-sm-regular">
              {nameError || t('auth.signup.nameAvailable')}
            </p>
          </div>
        ) : null}
      </div>

      <Button
        type="submit"
        text={t('auth.signup.submit')}
        size="xl"
        disabled={!isFormValid}
      />
    </form>
  )
}
