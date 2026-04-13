import SleepIcon from '@assets/common/icons/sleep.svg?react'
import {
  PoseDetection,
  type PoseLandmark,
  PoseVisualizer,
  type WorldLandmark,
} from '@entities/posture'
import { Timer } from '@shared/ui/timer'
import { useCameraStore } from '@widgets/camera'
import { type RefObject, useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'

interface WebcamViewProps {
  onPoseDetected?: (
    landmarks: PoseLandmark[],
    worldLandmarks?: WorldLandmark[],
  ) => void
  showPoseOverlay?: boolean
  showTimer?: boolean
  remainingTime?: number
  onVideoRefReady?: (videoRef: RefObject<Webcam>) => void
}

const WebcamView = ({
  onPoseDetected,
  showPoseOverlay = false,
  showTimer = false,
  remainingTime = 0,
  onVideoRefReady,
}: WebcamViewProps) => {
  const webcamRef = useRef<Webcam>(null)

  // 비디오 ref를 부모 컴포넌트에 전달
  useEffect(() => {
    if (onVideoRefReady) {
      onVideoRefReady(webcamRef as RefObject<Webcam>)
    }
  }, [onVideoRefReady])
  const containerRef = useRef<HTMLDivElement>(null)
  const [detectedLandmarks, setDetectedLandmarks] = useState<PoseLandmark[]>([])
  const [videoDimensions, setVideoDimensions] = useState({
    width: 760,
    height: 428,
  })

  // 초기 마운트 시 container 크기로 초기화
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      const { clientWidth, clientHeight } = container
      if (clientWidth > 0 && clientHeight > 0) {
        setVideoDimensions({
          width: clientWidth,
          height: clientHeight,
        })
      }
    }
  }, [])

  const { cameraState, setShow } = useCameraStore()
  const isWebcamOn = cameraState === 'show'

  // 저장된 카메라 deviceId 사용
  const preferredDeviceId = localStorage.getItem('preferred-camera-device')

  const videoConstraints = preferredDeviceId
    ? {
        deviceId: { exact: preferredDeviceId },
        width: 1000,
        height: 563,
      }
    : {
        facingMode: 'user',
        width: 1000,
        height: 563,
      }

  const handlePoseDetected = (
    landmarks: PoseLandmark[],
    worldLandmarks?: WorldLandmark[],
  ) => {
    setDetectedLandmarks(landmarks)
    onPoseDetected?.(landmarks, worldLandmarks)
  }

  const handleUserMedia = (stream: MediaStream | null) => {
    if (stream) {
      setShow()
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        const settings = videoTrack.getSettings()
        setVideoDimensions({
          width: settings.width || 760,
          height: settings.height || 428,
        })
      }
    } else {
      console.warn('[WebcamView] handleUserMedia called with null stream')
    }
  }

  const handleUserMediaError = (error: string | DOMException) => {
    console.error('[WebcamView] handleUserMediaError:', error)
    if (error instanceof DOMException) {
      console.error('[WebcamView] Error name:', error.name)
      console.error('[WebcamView] Error message:', error.message)
    }
  }

  // 카메라 스트림 정리
  useEffect(() => {
    if (cameraState === 'hide' || cameraState === 'exit') {
      if (webcamRef.current?.video?.srcObject) {
        const stream = webcamRef.current.video.srcObject as MediaStream
        const tracks = stream.getTracks()
        tracks.forEach(track => track.stop())
      }
    }
  }, [cameraState])

  // containerRef 크기 변경 감지
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setVideoDimensions(_prev => {
            // 카메라가 켜져있을 때는 실제 비디오 크기를 우선 사용
            if (cameraState === 'show' && webcamRef.current?.video) {
              const video = webcamRef.current.video
              return {
                width: video.videoWidth || width,
                height: video.videoHeight || height,
              }
            }
            // 카메라가 꺼져있을 때는 container 크기 사용
            return {
              width,
              height,
            }
          })
        }
      }
    })

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [cameraState])

  // 비디오 요소 크기 변경 감지 (카메라가 켜져있을 때)
  useEffect(() => {
    if (cameraState !== 'show') return

    const video = webcamRef.current?.video
    if (!video) return

    const handleResize = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoDimensions({
          width: video.videoWidth,
          height: video.videoHeight,
        })
      }
    }

    video.addEventListener('loadedmetadata', handleResize)
    video.addEventListener('resize', handleResize)

    return () => {
      video.removeEventListener('loadedmetadata', handleResize)
      video.removeEventListener('resize', handleResize)
    }
  }, [cameraState])

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
            className="h-full w-full scale-x-[-1] rounded-[24px] object-fill"
          />
          {showPoseOverlay && detectedLandmarks.length > 0 && (
            <PoseVisualizer
              landmarks={detectedLandmarks}
              videoWidth={videoDimensions.width}
              videoHeight={videoDimensions.height}
              isVisible={true}
            />
          )}
          {showTimer && (
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
          )}
          <PoseDetection
            videoRef={
              webcamRef as RefObject<
                Webcam | { video?: HTMLVideoElement | null } | null
              >
            }
            onPoseDetected={handlePoseDetected}
            isEnabled={isWebcamOn}
          />
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
              <SleepIcon className="dark:opacity-25" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WebcamView
