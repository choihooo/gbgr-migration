/**
 * @legacy src/renderer/src/features/dashboard/lib/useAutoMetricsSender.ts
 *
 * 5분마다 자동으로 메트릭을 flush한다.
 */
import { useEffect, useRef, useState } from 'react'

const FIVE_MINUTES = 5 * 60 * 1000

export function useAutoMetricsSender(flushMetrics: () => void) {
  const [sessionId, setSessionId] = useState<string | null>(() =>
    localStorage.getItem('sessionId'),
  )

  const flushRef = useRef(flushMetrics)
  useEffect(() => {
    flushRef.current = flushMetrics
  }, [flushMetrics])

  // sessionId 변경 감지 (1초마다)
  useEffect(() => {
    const check = () => {
      const current = localStorage.getItem('sessionId')
      if (current !== sessionId) {
        setSessionId(current)
      }
    }

    const interval = setInterval(check, 1000)
    return () => clearInterval(interval)
  }, [sessionId])

  // 5분마다 자동 flush
  useEffect(() => {
    if (!sessionId) return

    const interval = setInterval(() => {
      const currentSessionId = localStorage.getItem('sessionId')
      if (currentSessionId) {
        flushRef.current()
      }
    }, FIVE_MINUTES)

    return () => clearInterval(interval)
  }, [sessionId])
}
