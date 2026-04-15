import { useEffect } from 'react'
import { useAuthSessionStore } from '@/entities/session'
import { type MeResponse, useAuthUserStore } from '@/entities/user'
import { classifyAuthError } from '@/features/auth/lib/auth-error'
import {
  clearAuthSession,
  readStoredAuthSession,
} from '@/features/auth/lib/session-persistence'
import api, { clearStoredTokens, refreshAccessToken } from '@/shared/api/instance'
import { AUTH_STORAGE_KEYS } from '@/shared/lib/auth'

export function useAuthBootstrap() {
  const markChecking = useAuthSessionStore(state => state.markChecking)
  const markUnauthenticated = useAuthSessionStore(
    state => state.markUnauthenticated,
  )
  const setSession = useAuthSessionStore(state => state.setSession)
  const setUser = useAuthUserStore(state => state.setUser)
  const clearUser = useAuthUserStore(state => state.clearUser)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      markChecking()

      const stored = readStoredAuthSession()

      if (!stored.accessToken || !stored.refreshToken) {
        clearStoredTokens()
        clearAuthSession()
        clearUser()
        markUnauthenticated()
        return
      }

      setSession({
        accessToken: stored.accessToken,
        refreshToken: stored.refreshToken,
        userId: stored.userId,
        userName: stored.userName,
        redirectPath: stored.redirectPath,
      })

      try {
        await refreshAccessToken().catch(() => undefined)

        const response = await api.get<MeResponse>('/users/me')

        if (!response.data.success || !response.data.data) {
          throw new Error(
            response.data.message ?? '사용자 정보를 불러오지 못했습니다.',
          )
        }

        if (cancelled) {
          return
        }

        const userId = response.data.data.email ?? null
        const userName = response.data.data.name ?? null
        const accessToken = localStorage.getItem(AUTH_STORAGE_KEYS.accessToken)
        const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken)

        setUser({
          id: userId,
          name: userName,
        })
        setSession({
          status: 'authenticated',
          accessToken,
          refreshToken,
          userId,
          userName,
          hydratedAt: Date.now(),
          lastErrorCode: null,
        })
      } catch (error) {
        if (cancelled) {
          return
        }

        clearAuthSession()
        clearStoredTokens()
        clearUser()
        markUnauthenticated(classifyAuthError(error).code)
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [clearUser, markChecking, markUnauthenticated, setSession, setUser])
}
