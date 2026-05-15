import { invoke } from '@tauri-apps/api/core'
import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
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

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

type ApiBodyError = {
  success?: boolean
  code?: string
  message?: string | null
}

const DEFAULT_API_BASE_URL = 'https://api.bugi.co.kr'

const baseURL = (
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
).replace(/\/+$/, '')

const isTauriRuntime =
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

interface TauriApiResponse {
  status: number
  statusText: string
  headers: Array<[string, string]>
  data: unknown
}

function parseRequestBody(data: unknown) {
  if (typeof data !== 'string') {
    return data
  }

  try {
    return JSON.parse(data) as unknown
  } catch {
    return data
  }
}

/** Rust command 기반 커스텀 Axios 어댑터 */
async function tauriAdapter(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse> {
  const url =
    config.baseURL && config.url && !config.url.startsWith('http')
      ? `${config.baseURL}${config.url}`
      : (config.url ?? '')

  const headers: Record<string, string> = {}
  if (config.headers) {
    for (const [key, value] of Object.entries(config.headers)) {
      if (typeof value === 'string') {
        headers[key] = value
      }
    }
  }

  const method = (config.method ?? 'GET').toUpperCase()

  const commandResponse = await invoke<TauriApiResponse>('api_request', {
    request: {
      method,
      url,
      headers: Object.entries(headers),
      body: parseRequestBody(config.data),
    },
  })

  const response: AxiosResponse = {
    data: commandResponse.data,
    status: commandResponse.status,
    statusText: commandResponse.statusText,
    headers: Object.fromEntries(commandResponse.headers),
    config,
  }

  const validateStatus =
    config.validateStatus ??
    api.defaults.validateStatus ??
    axios.defaults.validateStatus

  if (!validateStatus || validateStatus(response.status)) {
    return response
  }

  throw new AxiosError(
    `Request failed with status code ${response.status}`,
    AxiosError.ERR_BAD_RESPONSE,
    config,
    undefined,
    response,
  )
}

export const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  ...(isTauriRuntime ? { adapter: tauriAdapter } : {}),
})

/** refresh 재시도에서 제외할 인증 관련 엔드포인트 */
const NON_RETRYABLE_PATHS = [
  '/auth/login',
  '/auth/check-email',
  '/auth/verify-email',
  '/auth/resend-verification-email',
  '/auth/signup',
  '/auth/sign-up',
  '/auth/refresh',
]

export function isNonRetryablePath(url?: string): boolean {
  if (!url) return false
  const path = url.replace(baseURL, '').split('?')[0]
  return NON_RETRYABLE_PATHS.some(p => path.startsWith(p))
}

function readAuthErrorCodeFromBody(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const payload = data as ApiBodyError
  const code = payload.code?.toUpperCase()
  if (!code) {
    return null
  }

  if (
    payload.success === false &&
    (code === 'AUTH-101' || code === 'AUTH-102')
  ) {
    return code
  }

  return null
}

async function retryWithRefresh(
  originalRequest: RetriableConfig,
  errorCode?: string | null,
) {
  try {
    await refreshAccessToken()

    const nextAccessToken = localStorage.getItem(AUTH_STORAGE_KEYS.accessToken)

    if (nextAccessToken && originalRequest.headers) {
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`
    }

    return api(originalRequest)
  } catch (refreshError) {
    resetAuthRuntimeState(
      errorCode ??
        (refreshError instanceof Error && 'code' in refreshError
          ? ((refreshError as Error & { code?: string }).code ?? undefined)
          : undefined),
    )

    throw refreshError
  }
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

    const { data } = await api.post<RefreshResponse>('/auth/refresh', {
      refreshToken,
    })

    if (
      data.code?.toUpperCase() === 'AUTH-102' ||
      !data.success ||
      !data.data
    ) {
      const err = new Error(
        data.message ?? 'Refresh token expired',
      ) as Error & {
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

api.interceptors.request.use(config => {
  const accessToken = localStorage.getItem(AUTH_STORAGE_KEYS.accessToken)

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

api.interceptors.response.use(
  async response => {
    const originalRequest = response.config as RetriableConfig
    const authErrorCode = readAuthErrorCodeFromBody(response.data)

    if (!authErrorCode) {
      return response
    }

    if (!originalRequest || isNonRetryablePath(originalRequest.url)) {
      resetAuthRuntimeState(authErrorCode)
      throw new Error(
        (response.data as ApiBodyError).message ?? '인증이 만료되었습니다.',
      )
    }

    if (originalRequest._retry) {
      resetAuthRuntimeState(authErrorCode)
      throw new Error(
        (response.data as ApiBodyError).message ?? '인증이 만료되었습니다.',
      )
    }

    originalRequest._retry = true
    return retryWithRefresh(originalRequest, authErrorCode)
  },
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
      return retryWithRefresh(originalRequest)
    }

    return Promise.reject(error)
  },
)

export default api
