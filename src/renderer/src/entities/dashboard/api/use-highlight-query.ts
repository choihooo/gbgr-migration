import api from '@shared/api'
import { useQuery } from '@tanstack/react-query'
import type { HighlightQueryParams, HighlightResponse } from '../types'

/**
 * 하이라이트 조회 API
 * GET /dashboard/highlight
 */
const getHighlight = async (
  params: HighlightQueryParams,
): Promise<HighlightResponse> => {
  const queryParams = new URLSearchParams({
    period: params.period,
    year: params.year.toString(),
  })

  if (params.month !== undefined) {
    queryParams.append('month', params.month.toString())
  }

  const response = await api.get<HighlightResponse>(
    `/dashboard/highlight?${queryParams.toString()}`,
  )
  const result = response.data

  if (!result.success) {
    throw new Error(result.message || '하이라이트 조회 실패')
  }

  return result
}

/**
 * 하이라이트 조회 query 훅
 * @param params - 조회 파라미터 (period, year, month)
 * @param enabled - 쿼리 실행 여부 (기본값: true)
 * @example
 * const { data, isLoading, error } = useHighlightQuery({
 *   period: 'WEEKLY',
 *   year: 2025,
 *   month: 11
 * });
 * const current = data?.data.current;
 * const previous = data?.data.previous;
 */
export const useHighlightQuery = (
  params: HighlightQueryParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: ['highlight', params.period, params.year, params.month],
    queryFn: () => getHighlight(params),
    enabled: enabled && !!params.year,
    staleTime: 1000 * 60 * 5, // 5분간 데이터 신선하게 유지
    retry: 1, // 실패 시 1번만 재시도
  })
}
