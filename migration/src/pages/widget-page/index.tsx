import { usePostureEngineStore } from '@/entities/posture'

function WidgetPage() {
  const latestResult = usePostureEngineStore(state => state.latestResult)
  const engineState = usePostureEngineStore(state => state.engineState)

  return (
    <main className="bg-grey-50 flex min-h-screen items-center justify-center p-6">
      <section className="bg-grey-0 w-full max-w-[360px] rounded-[32px] p-6">
        <p className="text-caption-sm-medium text-grey-500 mb-2">
          자세 엔진 상태
        </p>
        <h1 className="text-title-xl-bold text-grey-900 mb-4">
          {engineState.engineStatus === 'error'
            ? '측정을 다시 확인해주세요'
            : '최신 자세 상태'}
        </h1>
        <div className="flex flex-col gap-3">
          <div className="bg-grey-50 rounded-[20px] px-4 py-3">
            <p className="text-body-sm-medium text-grey-500">모드</p>
            <p className="text-body-lg-semibold text-grey-900">
              {engineState.mode === 'background'
                ? '백그라운드 측정 중'
                : '화면 표시 측정 중'}
            </p>
          </div>
          <div className="bg-grey-50 rounded-[20px] px-4 py-3">
            <p className="text-body-sm-medium text-grey-500">최신 단계</p>
            <p className="text-body-lg-semibold text-grey-900">
              {latestResult
                ? `자세 단계 ${latestResult.postureClass}`
                : '대기 중'}
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default WidgetPage
