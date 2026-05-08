import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/app/providers/auth-provider'
import { AppI18nProvider } from '@/app/providers/i18n-provider'
import { ThemeProvider } from '@/app/providers/theme-provider'
import { router } from '@/shared/config/router'
import '@/shared/lib/i18n'
import { initDeepLinkListener } from '@/shared/lib/deep-link'

function AppProvider() {
  useEffect(() => {
    let cleanup: (() => void) | undefined

    void initDeepLinkListener(router).then(unlisten => {
      cleanup = unlisten
    })

    return () => {
      cleanup?.()
    }
  }, [])

  return (
    <AppI18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </AppI18nProvider>
  )
}

export default AppProvider
