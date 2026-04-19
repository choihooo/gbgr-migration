import axios, { type AxiosError, type AxiosInstance } from 'axios'
import { useAuthSessionStore } from '@/entities/session/model/use-auth-session-store'
import { useAuthUserStore } from '@/entities/user'
import { clearAuthSession } from '@/features/auth/lib/session-persistence'
import { AUTH_STORAGE_KEYS } from '@/shared/lib/auth'

interface RefreshResponse {
  success: boolean
  code?: string
  message?: string | null
  data?: {
    accessToken: string
    refreshToken: string
  }
}

type RetriableConfig = {
  _retry?: boolean
}

const DEFAULT_API_BASE_URL = 'https://api.bugi.co.kr'

const baseURL = (
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
).replace(/\/+$/, '')

export const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

/** refresh 재시도에서 제외할 인증 관련 엔드포인트 */
const NON_RETRYABLE_PATHS = [
  '/auth/login',
  '/auth/check-email',
  '/auth/verify-email',
  '/auth/resend-verification-email',
  '/auth/signup',
  '/auth/refresh',
]

function isNonRetryablePath(url?: string): boolean {
  if (!url) return false
  const path = url.replace(baseURL, '').split('?')[0]
  return NON_RETRYABLE_PATHS.some((p) => path.startsWith(p))
}

export function clearStoredTokens() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken)
  localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken)
  delete api.defaults.headers.common.Authorization
}

export function setStoredTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken)
  localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, refreshToken)
  api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
}

function resetAuthRuntimeState(errorCode?: string) {
  clearStoredTokens()
  clearAuthSession()
  useAuthUserStore.getState().clearUser()
  useAuthSessionStore.getState().markUnauthenticated(errorCode)
}

let refreshPromise: Promise<void> | null = null

export async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken)

    if (!refreshToken) {
      throw new Error('Refresh token not found')
    }

    const { data } = await axios.post<RefreshResponse>(
      `${baseURL}/auth/refresh`,
      { refreshToken },
      { withCredentials: true },
    )

    if (
      data.code?.toUpperCase() === 'AUTH-102' ||
      !data.success ||
      !data.data
    ) {
      const err = new Error(data.message ?? 'Refresh token expired') as Error & {
        code: string
      }
      err.code = data.code?.toUpperCase() ?? 'AUTH-102'
      throw err
    }

    setStoredTokens(data.data.accessToken, data.data.refreshToken)
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem(AUTH_STORAGE_KEYS.accessToken)

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosError['config'] &
      RetriableConfig

    if (!originalRequest) {
      return Promise.reject(error)
    }

    if (isNonRetryablePath(originalRequest.url)) {
      return Promise.reject(error)
    }

    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true

      try {
        await refreshAccessToken()

        const nextAccessToken = localStorage.getItem(
          AUTH_STORAGE_KEYS.accessToken,
        )

        if (nextAccessToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`
        }

        return api(originalRequest)
      } catch (refreshError) {
        const errorCode =
          refreshError instanceof Error && 'code' in refreshError
            ? (refreshError as Error & { code: string }).code
            : undefined

        // 실제 AUTH-102(리프레시 토큰 만료)일 때만 세션 초기화
        if (errorCode === 'AUTH-102') {
          resetAuthRuntimeState('AUTH-102')
        }

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default api
