import { useNavigate } from 'react-router-dom'
import { useAuthSessionStore } from '@/entities/session'
import { clearRedirectPath } from '@/features/auth/lib/session-persistence'

export function getPostAuthRedirectPath(
  redirectPath: string | null | undefined,
) {
  if (
    !redirectPath ||
    redirectPath.startsWith('/auth') ||
    redirectPath === '/widget'
  ) {
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
