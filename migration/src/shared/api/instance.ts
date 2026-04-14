import axios, { type AxiosError, type AxiosInstance } from 'axios'
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
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_BASE_URL ??
  DEFAULT_API_BASE_URL
).replace(/\/+$/, '')

export const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function clearStoredTokens() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken)
  localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken)
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
      throw new Error(data.message ?? 'Refresh token expired')
    }

    localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, data.data.accessToken)
    localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, data.data.refreshToken)
    api.defaults.headers.common.Authorization = `Bearer ${data.data.accessToken}`
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
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosError['config'] &
      RetriableConfig

    if (!originalRequest) {
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
        clearStoredTokens()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default api
