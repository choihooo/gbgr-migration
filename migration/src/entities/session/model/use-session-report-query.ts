import { useQuery } from '@tanstack/react-query'
import type { SessionReportResponse } from '@/entities/session/types'
import { api } from '@/shared/api/instance'

const fetchSessionReport = async (
  sessionId: string,
): Promise<SessionReportResponse> => {
  const response = await api.get<SessionReportResponse>(
    `/sessions/${sessionId}/report`,
  )
  const result = response.data

  if (!result.success) {
    throw new Error(result.message || '세션 리포트 조회 실패')
  }

  return result
}

export const useSessionReportQuery = (
  sessionId: string | null,
  enabled = true,
) => {
  return useQuery({
    queryKey: ['sessionReport', sessionId],
    queryFn: () => {
      if (!sessionId) {
        throw new Error('세션 ID가 없습니다.')
      }

      return fetchSessionReport(sessionId)
    },
    enabled: enabled && !!sessionId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}
