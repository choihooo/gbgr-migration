import { type RefObject, useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'
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
  const webcamRef = useRef<Webcam>(null)
  const { overlayLandmarks, latestResult, engineState, runtimeAvailable } =
    usePostureEngine({
      active: isActive,
      mode,
      webcamRef,
      disableFramePush,
    })
  const { cameraState, setShow } = useCameraStore()

  useEffect(() => {
    if (onVideoRefReady) {
      onVideoRefReady(webcamRef as RefObject<Webcam>)
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
  const [preferredDeviceId, setPreferredDeviceId] = useState(() =>
    localStorage.getItem('preferred-camera-device'),
  )
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      const { clientWidth, clientHeight } = container
      if (clientWidth > 0 && clientHeight > 0) {
        setVideoDimensions({ width: clientWidth, height: clientHeight })
      }
    }
  }, [])

  const videoConstraints = preferredDeviceId
    ? { deviceId: { exact: preferredDeviceId }, width: 1000, height: 563 }
    : { facingMode: 'user', width: 1000, height: 563 }

  const handleUserMedia = (stream: MediaStream | null) => {
    setCameraError(null)

    if (stream) {
      setShow()
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        const settings = videoTrack.getSettings()
        if (settings.deviceId) {
          localStorage.setItem('preferred-camera-device', settings.deviceId)
          setPreferredDeviceId(settings.deviceId)
        }
        setVideoDimensions({
          width: settings.width || 760,
          height: settings.height || 428,
        })
      }
    }
  }

  const handleUserMediaError = (error: string | DOMException) => {
    const message = typeof error === 'string' ? error : error.message
    console.error('[WebcamView] 카메라 연결 실패:', error)

    if (preferredDeviceId) {
      localStorage.removeItem('preferred-camera-device')
      setPreferredDeviceId(null)
      setCameraError('저장된 카메라 정보를 다시 연결하는 중입니다')
      return
    }

    setCameraError(message || '카메라를 연결할 수 없습니다')
  }

  useEffect(() => {
    if (cameraState === 'hide' || cameraState === 'exit') {
      const stream = webcamRef.current?.video?.srcObject as MediaStream | null
      stream?.getTracks().forEach(track => {
        track.stop()
      })
    }
  }, [cameraState])

  const isEngineAvailable =
    runtimeAvailable && engineState.engineStatus !== 'error'

  if (!isEngineAvailable) {
    return (
      <div
        className="bg-grey-50 flex items-center justify-center rounded-2xl"
        style={{
          width: containerRef.current?.clientWidth || videoDimensions.width,
          height: containerRef.current?.clientHeight || videoDimensions.height,
        }}
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
            ) : cameraError ? (
              <>
                카메라 뷰 영역
                <br />
                {cameraError}
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
      {cameraState === 'show' ? (
        <div className="relative">
          <Webcam
            ref={webcamRef}
            autoPlay
            playsInline
            videoConstraints={videoConstraints}
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
            className="media-display pointer-events-none h-full w-full scale-x-[-1] rounded-[24px] object-fill select-none"
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
      ) : cameraState === 'hide' ? (
        <div
          className="bg-grey-50 flex items-center justify-center rounded-2xl"
          style={{
            width: containerRef.current?.clientWidth || videoDimensions.width,
            height:
              containerRef.current?.clientHeight || videoDimensions.height,
          }}
        >
          <div className="text-grey-300 text-center">
            측정을 멈췄어요! <br />
            준비되면 카메라 버튼을 눌러주세요.
          </div>
        </div>
      ) : (
        <div
          className="bg-grey-50 flex items-center justify-center rounded-2xl"
          style={{
            width: containerRef.current?.clientWidth || videoDimensions.width,
            height:
              containerRef.current?.clientHeight || videoDimensions.height,
          }}
        >
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
