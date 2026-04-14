import { cn } from '@/shared/lib/cn'
import { useCameraStore } from '../model/use-camera-store'

function ExitPanel() {
  const lastSessionId =
    typeof window !== 'undefined'
      ? localStorage.getItem('lastSessionId') ||
        localStorage.getItem('sessionId')
      : null

  return (
    <section className="py-6">
      <div className="mb-12 flex flex-col">
        <h2 className="text-caption-sm-medium text-grey-400">오늘의 리포트</h2>
        <p className="text-headline-3xl-semibold text-grey-700">
          오늘 총 0m 이동했어요
        </p>
        <p className="text-caption-xs-regular text-grey-300 mt-2">
          {lastSessionId
            ? `마지막 세션 ID: ${lastSessionId}`
            : '아직 기록된 세션이 없어요'}
        </p>
      </div>

      <div className="relative mb-12 flex justify-center">
        <div className="bg-grey-25 relative h-[212px] w-[212px] rounded-full">
          <div className="bg-yellow-400 absolute inset-5 rounded-full opacity-90" />
          <div className="bg-grey-0 absolute inset-10 flex flex-col items-center justify-center rounded-full">
            <p className="text-caption-sm-regular text-grey-500">사용시간</p>
            <p className="text-headline-2xl-semibold text-grey-600">
              0시간 0분
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-7">
        <div className="flex items-center">
          <div className="bg-yellow-400 h-4 w-2 rounded-full" />
          <p className="ml-1 flex flex-1 items-center justify-between">
            <span className="text-body-md-medium text-grey-400">
              바른 자세 시간
            </span>
            <span className="text-headline-2xl-semibold text-grey-600">0%</span>
          </p>
        </div>

        <div className="bg-grey-25 flex flex-col rounded-[24px] p-5">
          <p className="flex flex-col gap-2 px-5">
            <span className="text-body-sm-medium text-grey-400">
              바른 자세 점수
            </span>
            <span className="text-body-xl-semibold text-grey-600">0점</span>
          </p>
        </div>
      </div>
    </section>
  )
}

function RunningPanel() {
  const cameraState = useCameraStore(state => state.cameraState)
  const isVisible = cameraState === 'show'

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-caption-sm-medium text-grey-400">
          {isVisible ? '씽씽 가는 중!' : '천천히 가는 중'}
        </p>
      </div>

      <div className="relative h-[421px] w-full overflow-hidden rounded-xl bg-[linear-gradient(180deg,#F9F8F7_0%,#EFEEED_100%)]">
        <div className="relative z-10 mx-4 mt-4">
          <div className="bg-grey-50 relative h-5 w-full rounded-full">
            <div
              className={cn(
                'flex h-full items-center justify-end rounded-full py-[3px] pr-[3px] transition-all duration-1000',
                isVisible
                  ? 'bg-[linear-gradient(90deg,var(--color-olive-green)_0.18%,var(--color-success)_99.7%)]'
                  : 'bg-[linear-gradient(90deg,var(--color-coral-red)_0%,var(--color-error)_100%)]',
              )}
              style={{ width: isVisible ? '50%' : '75%' }}
            >
              <div className="bg-dot h-[14px] w-[14px] rounded-full opacity-50" />
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12 flex items-center justify-center px-4">
          <div className="relative flex h-[280px] w-full items-end justify-center rounded-[32px] bg-white/60">
            <div className="absolute inset-x-16 bottom-0 h-[168px] rounded-t-[999px] bg-yellow-100/90" />
            <div className="absolute inset-x-24 bottom-0 h-[196px] rounded-t-[999px] bg-yellow-300/90" />
            <div className="absolute left-1/2 bottom-[160px] h-[42px] w-[42px] -translate-x-1/2 rounded-full bg-yellow-400" />
          </div>
        </div>
      </div>
    </section>
  )
}

export function MiniRunningPanel() {
  const { cameraState } = useCameraStore()

  return cameraState === 'exit' ? <ExitPanel /> : <RunningPanel />
}
