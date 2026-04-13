import api from '@shared/api'
import { useMutation } from '@tanstack/react-query'
import type { SessionActionResponse } from '../types'

/**
 * 세션 일시정지 API
 */
const pauseSession = async (
  sessionId: string,
): Promise<SessionActionResponse> => {
  const response = await api.patch<SessionActionResponse>(
    `/sessions/${sessionId}/pause`,
  )
  const result = response.data

  if (!result.success) {
    throw new Error(result.message || '세션 일시정지 실패')
  }

  return result
}

/**
 * 세션 일시정지 mutation 훅
 * @example
 * const { mutate: pauseSession } = usePauseSessionMutation();
 * const sessionId = localStorage.getItem('sessionId');
 * pauseSession(sessionId);
 */
export const usePauseSessionMutation = () => {
  return useMutation({
    mutationFn: pauseSession,
    onSuccess: () => {
      console.log('세션 일시정지 성공')
    },
    onError: error => {
      console.error('세션 일시정지 오류:', error)
    },
  })
}
