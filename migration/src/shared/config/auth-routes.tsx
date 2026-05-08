import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthSessionStore } from '@/entities/session/model/use-auth-session-store'
import { persistRedirectPath } from '@/features/auth/lib/session-persistence'
import { getPostAuthRedirectPath } from '@/features/auth/model/use-auth-redirect'
import { AUTH_STORAGE_KEYS } from '@/shared/lib/auth'
import { getCalibrationGateState } from '@/shared/lib/calibration-gate'

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

  const userId = localStorage.getItem(AUTH_STORAGE_KEYS.userId)
  const gateState = getCalibrationGateState(userId)

  if (gateState === 'initial_required') {
    return <Navigate to="/onboarding/init" replace />
  }

  if (gateState === 'reset_requested') {
    return <Navigate to="/onboarding/calibration" replace />
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
