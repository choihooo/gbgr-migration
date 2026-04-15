/**
 * /main 라우트 — DashboardPage로 위임
 * @legacy src/renderer/src/features/dashboard/ui/MainHeader.tsx (레이아웃)
 */
import { useState } from 'react'
import { useWindowVisibilitySync } from '@/features/posture-engine'
import DashboardPage from '@/pages/dashboard-page'

function MainPage() {
  const [, setMode] = useState<'foreground' | 'background'>('foreground')

  useWindowVisibilitySync(setMode)

  return <DashboardPage />
}

export default MainPage
