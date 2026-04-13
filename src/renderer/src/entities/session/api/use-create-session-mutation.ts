import api from '@shared/api'
import {
  AnalyticsEvents,
  GA_STORAGE_KEYS,
  validateAndLogSessionId,
} from '@shared/lib/analytics'
import { useMutation } from '@tanstack/react-query'
import type { CreateSessionResponse } from '../types'

/**
 * 세션 생성 API
 */
const createSession = async (): Promise<CreateSessionResponse> => {
  const response = await api.post<CreateSessionResponse>('/sessions', {})
  const result = response.data

  if (!result.success) {
    throw new Error(result.message || '세션 생성 실패')
  }

  return result
}

/**
 * 세션 생성 mutation 훅
 * @example
 * const { mutate: createSession } = useCreateSessionMutation();
 * createSession();
 */
export const useCreateSessionMutation = () => {
  return useMutation({
    mutationFn: createSession,
    onSuccess: res => {
      console.log('세션 생성 성공:', res.data.sessionId)

      // sessionId를 localStorage에 저장
      localStorage.setItem('sessionId', res.data.sessionId)
      localStorage.setItem('sessionStartAt', Date.now().toString())

      // 이전 세션의 lastSessionId 삭제 (중복 방지)
      localStorage.removeItem('lastSessionId')

      if (validateAndLogSessionId(res.data.sessionId, 'measure_start')) {
        AnalyticsEvents.measureStart({ session_id: res.data.sessionId })
      }

      const signupCompletedAtRaw = localStorage.getItem(
        GA_STORAGE_KEYS.SIGNUP_COMPLETED_AT,
      )
      const firstMeasureSent = localStorage.getItem(
        GA_STORAGE_KEYS.FIRST_MEASURE_START_SENT,
      )
      const meaningfulUseSent = localStorage.getItem(
        GA_STORAGE_KEYS.MEANINGFUL_USE_SENT,
      )
      if (signupCompletedAtRaw && firstMeasureSent !== 'true') {
        const signupCompletedAt = Number(signupCompletedAtRaw)
        if (Number.isFinite(signupCompletedAt) && signupCompletedAt > 0) {
          const seconds_from_signup = Math.max(
            0,
            Math.round((Date.now() - signupCompletedAt) / 1000),
          )
          AnalyticsEvents.firstMeasureStart({ seconds_from_signup })
          localStorage.setItem(GA_STORAGE_KEYS.FIRST_MEASURE_START_SENT, 'true')
        }
      }

      if (signupCompletedAtRaw && meaningfulUseSent !== 'true') {
        const signupCompletedAt = Number(signupCompletedAtRaw)
        if (Number.isFinite(signupCompletedAt) && signupCompletedAt > 0) {
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
          if (Date.now() - signupCompletedAt >= sevenDaysMs) {
            AnalyticsEvents.meaningfulUse({ type: 'measure_start' })
            localStorage.setItem(GA_STORAGE_KEYS.MEANINGFUL_USE_SENT, 'true')
          }
        }
      }
    },
    onError: error => {
      console.error('세션 생성 오류:', error)
    },
  })
}
