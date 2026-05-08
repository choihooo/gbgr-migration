/**
 * @legacy src/renderer/src/features/dashboard/lib/useSessionCleanup.ts
 *
 * 창 닫기 시 메트릭 전송, 세션 종료, 정리를 수행한다.
 */
import { useEffect } from 'react'

import { api } from '@/shared/api/instance'
import { closeWidget } from '@/shared/lib/widget-api'

export function useSessionCleanup(flushMetrics: () => void) {
  useEffect(() => {
    const handleBeforeUnload = () => {
      const sessionId = localStorage.getItem('sessionId')
      if (!sessionId) return

      // 1. 남은 메트릭 전송 시도 (비동기, 완료 보장 안됨)
      try {
        flushMetrics()
      } catch {
        // beforeunload에서는 최선의 노력만
      }

      // 2. 세션 종료 API 호출 시도 (비동기, 완료 보장 안됨)
      try {
        api.patch(`/sessions/${sessionId}/stop`)
      } catch {
        // 의도적 무시
      }

      // 3. sessionId → lastSessionId 백업 (동기)
      localStorage.setItem('lastSessionId', sessionId)

      // 4. sessionId 삭제 (동기)
      localStorage.removeItem('sessionId')

      // 5. 위젯 닫기 (동기 시도)
      closeWidget().catch(() => {})
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [flushMetrics])
}
