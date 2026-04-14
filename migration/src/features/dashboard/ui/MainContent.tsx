import { LeftPanelArea } from './LeftPanelArea'
import { RightPanelArea } from './RightPanelArea'

export function MainContent() {
  return (
    <main
      className="grid min-h-0 w-full flex-1 grid-cols-[1fr_minmax(336px,400px)] items-stretch gap-2"
      data-testid="main-content"
    >
      <div className="h-full min-h-0 w-full">
        <div className="flex h-full min-h-0 flex-col">
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
