import { type ReactNode, useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import { i18n, normalizeLanguage } from '@/shared/lib/i18n'

interface I18nProviderProps {
  children: ReactNode
}

export function AppI18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    const applyLanguageToDocument = (language: string) => {
      document.documentElement.lang = normalizeLanguage(language)
      document.title = i18n.t('app.name', { lng: language })

      if ('__TAURI_INTERNALS__' in window) {
        void import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
          void getCurrentWindow().setTitle(
            i18n.t('app.name', { lng: language }),
          )
        })
      }
    }

    applyLanguageToDocument(i18n.resolvedLanguage ?? i18n.language)
    i18n.on('languageChanged', applyLanguageToDocument)

    return () => {
      i18n.off('languageChanged', applyLanguageToDocument)
    }
  }, [])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
