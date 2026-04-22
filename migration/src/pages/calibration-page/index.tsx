import { useCallback, useEffect, useState } from 'react'
import CalibrationGuide from '@/assets/common/images/calibration_guide.svg?react'
import type { PostureEngineResult } from '@/entities/posture'
import { useWindowVisibilitySync } from '@/features/posture-engine'
import MeasuringPanel from './components/MeasuringPanel'
import WebcamView from './components/WebcamView'
import WelcomePanel from './components/WelcomePanel'

const CalibrationPage = () => {
  const [mode, setMode] = useState<'foreground' | 'background'>('foreground')
  const [latestResult, setLatestResult] = useState<PostureEngineResult | null>(
    null,
  )
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [remainingTime, setRemainingTime] = useState(5)
  const [step1Error, setStep1Error] = useState<string | null>(
    '화면 가이드 안으로 들어오면 측정을 시작할 수 있어요',
  )
  const [step2Error, setStep2Error] = useState<string | null>(null)

  useWindowVisibilitySync(setMode)

  const isPoseDetected = (latestResult?.landmarks.length ?? 0) > 0
  const isEngineAvailable = true

  const handleStartMeasurement = useCallback(() => {
    if (!isPoseDetected) {
      setStep1Error('상반신이 가이드 안에 들어오도록 자세를 맞춰주세요')
      return
    }

    setStep1Error(null)
    setStep2Error(null)
    setRemainingTime(5)
    setIsCalibrating(true)
  }, [isPoseDetected])

  useEffect(() => {
    if (!isPoseDetected) {
      setStep1Error('상반신이 가이드 안에 들어오도록 자세를 맞춰주세요')
      if (isCalibrating) {
        setStep2Error('자세 감지가 끊겨 측정을 다시 준비하고 있어요')
        setRemainingTime(5)
      }
      return
    }

    setStep1Error(null)
    if (!isCalibrating) {
      setStep2Error(null)
    }
  }, [isCalibrating, isPoseDetected])

  useEffect(() => {
    if (!isCalibrating) return
    if (!isPoseDetected) return

    const interval = window.setInterval(() => {
      setRemainingTime(value => {
        if (value <= 1) {
          window.clearInterval(interval)
          setIsCalibrating(false)
          return 0
        }

        return value - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [isCalibrating, isPoseDetected])

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
            <WebcamView
              isActive={true}
              mode={mode}
              showTimer={isCalibrating}
              remainingTime={remainingTime}
              onResultChange={setLatestResult}
            />
            {/* 캘리브레이션 가이드 오버레이 */}
            <div className="pointer-events-none absolute inset-x-0 top-[50px] bottom-0 flex items-center justify-center">
              <CalibrationGuide className="h-full max-h-full w-full max-w-full object-contain" />
            </div>
          </div>
          {/* 오른쪽 안내 영역 */}
          {isCalibrating ? (
            <MeasuringPanel
              step1Error={step1Error}
              step2Error={step2Error}
              engineMessage={
                mode === 'background'
                  ? '앱이 숨겨져 있어 최신 상태만 유지하고 있어요'
                  : null
              }
            />
          ) : (
            <WelcomePanel
              isPoseDetected={isPoseDetected}
              onStartMeasurement={handleStartMeasurement}
              isEngineAvailable={isEngineAvailable}
            />
          )}
        </div>
      </section>
    </main>
  )
}

export default CalibrationPage
