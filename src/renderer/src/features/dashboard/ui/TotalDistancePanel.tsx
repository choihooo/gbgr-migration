import AchivementMedal from '@assets/main/achivement_meadl.svg?react'
import { useLevelQuery } from '@entities/dashboard'
import { useModal } from '@shared/hooks/use-modal'
import { LoadingSpinner } from '@shared/ui/loading'
import { PannelHeader } from '@shared/ui/panel-header'
import { Suspense, lazy } from 'react'

// TotalDistanceModal을 lazy import
const TotalDistanceModal = lazy(() => import('./TotalDistanceModal'))

const TotalDistance = () => {
  const { data, isLoading } = useLevelQuery()
  const { isOpen, open, close } = useModal()

  const level = data?.data.level ?? 1
  const current = data?.data.current ?? 0
  const required = data?.data.required ?? 1000
  const progressPercentage = (current / required) * 100

  return (
    <>
      <div className="flex flex-col pl-3">
        <div className="flex justify-between">
          <PannelHeader>
            {isLoading ? '로딩 중...' : `Level.${level + 1}  `}
          </PannelHeader>
          <button
            onClick={open}
            className="text-caption-xs-meidum cursor-pointer text-yellow-400"
          >
            자세히 보기 &gt;
          </button>
        </div>
        <p className="flex items-center gap-2">
          <span className="text-title-4xl-bold text-grey-700">
            {isLoading ? '-' : current.toLocaleString()}
          </span>
          <span className="text-body-lg-meidum text-grey-500">
            / {isLoading ? '-' : required.toLocaleString()}m
          </span>
        </p>
        {/*게이지 바*/}
        <div className="bg-grey-50 relative my-[13.5px] h-3 w-[calc(100%-16px)] items-center rounded-full">
          <div className="bg-grey-100 absolute top-[2px] left-1/3 z-0 h-2 w-2 -translate-x-1/3 rounded-full" />
          <div className="bg-grey-100 absolute top-[2px] left-2/3 z-0 h-2 w-2 -translate-x-2/3 rounded-full" />
          {/*진행바 */}
          <div
            className="relative z-10 flex h-full items-center justify-end rounded-full bg-yellow-400 py-[3px] pr-[3px] transition-all duration-1000"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          >
            <div className="h-2 w-2 rounded-full bg-yellow-100 opacity-100" />
          </div>
          <AchivementMedal className="absolute top-1/2 right-[-16px] z-10000 -translate-y-1/2" />
        </div>
        <div className="text-caption-xs-regular text-grey-300 flex w-full items-center justify-between">
          {Array.from({ length: 4 }, (_, i) => i * (required / 3)).map(
            value => (
              <span key={value}>{Math.floor(value).toLocaleString()}</span>
            ),
          )}
        </div>
      </div>
      {isOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-999999 flex h-full w-full items-center justify-center bg-black/40 dark:bg-black/70">
              <LoadingSpinner size="md" />
            </div>
          }
        >
          <TotalDistanceModal onClose={close} />
        </Suspense>
      )}
    </>
  )
}

export default TotalDistance
