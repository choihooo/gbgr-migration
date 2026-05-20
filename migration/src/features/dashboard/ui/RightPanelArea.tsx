import { MiniRunningPanel } from '@/features/main-panels/ui/MiniRunningPanel'
import { WebcamPanel } from '@/features/main-panels/ui/WebcamPanel'

export function RightPanelArea() {
  return (
    <aside
      className="bg-grey-0 flex h-full min-h-0 w-full flex-col gap-[clamp(12px,calc(12px+(100vh-760px)*12/320),24px)] overflow-hidden rounded-[32px] p-6"
      data-testid="right-panel-area"
    >
      <div className="shrink-0">
        <WebcamPanel />
      </div>
      <div className="bg-grey-50 h-px w-full shrink-0" />
      <div className="min-h-0 flex-1 overflow-hidden">
        <MiniRunningPanel />
      </div>
    </aside>
  )
}
