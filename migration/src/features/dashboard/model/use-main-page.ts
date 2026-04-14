import { useMemo } from 'react'
import {
  type TabType,
  useNavigationTabs,
} from '@/features/layout/model/use-navigation-tabs'
import { useModal } from '@/shared/hooks/use-modal'

export function useMainPage() {
  const { activeTab, handleTabClick } = useNavigationTabs()
  const settingsModal = useModal()
  const notificationModal = useModal()

  const currentTab: TabType = settingsModal.isOpen ? 'settings' : activeTab

  const state = useMemo(
    () => ({
      activeTab: currentTab,
      isSettingsOpen: settingsModal.isOpen,
      isNotificationOpen: notificationModal.isOpen,
    }),
    [currentTab, notificationModal.isOpen, settingsModal.isOpen],
  )

  return {
    ...state,
    onTabClick: (tabId: TabType) =>
      handleTabClick(tabId, {
        onOpenSettings: settingsModal.open,
      }),
    openNotification: notificationModal.open,
    closeNotification: notificationModal.close,
    closeSettings: settingsModal.close,
  }
}
