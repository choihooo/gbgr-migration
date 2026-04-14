import { AttendancePanel } from '@/features/main-panels/ui/AttendancePanel'
import { AverageGraphPanel } from '@/features/main-panels/ui/AverageGraphPanel'
import { AveragePosturePanel } from '@/features/main-panels/ui/AveragePosturePanel'
import { HighlightsPanel } from '@/features/main-panels/ui/HighlightsPanel'
import { PosePatternPanel } from '@/features/main-panels/ui/PosePatternPanel'
import { TotalDistancePanel } from '@/features/main-panels/ui/TotalDistancePanel'

export function LeftPanelArea() {
  return (
    <div
      className="custom-scrollbar flex h-full min-h-full w-full flex-col overflow-y-auto overscroll-y-contain pr-4"
      data-testid="left-panel-area"
    >
      <div className="mb-4 grid h-[268px] shrink-0 grid-cols-[1fr_2fr] gap-4">
        <AveragePosturePanel />
        <div className="bg-grey-0 rounded-3xl">
          <AttendancePanel />
        </div>
      </div>

      <div className="flex min-h-max flex-1 items-stretch gap-4">
        <div className="@container flex min-h-0 w-full min-w-[552px] flex-1 flex-col items-start gap-4 self-stretch">
          <div className="bg-grey-0 relative h-[170px] w-full shrink-0 rounded-3xl">
            <TotalDistancePanel />
          </div>

          <div className="grid min-h-0 w-full flex-1 grid-cols-1 gap-4 @[562px]:grid-cols-2">
            <div className="bg-grey-0 h-full min-h-[224px] w-full min-w-[270px] rounded-3xl @[552px]:min-h-[210px]">
              <AverageGraphPanel />
            </div>
            <div className="bg-grey-0 h-full min-h-[224px] w-full min-w-[270px] rounded-3xl @[552px]:min-h-[210px]">
              <HighlightsPanel />
            </div>
          </div>
        </div>

        <div className="bg-grey-0 min-h-[300px] w-full max-w-[330px] min-w-[330px] flex-1 rounded-3xl">
          <PosePatternPanel />
        </div>
      </div>
    </div>
  )
}
