import api from '@shared/api'
import { useQuery } from '@tanstack/react-query'
import type { LevelResponse } from '../types'

/**
 * 레벨 도달 현황 조회 API
 * GET /dashboard/level
 */
const getLevel = async (): Promise<LevelResponse> => {
  const response = await api.get<LevelResponse>('/dashboard/level')
  const result = response.data

  if (!result.success) {
    throw new Error(result.message || '레벨 조회 실패')
  }

  return result
}

/**
 * 레벨 도달 현황 조회 query 훅
 * @example
 * const { data, isLoading, error } = useLevelQuery();
 * const level = data?.data.level;
 * const current = data?.data.current;
 * const required = data?.data.required;
 */
export const useLevelQuery = () => {
  return useQuery({
    queryKey: ['level'],
    queryFn: getLevel,
  })
}
