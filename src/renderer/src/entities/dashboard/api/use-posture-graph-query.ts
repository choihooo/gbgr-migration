import api from '@shared/api'
import { useQuery } from '@tanstack/react-query'
import type { PostureGraphResponse } from '../types'

/**
 * 바른 자세 점수 그래프 조회 API (최근 31일)
 * GET /dashboard/posture-graph
 */
const getPostureGraph = async (): Promise<PostureGraphResponse> => {
  const response = await api.get<PostureGraphResponse>(
    '/dashboard/posture-graph',
  )
  const result = response.data

  if (!result.success) {
    throw new Error(result.message || '자세 그래프 조회 실패')
  }

  return result
}

/**
 * 바른 자세 점수 그래프 조회 query 훅
 * @example
 * const { data, isLoading, error } = usePostureGraphQuery();
 * const points = data?.data.points;
 * // points: { "2025-01-01": 85, "2025-01-02": 92, ... }
 */
export const usePostureGraphQuery = () => {
  return useQuery({
    queryKey: ['postureGraph'],
    queryFn: getPostureGraph,
  })
}
