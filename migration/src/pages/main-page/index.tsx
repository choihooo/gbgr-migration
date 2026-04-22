/**
 * /main 라우트 — DashboardPage로 위임
 * @legacy src/renderer/src/features/dashboard/ui/MainHeader.tsx (레이아웃)
 */
import { useEffect, useState } from 'react'
import { useWindowVisibilitySync } from '@/features/posture-engine'
import DashboardPage from '@/pages/dashboard-page'

const MAIN_WINDOW_ACTIVE_KEY = 'main-window-active'

function MainPage() {
  const [, setMode] = useState<'foreground' | 'background'>('foreground')

  useWindowVisibilitySync(setMode)

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

  return <DashboardPage />
}

export default MainPage
