import api from '@shared/api'
import { useQuery } from '@tanstack/react-query'
import type { SessionReportResponse } from '../types'

/**
 * 세션 리포트 조회 API
 */
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

/**
 * 세션 리포트 조회 query 훅
 * @param sessionId - 조회할 세션 ID
 * @param enabled - 쿼리 실행 여부 (기본값: true)
 * @example
 * const { data, isLoading, error } = useSessionReportQuery(sessionId);
 * console.log(data?.data.totalSeconds); // 전체 시간
 * console.log(data?.data.goodSeconds);  // 좋은 자세 시간
 * console.log(data?.data.score);        // 점수
 */
export const useSessionReportQuery = (
  sessionId: string | null,
  enabled = true,
) => {
  return useQuery({
    queryKey: ['sessionReport', sessionId],
    queryFn: () => fetchSessionReport(sessionId!),
    enabled: enabled && !!sessionId, // sessionId가 있을 때만 실행
    staleTime: 1000 * 60 * 5, // 5분간 데이터 신선하게 유지
    retry: 1, // 실패 시 1번만 재시도
  })
}
