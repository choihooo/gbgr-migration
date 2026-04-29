import { useEffect, useState } from 'react'
import { usePostureEngineStore } from '@/entities/posture'
import { usePostureEngine } from '@/features/posture-engine'
import { closeWidget } from '@/shared/lib/widget-api'
import { MediumWidgetContent } from './MediumWidgetContent'
import { MiniWidgetContent } from './MiniWidgetContent'
import { WidgetTitleBar } from './WidgetTitleBar'

type WidgetSize = 'mini' | 'medium'

const BREAKPOINT = {
  height: 62,
} as const

function WidgetPage() {
  const [widgetSize, setWidgetSize] = useState<WidgetSize>('medium')

  usePostureEngine({ active: false })

  const latestResult = usePostureEngineStore(state => state.latestResult)
  const restoredResult = usePostureEngineStore(state => state.restoredResult)
  const postureClass =
    latestResult?.postureClass ?? restoredResult?.postureClass ?? 0

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

  const isMini = widgetSize === 'mini'

  const handleClose = async () => {
    try {
      await closeWidget()
    } catch (error) {
      console.error('위젯 창 닫기 실패:', error)
    }
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
