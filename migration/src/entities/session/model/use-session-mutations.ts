import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { MetricData } from '@/entities/session/types'
import { AnalyticsEvents, GA_STORAGE_KEYS } from '@/shared/lib/analytics'
import { closeWidget } from '@/shared/lib/widget-api'
import {
  createSession,
  pauseSession,
  resumeSession,
  saveMetrics,
  stopSession,
} from '../api/session-api'

export const useCreateSessionMutation = () => {
  return useMutation({
    mutationFn: createSession,
    onSuccess: data => {
      const sessionId = data.data.sessionId
      localStorage.setItem('sessionId', sessionId)
      localStorage.setItem('sessionStartAt', Date.now().toString())
      localStorage.removeItem('lastSessionId')
      console.log('세션이 생성되었습니다.', sessionId)

      // measure_start 이벤트
      AnalyticsEvents.measureStart({ session_id: sessionId })

      // first_measure_start 이벤트 (가입 후 첫 측정)
      const signupCompletedAtRaw = localStorage.getItem(
        GA_STORAGE_KEYS.SIGNUP_COMPLETED_AT,
      )
      const firstMeasureSent = localStorage.getItem(
        GA_STORAGE_KEYS.FIRST_MEASURE_START_SENT,
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

      // meaningful_use 이벤트 (가입 후 7일 경과 시 첫 측정)
      const meaningfulUseSent = localStorage.getItem(
        GA_STORAGE_KEYS.MEANINGFUL_USE_SENT,
      )
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
  })
}

export const useStopSessionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: stopSession,
    onSuccess: (_data, sessionId) => {
      // measure_end 이벤트
      const startAtRaw = localStorage.getItem('sessionStartAt')
      const startAt = startAtRaw ? Number(startAtRaw) : Number.NaN
      if (Number.isFinite(startAt) && startAt > 0) {
        const duration_sec = Math.max(
          0,
          Math.round((Date.now() - startAt) / 1000),
        )
        AnalyticsEvents.measureEnd({
          session_id: sessionId,
          duration_sec,
        })
      }

      localStorage.removeItem('sessionStartAt')

      const currentSessionId = localStorage.getItem('sessionId')
      if (currentSessionId) {
        localStorage.setItem('lastSessionId', currentSessionId)
        localStorage.removeItem('sessionId')
      }

      void closeWidget().catch(() => {})
      console.log('세션이 종료되었습니다.', sessionId)

      queryClient.invalidateQueries({ queryKey: ['averageScore'] })
      queryClient.invalidateQueries({ queryKey: ['level'] })
      queryClient.invalidateQueries({ queryKey: ['postureGraph'] })
    },
  })
}

export const useSaveMetricsMutation = () => {
  return useMutation({
    mutationFn: ({
      sessionId,
      metrics,
    }: {
      sessionId: string
      metrics: MetricData[]
    }) => saveMetrics(sessionId, metrics),
    onError: error => {
      console.error('세션 메트릭 저장 오류:', error)
    },
  })
}

export const usePauseSessionMutation = () => {
  return useMutation({
    mutationFn: pauseSession,
    onSuccess: (_data, sessionId) => {
      console.log('세션이 일시정지되었습니다.', sessionId)
    },
  })
}

export const useResumeSessionMutation = () => {
  return useMutation({
    mutationFn: resumeSession,
    onSuccess: (_data, sessionId) => {
      console.log('세션이 재개되었습니다.', sessionId)
    },
  })
}
