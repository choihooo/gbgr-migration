/**
 * 대시보드 페이지 — DashboardHeader + 메인 2열 콘텐츠 + 설정/알림 모달
 */

import { useMainPage } from '@/features/dashboard/model/use-main-page'
import { MainContent } from '@/features/dashboard/ui/MainContent'
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
    <div className="bg-grey-25 flex h-screen min-h-0 flex-col overflow-hidden">
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-8 pb-4">
        <MainContent
          activeTab={activeTab}
          onTabClick={onTabClick}
          onOpenNotification={openNotification}
        />
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={closeNotification}
      />
    </div>
  )
}
