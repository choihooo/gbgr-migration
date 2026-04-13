import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import type Webcam from 'react-webcam'
import type { PoseLandmark } from './types'

interface WebcamRef {
  video?: HTMLVideoElement | null
}

interface PoseDetectionProps {
  videoRef: RefObject<Webcam | WebcamRef | null> // Webcam 컴포넌트 ref
  onPoseDetected?: (
    landmarks: PoseLandmark[],
    worldLandmarks?: PoseLandmark[],
  ) => void
  isEnabled?: boolean
}

const PoseDetection = ({
  videoRef,
  onPoseDetected,
  isEnabled = true,
}: PoseDetectionProps) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null)
  const lastVideoTimeRef = useRef<number>(-1)

  // MediaPipe 초기화
  useEffect(() => {
    const initializePoseLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm',
        )

        poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numPoses: 1,
            minPoseDetectionConfidence: 0.2, // 더 낮은 감지 임계값
            minPosePresenceConfidence: 0.2, // 더 낮은 존재 임계값
            minTrackingConfidence: 0.2, // 더 낮은 추적 임계값
          },
        )

        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize pose landmarker:', error)
      }
    }

    if (isEnabled) {
      initializePoseLandmarker()
    }
  }, [isEnabled])

  // 포즈 감지 실행
  const detectPose = useCallback(
    async (videoElement: HTMLVideoElement) => {
      if (!poseLandmarkerRef.current || !isEnabled || isDetecting) return

      const currentTime = videoElement.currentTime
      if (currentTime === lastVideoTimeRef.current) return

      lastVideoTimeRef.current = currentTime
      setIsDetecting(true)

      try {
        const results = poseLandmarkerRef.current.detectForVideo(
          videoElement,
          performance.now(),
        )

        if (results.landmarks && results.landmarks.length > 0) {
          // 13개 주요 포즈 랜드마크 추출 (MediaPipe Pose는 33개 랜드마크를 제공)
          const keyLandmarks = extractKeyLandmarks(results.landmarks[0])

          // World landmarks도 추출 (PI 계산에 필요)
          let worldLandmarks: PoseLandmark[] = []
          if (results.worldLandmarks && results.worldLandmarks.length > 0) {
            worldLandmarks = extractKeyLandmarks(results.worldLandmarks[0])
          } else {
            // World landmarks가 없으면 2D 랜드마크를 3D로 변환해서 사용
            worldLandmarks = keyLandmarks.map(landmark => ({
              ...landmark,
              z: landmark.z || 0, // z값이 없으면 0으로 설정
            }))
          }

          onPoseDetected?.(keyLandmarks, worldLandmarks)
        }
      } catch (error) {
        console.error('Pose detection error:', error)
      } finally {
        setIsDetecting(false)
      }
    },
    [isEnabled, isDetecting, onPoseDetected],
  )

  // 주요 랜드마크 추출 (얼굴 + 상체 중심)
  const extractKeyLandmarks = (landmarks: PoseLandmark[]): PoseLandmark[] => {
    // MediaPipe Pose 33개 랜드마크에서 주요 포인트들 선택
    const keyIndices = [
      // 얼굴 영역 (11개)
      0, // NOSE
      1, // LEFT_EYE_INNER
      2, // LEFT_EYE
      3, // LEFT_EYE_OUTER
      4, // RIGHT_EYE_INNER
      5, // RIGHT_EYE
      6, // RIGHT_EYE_OUTER
      7, // LEFT_EAR
      8, // RIGHT_EAR
      9, // MOUTH_LEFT
      10, // MOUTH_RIGHT
      // 어깨 영역 (2개)
      11, // LEFT_SHOULDER
      12, // RIGHT_SHOULDER
    ]

    return keyIndices.map(index => {
      const landmark = landmarks[index]
      if (landmark) {
        // 측면 각도에서도 최소한의 가시성 보장
        return {
          ...landmark,
          visibility: Math.max(landmark.visibility || 0, 0.1),
        }
      }
      return { x: 0, y: 0, z: 0, visibility: 0 }
    })
  }

  // 비디오 프레임마다 포즈 감지 실행
  useEffect(() => {
    if (!isInitialized || !videoRef.current || !isEnabled) return

    const getVideoElement = () => {
      // Webcam 컴포넌트에서 video 요소 가져오기
      const ref = videoRef.current
      if (!ref) return null
      // WebcamRef 인터페이스인 경우
      if ('video' in ref) {
        return ref.video || null
      }
      // Webcam 컴포넌트인 경우 - video 속성이 있을 수 있음
      return (
        (ref as unknown as { video?: HTMLVideoElement | null })?.video || null
      )
    }

    const interval = setInterval(() => {
      const videoElement = getVideoElement()
      if (videoElement && videoElement.readyState >= 2) {
        // HAVE_CURRENT_DATA
        detectPose(videoElement)
      }
    }, 50) // 20fps로 감지 (더 빠른 반응)

    return () => clearInterval(interval)
  }, [isInitialized, videoRef, isEnabled, detectPose])

  return null // 이 컴포넌트는 UI를 렌더링하지 않음
}

export default PoseDetection
