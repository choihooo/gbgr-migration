import { i18n } from '@/shared/lib/i18n'

export interface SignupFormValues {
  email: string
  password: string
  confirmPassword: string
  name: string
}

const passwordPattern =
  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[~`!@#$%^&*()_\-+={[}\]|\\:;"'<>,.?/])[A-Za-z\d~`!@#$%^&*()_\-+={[}\]|\\:;"'<>,.?/]+$/

export function validateEmail(email: string) {
  if (!email) return i18n.t('auth.validation.emailRequired')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return i18n.t('auth.validation.emailInvalid')
  }
  return ''
}

export function validatePassword(password: string) {
  if (password.length < 8) return i18n.t('auth.validation.passwordMin')
  if (password.length > 16) return i18n.t('auth.validation.passwordMax')
  if (!passwordPattern.test(password)) {
    return i18n.t('auth.validation.passwordPattern')
  }
  return ''
}

export function validateName(name: string) {
  if (!name) return i18n.t('auth.validation.nameRequired')
  if (name.length > 10) return i18n.t('auth.validation.nameMax')
  if (/\s/.test(name)) return i18n.t('auth.validation.nameNoWhitespace')
  return ''
}
