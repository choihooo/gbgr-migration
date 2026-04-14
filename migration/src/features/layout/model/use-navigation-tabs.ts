/**
 * @legacy src/renderer/src/features/dashboard/ui/MainHeader.tsx (탭 상태 관리 로직)
 */
import { useCallback, useState } from 'react'

export type TabType = 'dashboard' | 'settings' | 'report' | 'review'

const ERROR_REPORT_URL =
  'https://adhesive-wrench-b12.notion.site/3067d0b568e281fd97b4f2954d09a2f6?pvs=105'
const REVIEW_FORM_URL =
  'https://adhesive-wrench-b12.notion.site/30f7d0b568e28033b440c1352d8a1a43?pvs=105'

export function useNavigationTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')

  const handleTabClick = useCallback(
    (tabId: TabType, callbacks?: { onOpenSettings?: () => void }) => {
      if (tabId === 'settings') {
        callbacks?.onOpenSettings?.()
        return
      }
      if (tabId === 'report') {
        window.open(ERROR_REPORT_URL, '_blank', 'noopener,noreferrer')
        return
      }
      if (tabId === 'review') {
        window.open(REVIEW_FORM_URL, '_blank', 'noopener,noreferrer')
        return
      }
      setActiveTab(tabId)
    },
    [],
  )

  return { activeTab, setActiveTab, handleTabClick }
}
