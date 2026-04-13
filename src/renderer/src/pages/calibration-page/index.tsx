import CalibrationGuide from '@assets/common/images/calibration_guide.svg?react'
import {
  type PoseLandmark as AnalyzerPoseLandmark,
  type CalibrationFrame,
  type PIResult,
  type WorldLandmark,
  calculateFrameBrightness,
  calculatePI,
  checkStep1Error,
  getStep2Error,
  processCalibrationData,
} from '@entities/posture'
import { AnalyticsEvents } from '@shared/lib/analytics/events'
import { lockCalibrationGate } from '@shared/lib/calibration-gate'
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type Webcam from 'react-webcam'
import MeasuringPanel from './components/MeasuringPanel'
import WebcamView from './components/WebcamView'
import WelcomePanel from './components/WelcomePanel'

interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

// EMA 스무딩 클래스 (PostureClassifier와 동일한 로직)
class EmaSmoother {
  private alpha: number
  private y: number | null = null

  constructor(alpha = 0.25) {
    this.alpha = alpha
  }

  next(x: number): number {
    this.y = this.y === null ? x : this.alpha * x + (1 - this.alpha) * this.y
    return this.y
  }

  reset() {
    this.y = null
  }
}

const CalibrationPage = () => {
  const navigate = useNavigate()
  const LOCAL_STORAGE_KEY = 'calibration_result_v1'
  const [detectedLandmarks, setDetectedLandmarks] = useState<PoseLandmark[]>([])
  const [isPoseDetected, setIsPoseDetected] = useState(false)
  // 최신 랜드마크 값을 읽기 위한 ref (useEffect 재시작 없이 읽기)
  const detectedLandmarksRef = useRef<PoseLandmark[]>([])

  // 캘리브레이션 상태
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [remainingTime, setRemainingTime] = useState(5)
  const worldLandmarksRef = useRef<WorldLandmark[]>([])

  // 예외 케이스 에러 메시지 상태
  const [step1Error, setStep1Error] = useState<string | null>(null) // Step 1 에러 (WelcomePanel용)
  const [step2Error, setStep2Error] = useState<string | null>(null) // Step 2 에러 (MeasuringPanel step={2}용)

  // 비디오 ref 저장
  const videoRefRef = useRef<RefObject<Webcam> | null>(null)

  const handlePoseDetected = (
    landmarks: PoseLandmark[],
    detectedWorldLandmarks?: WorldLandmark[],
  ) => {
    setDetectedLandmarks(landmarks)
    detectedLandmarksRef.current = landmarks
    if (detectedWorldLandmarks !== undefined) {
      worldLandmarksRef.current = detectedWorldLandmarks
    }
    setIsPoseDetected(landmarks.length > 0)
  }

  // 캘리브레이션 시작
  const startCalibration = useCallback(() => {
    // 스텝 1 에러가 있으면 시작하지 않음
    if (step1Error) {
      return
    }

    setIsCalibrating(true)
    setRemainingTime(5)
    setStep2Error(null)
  }, [step1Error])

  // 캘리브레이션 중단
  const stopCalibration = () => {
    setIsCalibrating(false)
  }

  // 캘리브레이션 취소

  // 측정하기 버튼 클릭
  const handleStartMeasurement = useCallback(() => {
    if (detectedLandmarks.length > 0 && !step1Error) {
      setTimeout(() => {
        startCalibration()
      }, 1000)
    }
  }, [detectedLandmarks.length, step1Error, startCalibration])

  // 캘리브레이션 처리
  /* eslint-disable react-hooks/purity */
  const startTimeRef = useRef<number>(Date.now())
  const framesRef = useRef<
    Array<{
      lms: PoseLandmark[]
      pi: PIResult
      worldLms: WorldLandmark[]
      pi_ema?: number
      brightness?: number
    }>
  >([])
  const emaSmootherRef = useRef<EmaSmoother>(new EmaSmoother(0.25))

  // 이전 에러 상태 추적용 ref
  const prevStep2ErrorRef = useRef<string | null>(null)
  const errorResetTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!isCalibrating) return

    // 캘리브레이션 시작 시 초기화
    startTimeRef.current = Date.now()
    framesRef.current = []
    emaSmootherRef.current.reset()
    setRemainingTime(5)
    setStep2Error(null)
    prevStep2ErrorRef.current = null
    errorResetTimeRef.current = 0
  }, [isCalibrating])

  // 캘리브레이션 타이머 및 데이터 수집
  useEffect(() => {
    if (!isCalibrating) return

    // 타이머 업데이트 (1초마다)
    const timerInterval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.max(0, Math.ceil((5000 - elapsed) / 1000))
      setRemainingTime(remaining)

      if (elapsed >= 5000) {
        clearInterval(timerInterval)
        clearInterval(dataInterval)
        stopCalibration()
        const result = processCalibrationData(framesRef.current, true)
        if (result.success) {
          // 측정 완료 수치를 한 번만 콘솔에 출력
          console.log('측정 완료 수치', {
            mu_PI: (result.mu_PI || 0).toFixed(4),
            sigma_PI: (result.sigma_PI || 0).toFixed(4),
            passRate: `${((result.passRate || 0) * 100).toFixed(1)}%`,
            quality: result.quality || 'unknown',
            nPass: result.nPass || 0,
            nTotal: result.nTotal || 0,
          })

          // 로컬 스토리지 저장
          try {
            const payload = {
              mu_PI: result.mu_PI || 0,
              sigma_PI: result.sigma_PI || 0,
              passRate: result.passRate || 0,
              quality: result.quality || 'unknown',
              nPass: result.nPass || 0,
              nTotal: result.nTotal || 0,
              timestamp: Date.now(),
            }
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload))
            const userId = localStorage.getItem('userId')
            lockCalibrationGate(userId)

            // GA calibration_complete 이벤트 전송
            if (userId) {
              AnalyticsEvents.calibrationComplete({ user_id: userId })
            } else {
              console.warn('[GA] calibration_complete: user_id is missing')
            }
          } catch {
            // 저장 실패 시 무시 (사일런트)
          }

          // 완료 페이지로 이동
          navigate('/onboarding/completion')
        } else {
          console.error('캘리브레이션 실패:', result.message)
        }
      }
    }, 1000) // 1초마다 타이머 업데이트

    // 데이터 수집 및 스텝 2 예외 케이스 체크 (100ms마다)
    const dataInterval = setInterval(() => {
      const current2D = detectedLandmarksRef.current
      const currentWorld = worldLandmarksRef.current

      if (current2D.length === 0 && currentWorld.length === 0) return

      const landmarksToUse = currentWorld.length > 0 ? currentWorld : current2D
      if (landmarksToUse.length === 0) return

      const pi = calculatePI(
        current2D as AnalyzerPoseLandmark[],
        landmarksToUse,
      )
      if (!pi) return

      // EMA 적용 (메인과 동일한 방식)
      const pi_ema = emaSmootherRef.current.next(pi.PI_raw)

      // 비디오 프레임의 밝기 계산
      let brightness: number | undefined = undefined
      if (videoRefRef.current?.current?.video) {
        const brightnessValue = calculateFrameBrightness(
          videoRefRef.current.current.video,
        )
        if (brightnessValue !== null) {
          brightness = brightnessValue
        }
      }

      // const frontality = checkFrontality(current2D as AnalyzerPoseLandmark[]);

      framesRef.current.push({
        lms: current2D,
        pi,
        worldLms: currentWorld,
        pi_ema, // EMA 적용된 값 저장
        brightness, // 프레임 밝기 저장
      })

      // frames가 너무 많이 쌓이지 않도록 제한 (최대 50개)
      if (framesRef.current.length > 50) {
        framesRef.current.shift() // 가장 오래된 프레임 제거
      }

      // 스텝 1 에러 체크 (실시간)
      const step1Err = checkStep1Error(
        current2D as AnalyzerPoseLandmark[],
        landmarksToUse,
      )

      // 스텝 1 에러가 발생했거나 계속 발생 중이면 시간 리셋
      if (step1Err) {
        startTimeRef.current = Date.now()
        setRemainingTime(5)
        errorResetTimeRef.current = Date.now()
        setStep1Error(step1Err)
        // Step 1 에러가 있으면 Step 2 체크 건너뛰기
        setStep2Error(null)
        return
      }

      setStep1Error(step1Err)

      // 스텝 2 예외 케이스 실시간 체크 (충분한 프레임이 쌓인 후, Step 1 에러가 없을 때만)
      if (framesRef.current.length >= 5) {
        const error = getStep2Error(framesRef.current as CalibrationFrame[])

        // 에러가 발생했거나 계속 발생 중이면 시간 리셋 (frames는 유지)
        if (error) {
          startTimeRef.current = Date.now()
          setRemainingTime(5)
          errorResetTimeRef.current = Date.now()
        }

        setStep2Error(error)
      } else {
        // 프레임이 충분하지 않으면 에러 초기화
        setStep2Error(null)
      }
    }, 100) // 100ms마다 데이터 수집

    return () => {
      clearInterval(timerInterval)
      clearInterval(dataInterval)
    }
  }, [isCalibrating, navigate])

  // 상태에 따른 패딩 클래스
  const paddingClass = isCalibrating
    ? 'minimum:px-[29px] labtop:px-[44px] desktop:px-[164px]' // MeasuringPanel 상태
    : 'minimum:px-[90px] labtop:px-[105px] desktop:px-[164px]' // WelcomePanel 상태

  return (
    <main className="bg-grey-50 hbp:pt-[75px] hbp:h-[calc(100vh-75px)] flex h-[calc(100vh-60px)] flex-col items-center pt-15">
      <section
        className={`${paddingClass} flex h-screen w-full items-center justify-center`}
      >
        {/* 메인 콘텐츠 영역 */}
        <div className="flex w-full justify-center gap-12">
          {/* 왼쪽 웹캠 영역 */}
          <div className="relative">
            <WebcamView
              onPoseDetected={handlePoseDetected}
              showPoseOverlay={true}
              showTimer={isCalibrating}
              remainingTime={remainingTime}
              onVideoRefReady={ref => {
                videoRefRef.current = ref
              }}
            />
            {/* 캘리브레이션 가이드 오버레이 (캘리브레이션 중일 때만) */}

            <div className="pointer-events-none absolute inset-x-0 top-[50px] bottom-0 flex items-center justify-center">
              <CalibrationGuide className="h-full max-h-full w-full max-w-full object-contain" />
            </div>
          </div>
          {/* 오른쪽 안내 영역 */}
          {isCalibrating ? (
            <MeasuringPanel step1Error={step1Error} step2Error={step2Error} />
          ) : (
            <WelcomePanel
              isPoseDetected={isPoseDetected}
              onStartMeasurement={handleStartMeasurement}
            />
          )}
        </div>
      </section>
    </main>
  )
}

export default CalibrationPage
