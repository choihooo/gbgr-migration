const LevelProgressPanel = () => {
  return (
    <div className="border-grey-100 col-span-12 rounded-2xl border bg-white p-5">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-body-lg-medium text-grey-500 mb-1">
            LV.2 거부기까지
          </p>
          <p className="text-title-2xl-bold text-grey-900">400 / 1,000m</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="bg-grey-100 h-2 w-full rounded-full">
          <div className="bg-warning-400 h-2 w-2/5 rounded-full" />
        </div>
        <div className="text-caption-md-regular text-grey-400 mt-2 flex justify-between">
          <span>10</span>
          <span>400</span>
          <span>800</span>
          <span>1,000</span>
        </div>
      </div>
    </div>
  )
}

export default LevelProgressPanel
