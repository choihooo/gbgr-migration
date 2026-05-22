import { type RefObject, useEffect, useRef, useState } from 'react'
import type Webcam from 'react-webcam'
import SleepIcon from '@/assets/common/icons/sleep.svg'
import { PoseOverlayCanvas, type PostureEngineResult } from '@/entities/posture'
import { useCameraStore } from '@/features/main-panels/model/use-camera-store'
import { usePostureEngine } from '@/features/posture-engine'
import { Timer } from '@/shared/ui/timer'

interface WebcamViewProps {
  showTimer?: boolean
  remainingTime?: number
  onVideoRefReady?: (videoRef: RefObject<Webcam>) => void
  isActive?: boolean
  mode?: 'foreground' | 'background'
  onResultChange?: (result: PostureEngineResult | null) => void
  /** true면 usePostureEngine의 프레임 전송(120ms)을 비활성화 */
  disableFramePush?: boolean
}

const WebcamView = ({
  showTimer = false,
  remainingTime = 0,
  onVideoRefReady,
  isActive = true,
  mode = 'foreground',
  onResultChange,
  disableFramePush = false,
}: WebcamViewProps) => {
  const emptyWebcamRef = useRef<Webcam>(null)
  const {
    overlayLandmarks,
    latestResult,
    engineState,
    runtimeAvailable,
    streamUrl,
  } = usePostureEngine({
    active: isActive,
    mode,
    disableFramePush,
  })
  const { cameraState } = useCameraStore()

  useEffect(() => {
    if (onVideoRefReady) {
      onVideoRefReady(emptyWebcamRef as RefObject<Webcam>)
    }
  }, [onVideoRefReady])

  useEffect(() => {
    onResultChange?.(latestResult)
  }, [latestResult, onResultChange])

  const containerRef = useRef<HTMLDivElement>(null)
  const [videoDimensions, setVideoDimensions] = useState({
    width: 760,
    height: 428,
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateDimensions = () => {
      const { clientWidth, clientHeight } = container
      if (clientWidth > 0 && clientHeight > 0) {
        setVideoDimensions({ width: clientWidth, height: clientHeight })
      }
    }

    updateDimensions()

    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(updateDimensions)
    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [])

  const shouldRenderSidecarStream = cameraState === 'show' && Boolean(streamUrl)

  const isEngineAvailable =
    runtimeAvailable && engineState.engineStatus !== 'error'

  if (!isEngineAvailable) {
    return (
      <div
        className="bg-grey-50 flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden rounded-2xl"
        ref={containerRef}
      >
        <div className="text-grey-300 flex flex-col items-center text-center">
          <div className="flex flex-col items-center gap-6">
            {!runtimeAvailable ? (
              <>
                브라우저 미리보기에서는
                <br />
                자세 측정 엔진이 동작하지 않습니다
              </>
            ) : (
              <>
                카메라 뷰 영역
                <br />
                측정 엔진 연결 후 활성화됩니다
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full" ref={containerRef}>
      {shouldRenderSidecarStream ? (
        <div className="relative h-full w-full">
          <img
            src={streamUrl ?? undefined}
            alt="자세 측정 카메라 스트림"
            className="media-display pointer-events-none h-full w-full scale-x-[-1] rounded-[24px] object-fill select-none"
            draggable={false}
          />
          {overlayLandmarks.length > 0 ? (
            <PoseOverlayCanvas
              landmarks={overlayLandmarks}
              width={videoDimensions.width}
              height={videoDimensions.height}
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
          ) : null}
          {showTimer ? (
            <div className="absolute right-4 bottom-4">
              <Timer
                value={
                  Math.min(5, Math.max(0, remainingTime)) as
                    | 0
                    | 1
                    | 2
                    | 3
                    | 4
                    | 5
                }
                size={58}
              />
            </div>
          ) : null}
        </div>
      ) : cameraState === 'show' ? (
        <div className="bg-grey-50 flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden rounded-2xl" />
      ) : cameraState === 'hide' ? (
        <div className="bg-grey-50 flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden rounded-2xl">
          <div className="text-grey-300 text-center">
            측정을 멈췄어요! <br />
            준비되면 카메라 버튼을 눌러주세요.
          </div>
        </div>
      ) : (
        <div className="bg-grey-50 flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden rounded-2xl">
          <div className="text-grey-300 flex flex-col items-center text-center">
            <div className="flex flex-col items-center gap-6">
              오늘 한걸음 나아갔네요 <br />
              내일을 위해 쉬어요
              <img
                src={SleepIcon}
                alt="수면 아이콘"
                className="dark:opacity-25"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WebcamView
