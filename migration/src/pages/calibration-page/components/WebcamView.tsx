/**
 * 보정 화면 - 웹캠 뷰 (UI만, 측정 엔진 미연결)
 *
 * 포팅 원본: src/renderer/src/pages/calibration-page/components/WebcamView.tsx
 * 변경점: PoseDetection, PoseVisualizer 제외. CameraStore 대신 직접 상태 관리.
 *         isEngineAvailable=false 시 카메라 placeholder 표시.
 */
import { type RefObject, useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'

interface WebcamViewProps {
  showTimer?: boolean
  remainingTime?: number
  onVideoRefReady?: (videoRef: RefObject<Webcam>) => void
  isEngineAvailable?: boolean
}

const WebcamView = ({
  onVideoRefReady,
  isEngineAvailable = false,
}: WebcamViewProps) => {
  const webcamRef = useRef<Webcam>(null)

  useEffect(() => {
    if (onVideoRefReady) {
      onVideoRefReady(webcamRef as RefObject<Webcam>)
    }
  }, [onVideoRefReady])

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
      </div>
    </div>
  )
}

export default WebcamView
