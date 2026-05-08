import type {
  CreateSessionResponse,
  MetricData,
  SaveMetricsResponse,
  SessionActionResponse,
} from '@/entities/session/types'
import { api } from '@/shared/api/instance'

export const createSession = async (): Promise<CreateSessionResponse> => {
  const response = await api.post<CreateSessionResponse>('/sessions', {})
  if (!response.data.success) {
    throw new Error('세션 생성에 실패했습니다.')
  }
  return response.data
}

export const stopSession = async (
  sessionId: string,
): Promise<SessionActionResponse> => {
  const response = await api.patch<SessionActionResponse>(
    `/sessions/${sessionId}/stop`,
  )
  if (!response.data.success) {
    throw new Error('세션 종료에 실패했습니다.')
  }
  return response.data
}

export const pauseSession = async (
  sessionId: string,
): Promise<SessionActionResponse> => {
  const response = await api.patch<SessionActionResponse>(
    `/sessions/${sessionId}/pause`,
  )
  if (!response.data.success) {
    throw new Error('세션 일시정지에 실패했습니다.')
  }
  return response.data
}

export const resumeSession = async (
  sessionId: string,
): Promise<SessionActionResponse> => {
  const response = await api.patch<SessionActionResponse>(
    `/sessions/${sessionId}/resume`,
  )
  if (!response.data.success) {
    throw new Error('세션 재개에 실패했습니다.')
  }
  return response.data
}

export const saveMetrics = async (
  sessionId: string,
  metrics: MetricData[],
): Promise<SaveMetricsResponse> => {
  const response = await api.post<SaveMetricsResponse>(
    `/sessions/${sessionId}/metrics`,
    metrics,
  )
  if (!response.data.success) {
    throw new Error(response.data.message || '세션 메트릭 저장에 실패했습니다.')
  }
  return response.data
}
