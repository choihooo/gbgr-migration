/**
 * @legacy src/renderer/src/app/layouts/Layout.tsx
 */
import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuthSessionStore } from '@/entities/session/model/use-auth-session-store'
import { Header } from '@/features/layout/ui/Header'

function RootLayout() {
  const location = useLocation()
  const authStatus = useAuthSessionStore(s => s.status)
  const isAuthenticated = authStatus === 'authenticated'
  const isWidgetRoute = location.pathname.startsWith('/widget')
  const shouldShowGlobalHeader =
    isAuthenticated &&
    !location.pathname.startsWith('/main') &&
    !isWidgetRoute

  return (
    <div
      className={
        shouldShowGlobalHeader
          ? 'hbp:pt-[75px] min-h-screen pt-15'
          : 'min-h-screen'
      }
    >
      {shouldShowGlobalHeader && <Header />}
      <Suspense fallback={<div>Loading...</div>}>
        <Outlet />
      </Suspense>
    </div>
  )
}

export default RootLayout
