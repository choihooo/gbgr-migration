import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/app/providers/auth-provider'
import { AppI18nProvider } from '@/app/providers/i18n-provider'
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
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </AppI18nProvider>
  )
}

export default AppProvider
