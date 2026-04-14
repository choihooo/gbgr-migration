/**
 * @legacy src/renderer/src/app/layouts/Layout.tsx
 */
import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '@/features/layout/ui/Header'
import { useAuthSessionStore } from '@/entities/session'

function RootLayout() {
  const location = useLocation()
  const authStatus = useAuthSessionStore((s) => s.status)
  const isAuthenticated = authStatus === 'authenticated'
  const shouldShowGlobalHeader =
    isAuthenticated && !location.pathname.startsWith('/main')

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
