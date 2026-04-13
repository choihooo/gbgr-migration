import api from '@shared/api'
import {
  AnalyticsEvents,
  GA_STORAGE_KEYS,
  validateAndLogUserId,
} from '@shared/lib/analytics'
import { markCalibrationInitialRequired } from '@shared/lib/calibration-gate'
import { parseErrorMessage } from '@shared/lib/error/parse-error'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import type { ResendVerifyEmailRequest } from '../types'

type VerifyEmailResponse = {
  timestamp?: string
  success: boolean
  code?: string
  message?: string | null
  data?: {
    id?: string
    userId?: string
  }
}

type UseVerifyEmailMutationOptions = {
  redirectTo?: string
}

/*이메일 인증 api*/
const verifyEmail = async (token: string) => {
  try {
    const response = await api.post<VerifyEmailResponse>('/auth/verify-email', {
      token,
    })
    const result = response.data as VerifyEmailResponse

    if (!result.success) {
      throw new Error(result.message || '인증 실패')
    }

    return response.data
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as {
        message?: string
        code?: string
      }
      throw new Error(errorData.message || errorData.code || '인증 실패')
    }
    throw error instanceof Error ? error : new Error('인증 실패')
  }
}

/*이메일 인증 다시 보내기 api*/
const resendVerifyEmail = async (data: ResendVerifyEmailRequest) => {
  try {
    const response = await api.post('/auth/resend-verification-email', {
      ...data,
      callbackUrl: `${window.location.origin}/auth/resend`,
    })

    const result = response.data

    if (!result.success) {
      throw new Error(result.message || '다시 보내기 실패')
    }

    return response.data
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as {
        message?: string
        code?: string
      }
      throw new Error(errorData.message || errorData.code || '다시 보내기 실패')
    }
    throw error instanceof Error ? error : new Error('다시 보내기 실패')
  }
}

export const useVerifyEmailMutation = (
  options?: UseVerifyEmailMutationOptions,
) => {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: verifyEmail,

    onSuccess: data => {
      console.log('이메일 인증 성공:', data)
      const userId: string | undefined =
        (data as VerifyEmailResponse | undefined)?.data?.userId ??
        (data as VerifyEmailResponse | undefined)?.data?.id

      if (!validateAndLogUserId(userId, 'sign_up_complete')) {
        // userId가 없는 경우에도 진행 (userId는 GA 이벤트용 선택적 파라미터)
      }

      const tsRaw = (data as VerifyEmailResponse | undefined)?.timestamp
      const signupCompletedAt = tsRaw ? Date.parse(tsRaw) : Number.NaN

      if (!tsRaw) {
        console.warn(
          '[GA] sign_up_complete: server timestamp missing, using client time',
        )
      } else if (!Number.isFinite(signupCompletedAt)) {
        console.warn(
          '[GA] sign_up_complete: server timestamp parsing failed, using client time',
          { tsRaw },
        )
      }

      const signupCompletedAtMs = Number.isFinite(signupCompletedAt)
        ? signupCompletedAt
        : Date.now()

      // Keep retention anchor across localStorage.clear()
      const preserved: Record<string, string> = {
        [GA_STORAGE_KEYS.SIGNUP_COMPLETED_AT]: signupCompletedAtMs.toString(),
      }
      const gaFirstMeasure = localStorage.getItem(
        GA_STORAGE_KEYS.FIRST_MEASURE_START_SENT,
      )
      const gaMeaningful = localStorage.getItem(
        GA_STORAGE_KEYS.MEANINGFUL_USE_SENT,
      )
      const gaOnboardingEnter = localStorage.getItem(
        GA_STORAGE_KEYS.ONBOARDING_ENTER_SENT,
      )
      const gaMeasurePageEnter = localStorage.getItem(
        GA_STORAGE_KEYS.MEASURE_PAGE_ENTER_SENT,
      )

      if (gaFirstMeasure)
        preserved[GA_STORAGE_KEYS.FIRST_MEASURE_START_SENT] = gaFirstMeasure
      if (gaMeaningful)
        preserved[GA_STORAGE_KEYS.MEANINGFUL_USE_SENT] = gaMeaningful
      if (gaOnboardingEnter)
        preserved[GA_STORAGE_KEYS.ONBOARDING_ENTER_SENT] = gaOnboardingEnter
      if (gaMeasurePageEnter)
        preserved[GA_STORAGE_KEYS.MEASURE_PAGE_ENTER_SENT] = gaMeasurePageEnter

      AnalyticsEvents.signUpComplete({ user_id: userId })

      alert('인증 성공!')
      localStorage.clear()
      Object.entries(preserved).forEach(([k, v]) => localStorage.setItem(k, v))
      markCalibrationInitialRequired(userId)
      if (options?.redirectTo) {
        navigate(options.redirectTo, { replace: true })
      }
    },
    onError: (error: unknown) => {
      console.error('인증 실패:', error)
      alert(parseErrorMessage(error))
    },
  })
}

export const useResendVerifyEmailMuation = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: resendVerifyEmail,

    onSuccess: data => {
      navigate('/auth/resend')
      console.log('인증 다시 보내기 성공:', data)
    },
    onError: (error: unknown) => {
      console.error('인증 다시 보내기 실패:', error)
      alert(parseErrorMessage(error))
    },
  })
}
