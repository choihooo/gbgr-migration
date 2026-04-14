import { MiniRunningPanel } from '@/features/main-panels/ui/MiniRunningPanel'
import { WebcamPanel } from '@/features/main-panels/ui/WebcamPanel'

export function RightPanelArea() {
  return (
    <aside
      className="bg-grey-0 custom-scrollbar flex h-full min-h-0 w-full flex-col gap-[clamp(16px,calc(16px+(100vh-810px)*16/270),32px)] overflow-y-auto overscroll-y-contain rounded-[32px] p-6"
      data-testid="right-panel-area"
    >
      <WebcamPanel />
      <div className="bg-grey-50 h-px w-full" />
      <MiniRunningPanel />
    </aside>
  )
}
