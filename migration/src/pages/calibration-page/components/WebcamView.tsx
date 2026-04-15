import { type RefObject, useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import { PoseOverlayCanvas, type PostureEngineResult } from '@/entities/posture'
import { usePostureEngine } from '@/features/posture-engine'
import { Timer } from '@/shared/ui/timer'

interface WebcamViewProps {
  showTimer?: boolean
  remainingTime?: number
  onVideoRefReady?: (videoRef: RefObject<Webcam>) => void
  isActive?: boolean
  mode?: 'foreground' | 'background'
  onResultChange?: (result: PostureEngineResult | null) => void
}

const WebcamView = ({
  showTimer = false,
  remainingTime = 0,
  onVideoRefReady,
  isActive = true,
  mode = 'foreground',
  onResultChange,
}: WebcamViewProps) => {
  const webcamRef = useRef<Webcam>(null)
  const { overlayLandmarks, latestResult, engineState } = usePostureEngine({
    active: isActive,
    mode,
    webcamRef,
  })

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

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      const { clientWidth, clientHeight } = container
      if (clientWidth > 0 && clientHeight > 0) {
        setVideoDimensions({ width: clientWidth, height: clientHeight })
      }
    }
  }, [])

  const preferredDeviceId = localStorage.getItem('preferred-camera-device')

  const videoConstraints = preferredDeviceId
    ? { deviceId: { exact: preferredDeviceId }, width: 1000, height: 563 }
    : { facingMode: 'user', width: 1000, height: 563 }

  const handleUserMedia = (stream: MediaStream | null) => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        const settings = videoTrack.getSettings()
        setVideoDimensions({
          width: settings.width || 760,
          height: settings.height || 428,
        })
      }
    }
  }

  const isEngineAvailable = engineState.engineStatus !== 'error'

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
            카메라 뷰 영역
            <br />
            측정 엔진 연결 후 활성화됩니다
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full" ref={containerRef}>
      <div className="relative">
        <Webcam
          ref={webcamRef}
          autoPlay
          playsInline
          videoConstraints={videoConstraints}
          onUserMedia={handleUserMedia}
          className="h-full w-full scale-x-[-1] rounded-[24px] object-fill"
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
                Math.min(5, Math.max(0, remainingTime)) as 0 | 1 | 2 | 3 | 4 | 5
              }
              size={58}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default WebcamView
