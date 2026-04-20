import { usePostureEngineStore } from '@/entities/posture'
import { useEffect, useState } from 'react'
import { WidgetTitleBar } from './WidgetTitleBar'
import { MediumWidgetContent } from './MediumWidgetContent'
import { MiniWidgetContent } from './MiniWidgetContent'

type WidgetSize = 'mini' | 'medium'

const BREAKPOINT = {
  height: 62,
} as const

const MAIN_WINDOW_ACTIVE_KEY = 'main-window-active'
const MAIN_WINDOW_TIMEOUT_MS = 2000

function WidgetPage() {
  const [widgetSize, setWidgetSize] = useState<WidgetSize>('medium')
  const [isMainWindowActive, setIsMainWindowActive] = useState(false)

  const latestResult = usePostureEngineStore(state => state.latestResult)
  const restoredResult = usePostureEngineStore(state => state.restoredResult)
  const postureClass = latestResult?.postureClass ?? restoredResult?.postureClass ?? 0

  // 메인 창 활성화 상태 확인
  useEffect(() => {
    const checkMainWindowStatus = () => {
      const lastUpdateTime = localStorage.getItem(MAIN_WINDOW_ACTIVE_KEY)
      if (!lastUpdateTime) {
        setIsMainWindowActive(false)
        return
      }

      const timeSinceUpdate = Date.now() - Number.parseInt(lastUpdateTime, 10)
      const isActive = timeSinceUpdate < MAIN_WINDOW_TIMEOUT_MS
      setIsMainWindowActive(isActive)
    }

    checkMainWindowStatus()

    const interval = setInterval(checkMainWindowStatus, 500)

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === MAIN_WINDOW_ACTIVE_KEY) {
        checkMainWindowStatus()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // 위젯 resize 이벤트
  useEffect(() => {
    let resizeTimeout: number

    const handleResize = () => {
      const isMedium = innerHeight > BREAKPOINT.height
      setWidgetSize(isMedium ? 'medium' : 'mini')
    }

    const handleResizeDebounced = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = window.setTimeout(() => {
        handleResize()
      }, 10)
    }

    handleResize()
    window.addEventListener('resize', handleResizeDebounced)

    return () => {
      window.removeEventListener('resize', handleResizeDebounced)
      clearTimeout(resizeTimeout)
    }
  }, [])

  // 위젯에서 메인 창 활성화 상태 주기적 업데이트
  useEffect(() => {
    if (!isMainWindowActive) {
      const interval = setInterval(() => {
        localStorage.setItem(MAIN_WINDOW_ACTIVE_KEY, Date.now().toString())
      }, 500)
      return () => clearInterval(interval)
    }
  }, [isMainWindowActive])

  const isMini = widgetSize === 'mini'

  const handleClose = () => {
    window.close()
  }

  return (
    <div className="bg-grey-0 h-screen w-screen overflow-hidden rounded-lg px-[4px] py-[3px]">
      <div className={isMini ? 'flex h-full w-full' : 'h-full w-full'}>
        <WidgetTitleBar isMini={isMini} onClose={handleClose} />

        {isMini ? (
          <MiniWidgetContent posture={postureClass} />
        ) : (
          <MediumWidgetContent posture={postureClass} />
        )}
      </div>
    </div>
  )
}

export default WidgetPage
