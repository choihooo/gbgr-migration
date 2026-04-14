import { useLevelQuery } from '@/entities/dashboard/model/use-dashboard-queries'
import { PanelHeader } from '@/shared/ui/panel-header'

function MedalIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-yellow-400"
      aria-hidden="true"
    >
      <title>레벨 메달</title>
      <circle cx="14" cy="16" r="8" fill="currentColor" />
      <path d="M10 2H13L14 7H11L10 2Z" fill="#FFE28A" />
      <path d="M15 2H18L17 7H14L15 2Z" fill="#FFBF00" />
      <circle cx="14" cy="16" r="4" fill="#FFF9E6" />
    </svg>
  )
}

export function TotalDistancePanel() {
  const { data, isLoading } = useLevelQuery()
  const level = data?.data.level ?? 1
  const current = data?.data.current ?? 0
  const required = Math.max(data?.data.required ?? 1000, 1)
  const progress = Math.min((current / required) * 100, 100)

  return (
    <section className="relative h-full w-full py-5 pr-4 pl-2">
      <div className="flex h-full flex-col pl-3">
        <div className="flex justify-between">
          <PanelHeader>
            {isLoading ? '로딩 중...' : `Level.${level + 1}`}
          </PanelHeader>
          <button
            type="button"
            className="text-caption-xs-meidum text-yellow-400"
          >
            자세히 보기 &gt;
          </button>
        </div>
        <p className="flex items-center gap-2">
          <span className="text-title-4xl-bold text-grey-700">
            {isLoading ? '-' : current.toLocaleString()}
          </span>
          <span className="text-body-lg-medium text-grey-500">
            / {isLoading ? '-' : required.toLocaleString()}m
          </span>
        </p>

        <div className="bg-grey-50 relative my-[13.5px] h-3 w-[calc(100%-16px)] rounded-full">
          <div className="bg-grey-100 absolute top-[2px] left-1/3 h-2 w-2 -translate-x-1/3 rounded-full" />
          <div className="bg-grey-100 absolute top-[2px] left-2/3 h-2 w-2 -translate-x-2/3 rounded-full" />
          <div
            className="relative z-10 flex h-full items-center justify-end rounded-full bg-yellow-400 py-[3px] pr-[3px] transition-all duration-1000"
            style={{ width: `${progress}%` }}
          >
            <div className="h-2 w-2 rounded-full bg-yellow-100" />
          </div>
          <div className="absolute top-1/2 right-[-16px] -translate-y-1/2">
            <MedalIcon />
          </div>
        </div>

        <div className="text-caption-xs-regular text-grey-300 flex w-full items-center justify-between">
          {Array.from({ length: 4 }, (_, index) =>
            Math.floor(index * (required / 3)),
          ).map(value => (
            <span key={value}>{value.toLocaleString()}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
