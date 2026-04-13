import api from '@shared/api'
import { AnalyticsEvents } from '@shared/lib/analytics/events'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SessionActionResponse } from '../types'

/**
 * 세션 중단 API
 */
const stopSession = async (
  sessionId: string,
): Promise<SessionActionResponse> => {
  const response = await api.patch<SessionActionResponse>(
    `/sessions/${sessionId}/stop`,
  )
  const result = response.data

  if (!result.success) {
    throw new Error(result.message || '세션 중단 실패')
  }

  return result
}

/**
 * 세션 중단 mutation 훅
 * @example
 * const { mutate: stopSession } = useStopSessionMutation();
 * const sessionId = localStorage.getItem('sessionId');
 * stopSession(sessionId);
 */
export const useStopSessionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: stopSession,
    onSuccess: () => {
      // sessionId를 lastSessionId로 백업 (ExitPanel에서 리포트 조회용)
      const sessionId = localStorage.getItem('sessionId')
      if (sessionId) {
        const startAtRaw = localStorage.getItem('sessionStartAt')
        const startAt = startAtRaw ? Number(startAtRaw) : Number.NaN
        if (Number.isFinite(startAt) && startAt > 0) {
          const duration_sec = Math.max(
            0,
            Math.round((Date.now() - startAt) / 1000),
          )
          AnalyticsEvents.measureEnd({ session_id: sessionId, duration_sec })
        } else {
          console.warn('[GA] measure_end: Invalid or missing sessionStartAt', {
            startAtRaw,
          })
        }

        localStorage.setItem('lastSessionId', sessionId)
      }

      // sessionId를 localStorage에서 제거
      localStorage.removeItem('sessionId')
      localStorage.removeItem('sessionStartAt')

      // 평균 자세 점수 쿼리 갱신
      queryClient.invalidateQueries({ queryKey: ['averageScore'] })

      // 레벨 쿼리 갱신
      queryClient.invalidateQueries({ queryKey: ['level'] })

      // 자세 그래프 쿼리 갱신
      queryClient.invalidateQueries({ queryKey: ['postureGraph'] })
    },
    onError: error => {
      console.error('세션 중단 오류:', error)
    },
  })
}
