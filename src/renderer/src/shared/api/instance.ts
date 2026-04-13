import { clearAnalyticsFlags } from '@shared/lib/analytics'
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from 'axios'

interface RefreshResponse {
  timestamp: string
  success: boolean
  data: {
    accessToken: string
    refreshToken: string
  }
  code: string
  message: string | null
}

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL as string,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

const clearAuthTokens = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  // GA 플래그 클린업 (자동 로그아웃 시나리오)
  clearAnalyticsFlags()
}

type RetriableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean
  _authCodeRetried?: boolean
}

let refreshPromise: Promise<void> | null = null

/**
 * 리프레시 토큰으로 액세스 토큰 재발급
 */
const doRefreshAccessToken = async (): Promise<void> => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) {
    throw new Error('Refresh token not found')
  }

  try {
    const { data: newToken } = await axios.post<RefreshResponse>(
      `${import.meta.env.VITE_BASE_URL}/auth/refresh`,
      { refreshToken },
      { withCredentials: true },
    )

    // AUTH-102 코드인 경우 유효하지 않은 리프레시 토큰
    if (newToken.code?.toUpperCase() === 'AUTH-102') {
      throw new Error('Invalid refresh token')
    }

    if (!newToken.success || !newToken.data) {
      throw new Error('Refresh token expired')
    }

    // 새로 발급 받은 토큰 저장
    const newAccessToken = newToken.data.accessToken
    const newRefreshToken = newToken.data.refreshToken

    localStorage.setItem('accessToken', newAccessToken)
    localStorage.setItem('refreshToken', newRefreshToken)

    api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
  } catch (error) {
    // AUTH-102 에러를 명시적으로 처리
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as { code?: string }
      if (errorData.code?.toUpperCase() === 'AUTH-102') {
        throw new Error('Invalid refresh token')
      }
    }
    throw error
  }
}

const refreshAccessToken = async (): Promise<void> => {
  if (!refreshPromise) {
    refreshPromise = doRefreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

api.interceptors.request.use(
  config => {
    const accessToken = localStorage.getItem('accessToken')
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  async response => {
    // 200 OK 응답이지만 토큰 관련 에러 코드인 경우 처리
    const responseData = response.data as {
      code?: string
      success?: boolean
      message?: string
    }

    const errorCode = responseData.code?.toUpperCase()

    // AUTH-102 코드인 경우 유효하지 않은 리프레시 토큰 → 로그아웃 처리
    if (errorCode === 'AUTH-102') {
      clearAuthTokens()
      window.location.href = '/auth/login'
      throw new Error(responseData.message || 'Invalid refresh token')
    }

    // AUTH-101 코드인 경우 토큰 만료로 처리 (대소문자 구분 없음)
    if (errorCode === 'AUTH-101') {
      const originalRequest = response.config as RetriableRequestConfig
      if (originalRequest._authCodeRetried) {
        clearAuthTokens()
        window.location.href = '/auth/login'
        throw new Error(responseData.message || 'Session expired')
      }
      originalRequest._authCodeRetried = true

      try {
        // 리프레시 토큰으로 재발급 시도
        await refreshAccessToken()

        // 재발급 성공 시 원래 요청을 새 토큰으로 재시도
        const newAccessToken = localStorage.getItem('accessToken')
        if (newAccessToken && originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
        }
        return api(originalRequest)
      } catch {
        // 리프레시 토큰도 만료되거나 유효하지 않은 경우 로그아웃 처리
        clearAuthTokens()
        window.location.href = '/auth/login'
        throw new Error(responseData.message || 'Session expired')
      }
    }

    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined // 무한 요청 방지
    if (!originalRequest) {
      return Promise.reject(error)
    }

    /* 에러가 401,403일 때  토큰 갱신 */
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true
      try {
        await refreshAccessToken()

        // 재발급 성공 시 원래 요청을 새 토큰으로 재시도
        const newAccessToken = localStorage.getItem('accessToken')
        if (newAccessToken) {
          api.defaults.headers.common['Authorization'] =
            `Bearer ${newAccessToken}`
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] =
              `Bearer ${newAccessToken}`
          }
        }

        return api(originalRequest)
      } catch (_err) {
        clearAuthTokens()
        window.location.href = '/auth/login'
        return Promise.reject(_err)
      }
    }

    return Promise.reject(error)
  },
)

export default api
