import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import {
  defaultLanguage,
  resources,
  supportedLanguages,
  type AppLanguage,
} from './resources'

export const I18N_LANGUAGE_STORAGE_KEY = 'appLanguage'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: defaultLanguage,
    supportedLngs: [...supportedLanguages],
    react: {
      useSuspense: false,
    },
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: I18N_LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
  })

export function normalizeLanguage(language?: string | null): AppLanguage {
  const normalized = language?.split('-')[0]

  if (normalized && supportedLanguages.includes(normalized as AppLanguage)) {
    return normalized as AppLanguage
  }

  return defaultLanguage
}

export function changeAppLanguage(language: AppLanguage) {
  return i18n.changeLanguage(language)
}

export { i18n }
