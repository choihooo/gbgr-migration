import { usePostureStore } from '@entities/posture'
import { useEffect } from 'react'

/* 메인 창의  실시간 자세 상태 위젯 창에 실시간 동기화
 localStorage의 storage 이벤트를 통해 창 간 통신 */

export function usePostureSyncWithLocalStorage() {
  const postureClass = usePostureStore(state => state.postureClass)
  const setStatus = usePostureStore(state => state.setStatus)

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      /* posture-state-storage만 처리 (다른 localStorage 변경은 무시) */
      if (e.key !== 'posture-state-storage' || !e.newValue) return

      try {
        const storageData = JSON.parse(e.newValue)
        const { postureClass: newPostureClass, score: newScore } =
          storageData.state

        console.log('[위젯] 메인 창에서 자세 변경 감지:', {
          from: { postureClass },
          to: { postureClass: newPostureClass, score: newScore },
        })

        setStatus(newPostureClass, newScore)
      } catch (error) {
        console.error('[위젯] localStorage 파싱 오류:', error)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [postureClass, setStatus])

  /* 디버깅용 로그 */
  useEffect(() => {
    console.log('[위젯] 자세 상태 업데이트:', {
      postureClass,
      timestamp: new Date().toLocaleTimeString(),
    })
  }, [postureClass])
}
