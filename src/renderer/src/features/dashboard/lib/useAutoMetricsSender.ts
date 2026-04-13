import type { MetricData } from '@entities/session'
import { useEffect, useRef, useState } from 'react'

/**
 * 5분마다 자동으로 메트릭 데이터를 전송하는 훅
 * 세션이 종료되면 타이머를 초기화합니다.
 *
 * @param metricsRef - 메트릭 데이터를 담고 있는 ref
 * @param sendMetrics - 메트릭 전송 함수
 */
export const useAutoMetricsSender = (
  metricsRef: React.RefObject<MetricData[]>,
  sendMetrics: () => void,
) => {
  // sessionId를 state로 관리하여 변경 감지
  const [sessionId, setSessionId] = useState<string | null>(() =>
    localStorage.getItem('sessionId'),
  )

  // sendMetrics 함수를 ref로 저장 (dependency 문제 방지)
  const sendMetricsRef = useRef(sendMetrics)

  // sendMetrics가 변경되면 ref 업데이트
  useEffect(() => {
    sendMetricsRef.current = sendMetrics
  }, [sendMetrics])

  // sessionId 변경 감지 (1초마다 체크)
  useEffect(() => {
    const checkSessionId = () => {
      const currentSessionId = localStorage.getItem('sessionId')
      if (currentSessionId !== sessionId) {
        setSessionId(currentSessionId)
      }
    }

    const checkInterval = setInterval(checkSessionId, 1000)

    return () => {
      clearInterval(checkInterval)
    }
  }, [sessionId])

  // 5분마다 자동 전송 (sessionId가 변경되면 타이머 재시작)
  useEffect(() => {
    // 세션이 없으면 interval을 시작하지 않음
    if (!sessionId) {
      return
    }

    const FIVE_MINUTES = 5 * 60 * 1000 // 5분 = 300,000ms

    const intervalId = setInterval(() => {
      const currentSessionId = localStorage.getItem('sessionId')

      // 세션이 활성화되어 있고, 전송할 데이터가 있을 때만 전송
      if (
        currentSessionId &&
        metricsRef.current &&
        metricsRef.current.length > 0
      ) {
        sendMetricsRef.current() // ref를 통해 최신 함수 호출
      }
    }, FIVE_MINUTES)

    // 클린업: 컴포넌트 언마운트 시 또는 세션 변경 시 interval 정리
    return () => {
      clearInterval(intervalId)
    }
  }, [sessionId, metricsRef]) // sendMetrics 제거!
}
