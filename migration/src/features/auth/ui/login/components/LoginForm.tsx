import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/input-field'
import { ErrorStatusIcon } from '@/shared/ui/icons/status-icons'
import { PasswordField } from './PasswordField'

interface LoginFormValues {
  email: string
  password: string
  saveId: boolean
}

const SAVED_EMAIL_KEY = 'savedEmail'

export function LoginForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [formValues, setFormValues] = useState<LoginFormValues>({
    email: '',
    password: '',
    saveId: false,
  })
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY)

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
      setShowError(false)
    }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formValues.email || !formValues.password) {
      setShowError(true)
      return
    }

    if (formValues.saveId) {
      localStorage.setItem(SAVED_EMAIL_KEY, formValues.email)
    } else {
      localStorage.removeItem(SAVED_EMAIL_KEY)
    }

    // 다음 단계에서 실제 인증 API와 토큰 처리로 대체한다.
    localStorage.setItem('accessToken', 'temporary-auth-token')
    navigate('/main')
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="hbp:w-[550px] hbp:mt-15 mt-12 flex w-[440px] flex-col items-center gap-3"
      >
        <TextField
          type="text"
          placeholder={t('auth.login.emailPlaceholder')}
          value={formValues.email}
          onChange={updateField('email')}
          className="hbp:text-body-lg-regular aspect-[44/6]"
        />

        <PasswordField
          value={formValues.password}
          onChange={updateField('password')}
          hasValue={Boolean(formValues.password)}
        />

        {showError ? (
          <div className="text-caption-sm-regular text-error flex gap-1 self-start">
            <ErrorStatusIcon className="mt-[1px] h-5 w-5 shrink-0" />
            <span>{t('auth.login.missingCredentials')}</span>
          </div>
        ) : null}

        <div className="text-caption-sm-regular hbp:text-body-lg-regular text-grey-400 mt-1 flex w-full justify-start gap-3">
          <label className="hbp:gap-2.5 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={formValues.saveId}
              onChange={updateField('saveId')}
              className="sr-only"
            />
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                formValues.saveId
                  ? 'border-yellow-400 bg-yellow-400 text-check-stroke'
                  : 'border-grey-200 bg-check-fill text-transparent'
              }`}
            >
              <svg
                viewBox="0 0 20 20"
                className="h-5 w-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 10.6906L9 13.5L14.5 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>{t('auth.login.saveId')}</span>
          </label>
        </div>

        <Button
          type="submit"
          text={t('auth.login.submit')}
          size="xl"
          disabled={!formValues.email || !formValues.password}
          className="hbp:text-body-xl-medium h-[49px] w-full"
        />
      </form>

      <div className="text-grey-300 text-caption-sm-regular hbp:text-body-lg-regular hbp:gap-[25px] hbp:mt-10 mt-8 flex flex-row gap-5">
        <button
          type="button"
          onClick={() => navigate('/auth/signup')}
          className="cursor-pointer"
        >
          {t('auth.login.signup')}
        </button>
        <span>|</span>
        <button type="button" className="cursor-pointer">
          {t('auth.login.forgotPassword')}
        </button>
      </div>
    </>
  )
}
