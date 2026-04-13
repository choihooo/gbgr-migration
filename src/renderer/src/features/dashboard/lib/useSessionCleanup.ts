import {
  useSaveMetricsMutation,
  useStopSessionMutation,
} from '@entities/session'
import type { MetricData } from '@entities/session'
import { useEffect } from 'react'

/**
 * 창 닫기 시 세션 정리 훅
 *
 * 동작:
 * 1. 남은 메트릭을 서버로 전송 시도 (데이터 저장장)
 * 2. 활성 세션 종료 API 호출 시도
 * 3. sessionId를 lastSessionId로 백업 (리포트 조회용)
 * 4. sessionId 삭제 (재진입 시 새로운 세션 생성)
 * 5. 카메라 상태를 exit로 변경 (재진입 시 오늘의 리포트 표시)
 * 6. 위젯 열려 있으면 닫기
 *
 * 주의: beforeunload는 비동기 작업 완료를 보장하지 않으므로,
 * API 호출은 시도만 하고, localStorage 정리는 동기적으로 처리
 */

export const useSessionCleanup = (
  metricsRef: React.RefObject<MetricData[]>,
  setExit: () => void,
) => {
  const { mutate: saveMetrics } = useSaveMetricsMutation()
  const { mutate: stopSession } = useStopSessionMutation()

  useEffect(() => {
    const handleBeforeUnload = () => {
      const sessionId = localStorage.getItem('sessionId')

      /* 세션이 활성화되어 있는 경우에만 서버와 통신 */
      if (sessionId) {
        /* 1. 남은 메트릭 전송 시도 (비동기, 완료 보장 안됨) */
        if (metricsRef.current && metricsRef.current.length > 0) {
          try {
            saveMetrics({
              sessionId,
              metrics: metricsRef.current,
            })
          } catch (error) {
            console.error('Failed to save metrics on cleanup:', error)
          }
        }

        /* 2. 세션 종료 API 호출 시도 (비동기, 완료 보장 안됨) */
        try {
          stopSession(sessionId)
        } catch (error) {
          console.error('Failed to stop session on cleanup:', error)
        }

        /* 3. sessionId를 lastSessionId로 백업 (동기 작업, 확실히 실행됨)
         useStopSessionMutation의 onSuccess가 실행 안될 수 있으므로 여기서도 처리 */
        localStorage.setItem('lastSessionId', sessionId)

        /*  4. sessionId 삭제 (동기 작업, 확실히 실행됨) */
        localStorage.removeItem('sessionId')
      }

      /* 5. 카메라 상태를 exit로 변경 (동기 작업, 확실히 실행됨)
       세션 유무와 관계없이 항상 실행하여 재진입 시 오늘의 리포트 표시 */
      setExit()

      /* 6. 위젯 닫기 (동기 작업, 확실히 실행됨)
       세션 유무와 관계없이 항상 실행 */
      if (window.electronAPI?.widget?.close) {
        try {
          window.electronAPI.widget.close()
        } catch (error) {
          console.error('Failed to close widget:', error)
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [saveMetrics, stopSession, metricsRef, setExit])
}
