import api from '@shared/api'
import { useQuery } from '@tanstack/react-query'
import type { AverageScoreResponse } from '../types'

/**
 * 평균 자세 점수 조회 API
 * GET /dashboard/average-score
 */
const getAverageScore = async (): Promise<AverageScoreResponse> => {
  const response = await api.get<AverageScoreResponse>(
    '/dashboard/average-score',
  )
  const result = response.data

  if (!result.success) {
    throw new Error(result.message || '평균 점수 조회 실패')
  }

  return result
}

/**
 * 평균 자세 점수 조회 query 훅
 * @example
 * const { data, isLoading, error } = useAverageScoreQuery();
 * const score = data?.data.score;
 */
export const useAverageScoreQuery = () => {
  return useQuery({
    queryKey: ['averageScore'],
    queryFn: getAverageScore,
  })
}
