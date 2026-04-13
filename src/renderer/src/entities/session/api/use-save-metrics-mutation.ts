import api from '@shared/api'
import { useMutation } from '@tanstack/react-query'
import type { SaveMetricsRequest, SaveMetricsResponse } from '../types'

/**
 * 세션 메트릭 저장 API
 */
const saveMetrics = async (
  data: SaveMetricsRequest,
): Promise<SaveMetricsResponse> => {
  const response = await api.post<SaveMetricsResponse>(
    `/sessions/${data.sessionId}/metrics`,
    data.metrics, // 백엔드는 배열을 직접 받음
  )
  const result = response.data

  if (!result.success) {
    throw new Error(result.message || '세션 메트릭 저장 실패')
  }

  return result
}

/**
 * 세션 메트릭 저장 mutation 훅
 * @example
 * const { mutate: saveMetrics } = useSaveMetricsMutation();
 * const sessionId = localStorage.getItem('sessionId');
 * saveMetrics({
 *   sessionId,
 *   metrics: [
 *     { score: 3, timestamp: new Date().toISOString() }, // score: 자세 상태별 레벨 (1~6)
 *     { score: 4, timestamp: new Date().toISOString() }
 *   ]
 * });
 */
export const useSaveMetricsMutation = () => {
  return useMutation({
    mutationFn: saveMetrics,
    onSuccess: res => {},
    onError: error => {
      console.error('세션 메트릭 저장 오류:', error)
    },
  })
}
