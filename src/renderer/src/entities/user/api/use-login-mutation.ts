import api from '@shared/api'
import {
  AnalyticsEvents,
  setAnalyticsUserId,
  validateAndLogUserId,
} from '@shared/lib/analytics'
import {
  canAccessCalibrationFlow,
  markCalibrationInitialRequired,
} from '@shared/lib/calibration-gate'
import { parseErrorMessage } from '@shared/lib/error/parse-error'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import type { LoginInput, LoginResponse } from '../types'

/*로그인 api */
const login = async (data: LoginInput): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>('/auth/login', data)
    const result = response.data

    if (!result.success) {
      throw new Error(result.message || '로그인 실패')
    }

    return result
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as {
        message?: string
        code?: string
      }
      throw new Error(errorData.message || errorData.code || '로그인 실패')
    }
    throw error instanceof Error ? error : new Error('로그인 실패')
  }
}

export const useLoginMutation = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: login,
    onSuccess: async res => {
      console.log('로그인 성공', res)

      /*access Token, refresh Token 저장 */
      localStorage.setItem('accessToken', res.data.accessToken)
      localStorage.setItem('refreshToken', res.data.refreshToken)

      /* 사용자 정보 조회 후 이름 저장 */
      let userId: string | undefined = undefined
      try {
        const userResponse = await api.get('/users/me')
        const payload = userResponse.data as {
          success?: boolean
          data?: { id?: string; userId?: string; name?: string }
        }

        if (payload.success && payload.data?.name) {
          localStorage.setItem('userName', payload.data.name)
        }

        userId = payload.data?.userId ?? payload.data?.id
        if (userId) {
          localStorage.setItem('userId', userId)
          setAnalyticsUserId(userId)
        }
      } catch (error) {
        console.error('사용자 정보 조회 실패:', error)
      }

      // GA login_complete 이벤트 전송
      if (validateAndLogUserId(userId, 'login_complete')) {
        AnalyticsEvents.loginComplete({ user_id: userId })
      }

      const storedUserId = localStorage.getItem('userId')
      const calibrationResult = localStorage.getItem('calibration_result_v1')
      if (!calibrationResult) {
        markCalibrationInitialRequired(storedUserId)
      }
      navigate(
        canAccessCalibrationFlow(storedUserId) ? '/onboarding/init' : '/main',
      )
    },
    onError: (error: unknown) => {
      console.error('로그인 오류:', error)
      alert(parseErrorMessage(error))
    },
  })
}
