/**
 * @legacy src/renderer/src/pages/main-page/index.tsx (metricsRef 축적 로직)
 *
 * 자세 결과를 1초 throttling으로 축적하고 flush 함수를 반환한다.
 */
import { useEffect, useRef } from 'react'

import type { MetricData } from '@/entities/session/types'
import type { PostureEngineResult } from '@/entities/posture'
import { usePostureEngineStore } from '@/entities/posture'
import { useSaveMetricsMutation } from '@/entities/session/model/use-session-mutations'

export function useMetricsCollector() {
  const latestResult = usePostureEngineStore(s => s.latestResult)
  const metricsRef = useRef<MetricData[]>([])
  const lastSaveTimeRef = useRef<number>(0)
  const { mutate: saveMetricsMutate } = useSaveMetricsMutation()

  useEffect(() => {
    if (!latestResult) return

    const sessionId = localStorage.getItem('sessionId')
    if (!sessionId) return

    accumulateMetric(metricsRef, lastSaveTimeRef, latestResult)
  }, [latestResult])

  const flushMetrics = () => {
    const sessionId = localStorage.getItem('sessionId')
    if (sessionId && metricsRef.current.length > 0) {
      const batch = metricsRef.current
      metricsRef.current = []
      saveMetricsMutate({ sessionId, metrics: batch })
    }
  }

  return { flushMetrics }
}

function accumulateMetric(
  metricsRef: React.RefObject<MetricData[]>,
  lastSaveTimeRef: React.RefObject<number>,
  result: PostureEngineResult,
) {
  const now = Date.now()
  if (now - lastSaveTimeRef.current < 1000) return

  metricsRef.current.push({
    score: result.postureClass,
    timestamp: result.timestamp,
  })
  lastSaveTimeRef.current = now
}
