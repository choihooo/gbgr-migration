/**
 * 대시보드 페이지 — DashboardHeader + 탭 콘텐츠 + 설정/알림 모달
 */
import { DashboardHeader } from '@/features/layout/ui/DashboardHeader'
import { useNavigationTabs, type TabType } from '@/features/layout/model/use-navigation-tabs'
import { SettingsModal } from '@/features/settings/ui/SettingsModal'
import { NotificationModal } from '@/features/notification-settings/ui/NotificationModal'
import { useModal } from '@/shared/hooks/use-modal'

export default function DashboardPage() {
  const { activeTab, handleTabClick } = useNavigationTabs()
  const settingsModal = useModal()
  const notificationModal = useModal()

  const onTabClick = (tabId: TabType) => {
    handleTabClick(tabId, {
      onOpenSettings: settingsModal.open,
    })
  }

  return (
    <>
      <DashboardHeader
        activeTab={settingsModal.isOpen ? 'settings' : activeTab}
        onTabClick={onTabClick}
        onOpenNotification={notificationModal.open}
      />
      <main className="p-4">
        {/* TODO: 탭별 콘텐츠 구현 시 교체 */}
        <div className="text-body-md-regular text-grey-400">
          {activeTab === 'dashboard' && '대시보드 콘텐츠 (구현 예정)'}
        </div>
      </main>

      <SettingsModal isOpen={settingsModal.isOpen} onClose={settingsModal.close} />
      <NotificationModal isOpen={notificationModal.isOpen} onClose={notificationModal.close} />
    </>
  )
}
