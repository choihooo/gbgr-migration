/* 위젯 창에 표시될 페이지 - 반응형 */

import {
  type PoseLandmark as AnalyzerPoseLandmark,
  PostureClassifier,
  type WorldLandmark,
  calculatePI,
  checkFrontality,
  usePostureStore,
} from '@entities/posture'
import { WebcamView } from '@features/calibration/ui'
import { useCameraStore } from '@widgets/camera'
import { usePostureSyncWithLocalStorage } from '@widgets/widget/ui/hooks/usePostureSyncWithLocalStorage'
import { useThemeSync } from '@widgets/widget/ui/hooks/useThemeSync'
import { useEffect, useRef, useState } from 'react'
import { WidgetTitleBar } from './WidgetTitleBar/WidgetTitleBar'
import { MediumWidgetContent } from './components/MediumWidgetContent'
import { MiniWidgetContent } from './components/MiniWidgetContent'

type WidgetSize = 'mini' | 'medium'

/* 레이아웃 전환 기준점 */
const BREAKPOINT = {
  height: 62,
} as const

const LOCAL_STORAGE_KEY = 'calibration_result_v1'
const MAIN_WINDOW_ACTIVE_KEY = 'main-window-active'
const MAIN_WINDOW_TIMEOUT_MS = 2000 // 2초 이내 업데이트가 없으면 메인 창이 비활성화된 것으로 간주

const WidgetPage = () => {
  const [widgetSize, setWidgetSize] = useState<WidgetSize>('medium')
  const [isMainWindowActive, setIsMainWindowActive] = useState(false)
  const currentPostureClass = usePostureStore(state => state.postureClass)
  const setStatus = usePostureStore(state => state.setStatus)
  const { setShow, setHide } = useCameraStore()

  // PostureClassifier 인스턴스
  const classifierRef = useRef(new PostureClassifier())

  // 메인 창 활성화 상태 확인
  useEffect(() => {
    const checkMainWindowStatus = () => {
      const lastUpdateTime = localStorage.getItem(MAIN_WINDOW_ACTIVE_KEY)
      if (!lastUpdateTime) {
        setIsMainWindowActive(false)
        return
      }

      const timeSinceUpdate = Date.now() - Number.parseInt(lastUpdateTime, 10)
      const isActive = timeSinceUpdate < MAIN_WINDOW_TIMEOUT_MS
      setIsMainWindowActive(isActive)
    }

    // 초기 확인
    checkMainWindowStatus()

    // 주기적으로 확인 (500ms마다)
    const interval = setInterval(checkMainWindowStatus, 500)

    // storage 이벤트로도 확인 (메인 창이 상태를 업데이트할 때)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === MAIN_WINDOW_ACTIVE_KEY) {
        checkMainWindowStatus()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // 메인 창 상태에 따라 카메라 제어
  useEffect(() => {
    if (isMainWindowActive) {
      // 메인 창이 활성화되어 있으면 위젯의 카메라는 숨김
      setHide()
    } else {
      // 메인 창이 없으면 위젯의 카메라 시작
      setShow()
    }
  }, [isMainWindowActive, setShow, setHide])

  // 캘리브레이션 로드
  const calib = (() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return { mu: parsed.mu_PI as number, sigma: parsed.sigma_PI as number }
    } catch {
      return null
    }
  })()

  // 캘리브레이션이 로드될 때 초기화
  useEffect(() => {
    if (calib) {
      classifierRef.current.reset()
    }
  }, [calib])

  // 포즈 감지 핸들러
  const handlePoseDetected = async (
    landmarks: AnalyzerPoseLandmark[],
    worldLandmarks?: WorldLandmark[],
  ) => {
    // 메인 창이 활성화되어 있으면 위젯은 판정을 하지 않음
    if (isMainWindowActive) return

    if (!calib) return // 캘리브레이션 없으면 판정 중지
    if (!landmarks || landmarks.length === 0) return

    const world =
      worldLandmarks && worldLandmarks.length > 0
        ? worldLandmarks
        : (landmarks as unknown as WorldLandmark[])
    const pi = calculatePI(landmarks, world)
    if (!pi) return
    const frontal = checkFrontality(landmarks)

    // PostureClassifier로 판정 수행
    const result = classifierRef.current.classify(
      pi,
      calib.mu,
      calib.sigma,
      frontal,
    )

    // 상태 업데이트
    setStatus(result.cls, result.Score)
  }

  /* usePostureStore에서 실시간 자세 상태 가져오기 */

  /* 실시간 자세 상태 동기화 (메인 창과의 동기화는 유지하되, 위젯 자체 판정도 수행) */
  usePostureSyncWithLocalStorage()

  /* 위젯 라이트/다크 모드 */
  useThemeSync()

  /* 위젯 페이지 로드 시 로그 */
  useEffect(() => {
    console.log('위젯 페이지가 로드되었습니다')

    if (window.electronAPI?.writeLog) {
      const logData = JSON.stringify({
        event: 'widget_page_loaded',
        timestamp: new Date().toISOString(),
      })
      window.electronAPI.writeLog(logData).catch((error: unknown) => {
        console.error('위젯 페이지 로드 로그 저장 실패:', error)
      })
    }
  }, [])

  /* 위젯 resize 이벤트 */
  useEffect(() => {
    /* resize 디바운스 타이머 ID 저장용 변수 */
    let resizeTimeout: number

    /* 창 크기 변경 감지 핸들러 */
    const handleResize = () => {
      const isMedium = innerHeight > BREAKPOINT.height
      /* breakpoint를 넘으면 medium, 아니면 mini */
      setWidgetSize(isMedium ? 'medium' : 'mini')
    }

    /* 디바운스 래퍼 함수 */
    const handleResizeDebounced = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = window.setTimeout(() => {
        handleResize()
      }, 10)
    }

    handleResize()
    window.addEventListener('resize', handleResizeDebounced)

    return () => {
      window.removeEventListener('resize', handleResizeDebounced)
      clearTimeout(resizeTimeout)
    }
  }, [])

  const isMini = widgetSize === 'mini'

  return (
    <div className="bg-grey-0 h-screen w-screen overflow-hidden rounded-lg px-[4px] py-[3px]">
      <div className={isMini ? 'flex h-full w-full' : 'h-full w-full'}>
        {/* 커스텀 타이틀바 */}
        <WidgetTitleBar isMini={isMini} />

        {/* 위젯 내용 - 창 크기에 따라 자동 전환 */}
        {isMini ? (
          <MiniWidgetContent posture={currentPostureClass} />
        ) : (
          <MediumWidgetContent posture={currentPostureClass} />
        )}

        {/* 숨겨진 WebcamView - 메인 창이 없을 때만 위젯에서 독립적으로 포즈 감지 및 판정 수행 */}
        {!isMainWindowActive && (
          <div className="fixed -z-10 h-0 w-0 opacity-0">
            <WebcamView
              onPoseDetected={handlePoseDetected}
              showPoseOverlay={false}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default WidgetPage
