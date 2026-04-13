import api from '@shared/api'
import { useMutation } from '@tanstack/react-query'
import type { SessionActionResponse } from '../types'

/**
 * 세션 재개 API
 */
const resumeSession = async (
  sessionId: string,
): Promise<SessionActionResponse> => {
  const response = await api.patch<SessionActionResponse>(
    `/sessions/${sessionId}/resume`,
  )
  const result = response.data

  if (!result.success) {
    throw new Error(result.message || '세션 재개 실패')
  }

  return result
}

/**
 * 세션 재개 mutation 훅
 * @example
 * const { mutate: resumeSession } = useResumeSessionMutation();
 * const sessionId = localStorage.getItem('sessionId');
 * resumeSession(sessionId);
 */
export const useResumeSessionMutation = () => {
  return useMutation({
    mutationFn: resumeSession,
    onSuccess: () => {
      console.log('세션 재개 성공')
    },
    onError: error => {
      console.error('세션 재개 오류:', error)
    },
  })
}
