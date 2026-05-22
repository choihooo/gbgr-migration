/**
 * @legacy src/renderer/src/app/layouts/Layout.tsx
 */
import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuthSessionStore } from '@/entities/session/model/use-auth-session-store'
import { Header } from '@/features/layout/ui/Header'
import {
  useAutoStartPostureEngine,
  usePostureEngine,
} from '@/features/posture-engine'
import { cn } from '@/shared/lib/cn'

function RootLayout() {
  const location = useLocation()
  const authStatus = useAuthSessionStore(s => s.status)
  const isAuthenticated = authStatus === 'authenticated'
  const isWidgetRoute = location.pathname.startsWith('/widget')
  const isMainRoute = location.pathname.startsWith('/main')
  const shouldShowGlobalHeader =
    isAuthenticated && !location.pathname.startsWith('/main') && !isWidgetRoute

  usePostureEngine({ active: false })
  useAutoStartPostureEngine(!isWidgetRoute)

  return (
    <div
      className={cn(
        shouldShowGlobalHeader
          ? 'hbp:pt-[75px] min-h-screen pt-15'
          : 'min-h-screen',
        isWidgetRoute ? 'bg-transparent' : 'bg-grey-0 text-grey-1000',
      )}
    >
      {!isWidgetRoute && !isMainRoute && (
        <div
          className="fixed top-0 right-0 left-0 z-50 h-10"
          data-tauri-drag-region
        />
      )}
      {shouldShowGlobalHeader && <Header />}
      <Suspense fallback={<div>Loading...</div>}>
        <Outlet />
      </Suspense>
    </div>
  )
}

export default RootLayout
