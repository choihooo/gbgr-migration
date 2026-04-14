import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createSession,
  pauseSession,
  resumeSession,
  stopSession,
} from '../api/session-api'

export const useCreateSessionMutation = () => {
  return useMutation({
    mutationFn: createSession,
    onSuccess: data => {
      localStorage.setItem('sessionId', data.data.sessionId)
      console.log('세션이 생성되었습니다.', data.data.sessionId)
    },
  })
}

export const useStopSessionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: stopSession,
    onSuccess: (_data, sessionId) => {
      const currentSessionId = localStorage.getItem('sessionId')
      if (currentSessionId) {
        localStorage.setItem('lastSessionId', currentSessionId)
        localStorage.removeItem('sessionId')
      }
      console.log('세션이 종료되었습니다.', sessionId)

      queryClient.invalidateQueries({ queryKey: ['averageScore'] })
      queryClient.invalidateQueries({ queryKey: ['level'] })
      queryClient.invalidateQueries({ queryKey: ['postureGraph'] })
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
