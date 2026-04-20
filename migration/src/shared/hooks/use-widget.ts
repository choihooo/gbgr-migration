import { isWidgetOpen, openWidget, closeWidget } from '@/shared/lib/widget-api'
import { useEffect, useState } from 'react'

export function useWidget() {
  const [isWidgetVisible, setIsWidgetVisible] = useState(false)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const open = await isWidgetOpen()
        setIsWidgetVisible(open)
      } catch {
        // Tauri 런타임 없으면 무시
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 1000)
    return () => clearInterval(interval)
  }, [])

  const toggleWidget = async () => {
    try {
      if (isWidgetVisible) {
        await closeWidget()
        setIsWidgetVisible(false)
      } else {
        await openWidget()
        setIsWidgetVisible(true)
      }
    } catch (error) {
      console.error('위젯 토글 실패:', error)
    }
  }

  return {
    isWidgetOpen: isWidgetVisible,
    toggleWidget,
  }
}
