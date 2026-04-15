import type { TabType } from '@/features/layout/model/use-navigation-tabs'
import { DashboardHeader } from '@/features/layout/ui/DashboardHeader'
import { LeftPanelArea } from './LeftPanelArea'
import { RightPanelArea } from './RightPanelArea'

interface MainContentProps {
  activeTab: TabType
  onTabClick: (tabId: TabType) => void
  onOpenNotification: () => void
}

export function MainContent({
  activeTab,
  onTabClick,
  onOpenNotification,
}: MainContentProps) {
  return (
    <main
      className="grid min-h-0 w-full flex-1 grid-cols-[1fr_minmax(336px,400px)] items-stretch gap-2"
      data-testid="main-content"
    >
      <div className="h-full min-h-0 w-full">
        <div className="flex h-full min-h-0 flex-col gap-[clamp(8px,calc(4.375vw-48px),36px)]">
          <DashboardHeader
            activeTab={activeTab}
            onTabClick={onTabClick}
            onOpenNotification={onOpenNotification}
          />
          <div className="text-caption-xs-regular text-grey-200 mr-4 flex shrink-0 items-end justify-end">
            마지막 갱신일: 2025.10.22(수) 17:52
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <LeftPanelArea />
          </div>
        </div>
      </div>
      <RightPanelArea />
    </main>
  )
}
