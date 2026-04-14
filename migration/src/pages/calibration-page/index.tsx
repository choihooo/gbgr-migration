/**
 * 보정 화면 (/onboarding/calibration)
 *
 * 포팅 원본: src/renderer/src/pages/calibration-page/index.tsx
 * 변경점: 측정 엔진 미연결. isEngineAvailable=false 고정.
 *         008에서 true로 전환 시 실제 측정 로직 연결.
 */
import CalibrationGuide from '@/assets/common/images/calibration_guide.svg?react'
import MeasuringPanel from './components/MeasuringPanel'
import WebcamView from './components/WebcamView'
import WelcomePanel from './components/WelcomePanel'

// 008 스펙에서 측정 엔진 연결 시 true로 전환
const isEngineAvailable = false

const CalibrationPage = () => {
  // 측정 엔진 미연결 상태에서는 항상 WelcomePanel 표시
  const isCalibrating = false

  // 상태에 따른 패딩 클래스
  const paddingClass = isCalibrating
    ? 'minimum:px-[29px] labtop:px-[44px] desktop:px-[164px]'
    : 'minimum:px-[90px] labtop:px-[105px] desktop:px-[164px]'

  return (
    <main className="bg-grey-50 hbp:pt-[75px] hbp:h-[calc(100vh-75px)] flex h-[calc(100vh-60px)] flex-col items-center pt-15">
      <section
        className={`${paddingClass} flex h-screen w-full items-center justify-center`}
      >
        <div className="flex w-full justify-center gap-12">
          {/* 왼쪽 웹캠 영역 */}
          <div className="relative">
            <WebcamView isEngineAvailable={isEngineAvailable} />
            {/* 캘리브레이션 가이드 오버레이 */}
            <div className="pointer-events-none absolute inset-x-0 top-[50px] bottom-0 flex items-center justify-center">
              <CalibrationGuide className="h-full max-h-full w-full max-w-full object-contain" />
            </div>
          </div>
          {/* 오른쪽 안내 영역 */}
          {isCalibrating ? (
            <MeasuringPanel />
          ) : (
            <WelcomePanel
              isPoseDetected={isEngineAvailable}
              onStartMeasurement={() => {
                // 008에서 측정 로직 연결
              }}
              isEngineAvailable={isEngineAvailable}
            />
          )}
        </div>
      </section>
    </main>
  )
}

export default CalibrationPage
