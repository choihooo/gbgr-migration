import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthSessionStore } from '@/entities/session/model/use-auth-session-store'
import { persistRedirectPath } from '@/features/auth/lib/session-persistence'
import { getPostAuthRedirectPath } from '@/features/auth/model/use-auth-redirect'

function AuthPendingScreen() {
  return <div className="min-h-screen bg-grey-0" />
}

export function ProtectedRoute() {
  const location = useLocation()
  const status = useAuthSessionStore(state => state.status)
  const setRedirectPath = useAuthSessionStore(state => state.setRedirectPath)

  useEffect(() => {
    if (status !== 'unauthenticated') {
      return
    }

    const nextPath = `${location.pathname}${location.search}${location.hash}`
    setRedirectPath(nextPath)
    persistRedirectPath(nextPath)
  }, [
    location.hash,
    location.pathname,
    location.search,
    setRedirectPath,
    status,
  ])

  if (status === 'checking') {
    return <AuthPendingScreen />
  }

  if (status !== 'authenticated') {
    return <Navigate to="/auth/login" replace />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const status = useAuthSessionStore(state => state.status)
  const redirectPath = useAuthSessionStore(state => state.redirectPath)

  if (status === 'checking') {
    return <AuthPendingScreen />
  }

  if (status === 'authenticated') {
    return <Navigate to={getPostAuthRedirectPath(redirectPath)} replace />
  }

  return <Outlet />
}
