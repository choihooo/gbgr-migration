/**
 * /main 라우트 — DashboardPage로 위임
 * @legacy src/renderer/src/features/dashboard/ui/MainHeader.tsx (레이아웃)
 */
import { useEffect, useState } from 'react'
import { useNotificationScheduler } from '@/features/notification-settings/model/use-notification-scheduler'
import { useWindowVisibilitySync } from '@/features/posture-engine'
import DashboardPage from '@/pages/dashboard-page'
import { AnalyticsEvents, GA_STORAGE_KEYS } from '@/shared/lib/analytics'

const MAIN_WINDOW_ACTIVE_KEY = 'main-window-active'

function MainPage() {
  const [, setMode] = useState<'foreground' | 'background'>('foreground')

  useWindowVisibilitySync(setMode)
  useNotificationScheduler()

  useEffect(() => {
    const heartbeat = () => {
      localStorage.setItem(MAIN_WINDOW_ACTIVE_KEY, Date.now().toString())
    }

    heartbeat()
    const interval = window.setInterval(heartbeat, 500)

    return () => {
      window.clearInterval(interval)
      localStorage.removeItem(MAIN_WINDOW_ACTIVE_KEY)
    }
  }, [])

  // measure_page_enter 이벤트
  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId')
    const measurePageEnterSent = localStorage.getItem(
      GA_STORAGE_KEYS.MEASURE_PAGE_ENTER_SENT,
    )

    if (sessionId && measurePageEnterSent !== 'true') {
      localStorage.setItem(GA_STORAGE_KEYS.MEASURE_PAGE_ENTER_SENT, 'true')
      AnalyticsEvents.measurePageEnter({ session_id: sessionId })
    }
  }, [])

  return <DashboardPage />
}

export default MainPage
