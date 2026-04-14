/**
 * 대시보드 페이지 — DashboardHeader + 메인 2열 콘텐츠 + 설정/알림 모달
 */

import { useMainPage } from '@/features/dashboard/model/use-main-page'
import { MainContent } from '@/features/dashboard/ui/MainContent'
import { DashboardHeader } from '@/features/layout/ui/DashboardHeader'
import { NotificationModal } from '@/features/notification-settings/ui/NotificationModal'
import { SettingsModal } from '@/features/settings/ui/SettingsModal'

export default function DashboardPage() {
  const {
    activeTab,
    isSettingsOpen,
    isNotificationOpen,
    onTabClick,
    openNotification,
    closeNotification,
    closeSettings,
  } = useMainPage()

  return (
    <>
      <DashboardHeader
        activeTab={activeTab}
        onTabClick={onTabClick}
        onOpenNotification={openNotification}
      />
      <main className="bg-grey-25 flex h-screen flex-col overflow-hidden p-4">
        <MainContent />
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={closeNotification}
      />
    </>
  )
}
