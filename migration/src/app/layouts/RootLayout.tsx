/**
 * @legacy src/renderer/src/app/layouts/Layout.tsx
 */
import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '@/features/layout/ui/Header'
import { useAuthSessionStore } from '@/entities/session'

function RootLayout() {
  const authStatus = useAuthSessionStore((s) => s.status)
  const isAuthenticated = authStatus === 'authenticated'

  return (
    <div className={isAuthenticated ? 'hbp:pt-[75px] min-h-screen pt-15' : 'min-h-screen'}>
      {isAuthenticated && <Header />}
      <Suspense fallback={<div>Loading...</div>}>
        <Outlet />
      </Suspense>
    </div>
  )
}

export default RootLayout
