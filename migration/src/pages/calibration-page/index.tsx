import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CalibrationGuide from '@/assets/common/images/calibration_guide.svg?react'
import type { PostureEngineResult } from '@/entities/posture'
import { usePostureEngineStore } from '@/entities/posture'
import {
  calibrateCameraFrame,
  calibrateFinish,
  calibrateStart,
} from '@/features/posture-engine'
import { AUTH_STORAGE_KEYS } from '@/shared/lib/auth'
import { lockCalibrationGate } from '@/shared/lib/calibration-gate'
import MeasuringPanel from './components/MeasuringPanel'
import WebcamView from './components/WebcamView'
import WelcomePanel from './components/WelcomePanel'

const CALIBRATION_DURATION_MS = 5000
const FRAME_INTERVAL_MS = 100

const CalibrationPage = () => {
  const navigate = useNavigate()
  const [latestResult, setLatestResult] = useState<PostureEngineResult | null>(
    null,
  )
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [calibrationPoseDetected, setCalibrationPoseDetected] = useState(false)
  const [remainingTime, setRemainingTime] = useState(
    CALIBRATION_DURATION_MS / 1000,
  )
  const [step1Error, setStep1Error] = useState<string | null>(
    '화면 가이드 안으로 들어오면 측정을 시작할 수 있어요',
  )
  const [step2Error, setStep2Error] = useState<string | null>(null)

  const calibIntervalRef = useRef<number | null>(null)

  const { engineState } = usePostureEngineStore()
  const isEngineAvailable =
    engineState.engineStatus !== 'error' && engineState.engineStatus !== 'idle'

  const latestPoseDetected = (latestResult?.landmarks.length ?? 0) > 0
  const isPoseDetected = isCalibrating
    ? calibrationPoseDetected
    : latestPoseDetected

  // 캘리브레이션 중 오류 감지 시 타이머 리셋
  const resetTimer = useCallback(() => {
    setRemainingTime(CALIBRATION_DURATION_MS / 1000)
    if (calibIntervalRef.current !== null) {
      window.clearInterval(calibIntervalRef.current)
      calibIntervalRef.current = null
    }
  }, [])

  // 포즈 감지 상태 변화
  useEffect(() => {
    if (!isPoseDetected) {
      setStep1Error('상반신이 가이드 안에 들어오도록 자세를 맞춰주세요')
      if (isCalibrating) {
        setStep2Error('자세 감지가 끊겨 측정을 다시 준비하고 있어요')
        resetTimer()
      }
      return
    }

    setStep1Error(null)
    if (!isCalibrating) {
      setStep2Error(null)
    }
  }, [isCalibrating, isPoseDetected, resetTimer])

  useEffect(() => {
    if (isCalibrating) {
      return
    }

    setCalibrationPoseDetected(latestPoseDetected)
  }, [isCalibrating, latestPoseDetected])

  // 캘리브레이션 프레임 전송 루프
  useEffect(() => {
    if (!isCalibrating) return

    const sessionId = localStorage.getItem('sessionId') ?? 'calibration-session'

    calibIntervalRef.current = window.setInterval(async () => {
      try {
        const result = await calibrateCameraFrame({
          sessionId,
          capturedAt: new Date().toISOString(),
        })
        const detected =
          result.status !== 'no_detection' && result.status !== 'no_pi'
        setCalibrationPoseDetected(detected)

        if (result.step1Error) {
          setStep1Error(result.step1Error)
        } else if (detected) {
          setStep1Error(null)
        }

        if (result.step2Error) {
          setStep2Error(result.step2Error)
        } else {
          setStep2Error(null)
        }
      } catch (err) {
        console.error('[calibration] 프레임 전송 오류:', err)
      }
    }, FRAME_INTERVAL_MS)

    return () => {
      if (calibIntervalRef.current !== null) {
        window.clearInterval(calibIntervalRef.current)
        calibIntervalRef.current = null
      }
    }
  }, [isCalibrating])

  // 1초 카운트다운 타이머
  useEffect(() => {
    if (!isCalibrating || !isPoseDetected) return

    const interval = window.setInterval(() => {
      setRemainingTime(value => {
        if (value <= 1) {
          window.clearInterval(interval)
          return 0
        }
        return value - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [isCalibrating, isPoseDetected])

  // 타이머 종료 시 캘리브레이션 완료 처리
  useEffect(() => {
    if (!isCalibrating || remainingTime > 0) return

    void (async () => {
      try {
        // 프레임 전송 중지
        if (calibIntervalRef.current !== null) {
          window.clearInterval(calibIntervalRef.current)
          calibIntervalRef.current = null
        }

        const result = await calibrateFinish()

        if (result.success && result.muPi != null && result.sigmaPi != null) {
          // localStorage에 캘리브레이션 결과 저장
          const payload = {
            mu_PI: result.muPi,
            sigma_PI: result.sigmaPi,
            passRate: result.passRate ?? 0,
            quality: result.quality ?? 'unknown',
            nPass: result.nPass ?? 0,
            nTotal: result.nTotal ?? 0,
            timestamp: Date.now(),
          }
          localStorage.setItem('calibration_result_v1', JSON.stringify(payload))

          // 캘리브레이션 게이트 잠금
          const userId = localStorage.getItem(AUTH_STORAGE_KEYS.userId)
          lockCalibrationGate(userId)

          // 보정 완료 후 레거시와 동일하게 완료 페이지로 이동
          navigate('/onboarding/completion', { replace: true })
        } else {
          setStep2Error(
            result.message ?? '캘리브레이션에 실패했어요. 다시 시도해주세요.',
          )
          setIsCalibrating(false)
          setRemainingTime(CALIBRATION_DURATION_MS / 1000)
        }
      } catch (err) {
        console.error('[calibration] 완료 처리 오류:', err)
        setStep2Error('캘리브레이션 처리 중 오류가 발생했어요')
        setIsCalibrating(false)
        setRemainingTime(CALIBRATION_DURATION_MS / 1000)
      }
    })()
  }, [isCalibrating, remainingTime, navigate])

  const handleStartMeasurement = useCallback(async () => {
    if (!isPoseDetected) {
      setStep1Error('상반신이 가이드 안에 들어오도록 자세를 맞춰주세요')
      return
    }

    try {
      await calibrateStart()
      setStep1Error(null)
      setStep2Error(null)
      setCalibrationPoseDetected(latestPoseDetected)
      setRemainingTime(CALIBRATION_DURATION_MS / 1000)
      setIsCalibrating(true)
    } catch (err) {
      console.error('[calibration] 시작 오류:', err)
      setStep2Error('캘리브레이션을 시작할 수 없어요')
    }
  }, [isPoseDetected, latestPoseDetected])

  // 상태에 따른 패딩 클래스
  const paddingClass = isCalibrating
    ? 'minimum:px-[29px] labtop:px-[44px] desktop:px-[164px]'
    : 'minimum:px-[90px] labtop:px-[105px] desktop:px-[164px]'

  return (
    <main className="bg-grey-50 hbp:pt-[75px] hbp:h-[calc(100vh-75px)] flex h-[calc(100vh-60px)] flex-col items-center overflow-x-hidden pt-15">
      <section
        className={`${paddingClass} flex h-full w-full items-center justify-center py-6 xl:py-0`}
      >
        <div className="flex w-full max-w-[1440px] flex-col items-center justify-center gap-8 xl:flex-row xl:items-start xl:gap-12">
          {/* 왼쪽 웹캠 영역 */}
          <div className="relative w-full max-w-[760px] shrink-0">
            <WebcamView
              isActive={true}
              mode="foreground"
              showTimer={isCalibrating}
              remainingTime={remainingTime}
              onResultChange={setLatestResult}
              disableFramePush={isCalibrating}
              ignoreCameraState={true}
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
              engineMessage={null}
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
