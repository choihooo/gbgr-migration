import api from '@shared/api'
import { useQuery } from '@tanstack/react-query'
import type { AttendanceQueryParams, AttendanceResponse } from '../types'

/**
 * 출석 현황 조회 API
 * GET /dashboard/attendance
 */
const getAttendance = async (
  params: AttendanceQueryParams,
): Promise<AttendanceResponse> => {
  const queryParams = new URLSearchParams({
    period: params.period,
    year: params.year.toString(),
  })

  if (params.month !== undefined) {
    queryParams.append('month', params.month.toString())
  }

  const response = await api.get<AttendanceResponse>(
    `/dashboard/attendance?${queryParams.toString()}`,
  )
  const result = response.data

  if (!result.success) {
    throw new Error(result.message || '출석 현황 조회 실패')
  }

  return result
}

/**
 * 출석 현황 조회 query 훅
 * @param params - 조회 파라미터 (period, year, month)
 * @param enabled - 쿼리 실행 여부 (기본값: true)
 * @example
 * const { data, isLoading, error } = useAttendanceQuery({
 *   period: 'MONTHLY',
 *   year: 2025,
 *   month: 11
 * });
 * const attendances = data?.data.attendances;
 * const title = data?.data.title;
 */
export const useAttendanceQuery = (
  params: AttendanceQueryParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: ['attendance', params.period, params.year, params.month],
    queryFn: () => getAttendance(params),
    enabled: enabled && !!params.year,
    staleTime: 1000 * 60 * 5, // 5분간 데이터 신선하게 유지
    retry: 1, // 실패 시 1번만 재시도
  })
}
