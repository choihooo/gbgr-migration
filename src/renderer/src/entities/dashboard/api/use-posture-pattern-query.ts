import api from '@shared/api'
import { useQuery } from '@tanstack/react-query'
import type { PosturePatternResponse } from '../types'

/**
 * 자세 패턴 분석 조회 API
 * GET /dashboard/posture-pattern
 */
const getPosturePattern = async (): Promise<PosturePatternResponse> => {
  const response = await api.get<PosturePatternResponse>(
    '/dashboard/posture-pattern',
  )
  const result = response.data

  if (!result.success) {
    throw new Error(result.message || '자세 패턴 분석 조회 실패')
  }

  return result
}

/**
 * 자세 패턴 분석 조회 query 훅
 * @example
 * const { data, isLoading, error } = usePosturePatternQuery();
 * const worstTime = data?.data.worstTime;
 * const worstDay = data?.data.worstDay;
 */
export const usePosturePatternQuery = () => {
  return useQuery({
    queryKey: ['posturePattern'],
    queryFn: getPosturePattern,
    staleTime: 1000 * 60 * 5, // 5분간 데이터 신선하게 유지
    retry: 1, // 실패 시 1번만 재시도
  })
}
