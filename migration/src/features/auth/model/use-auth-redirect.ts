import { useNavigate } from 'react-router-dom'
import { useAuthSessionStore } from '@/entities/session/model/use-auth-session-store'
import { clearRedirectPath } from '@/features/auth/lib/session-persistence'
import { AUTH_STORAGE_KEYS } from '@/shared/lib/auth'
import { getCalibrationGateState } from '@/shared/lib/calibration-gate'

export function getPostAuthRedirectPath(
  redirectPath: string | null | undefined,
) {
  if (
    !redirectPath ||
    redirectPath.startsWith('/auth') ||
    redirectPath === '/widget'
  ) {
    const userId = localStorage.getItem(AUTH_STORAGE_KEYS.userId)
    const gateState = getCalibrationGateState(userId)
    if (gateState === 'initial_required') return '/onboarding/init'
    if (gateState === 'reset_requested') return '/onboarding/calibration'

    return '/main'
  }

  return redirectPath
}

export function useAuthRedirect() {
  const navigate = useNavigate()
  const redirectPath = useAuthSessionStore(state => state.redirectPath)
  const clearStoredRedirectPath = useAuthSessionStore(
    state => state.clearRedirectPath,
  )

  return {
    getPostAuthRedirectPath,
    navigateAfterAuth(path?: string | null) {
      const target = getPostAuthRedirectPath(path ?? redirectPath)
      clearStoredRedirectPath()
      clearRedirectPath()
      navigate(target, { replace: true })
    },
  }
}
