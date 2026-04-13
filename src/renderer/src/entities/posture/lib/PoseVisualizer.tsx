import { usePostureStore } from '@entities/posture'
import { useEffect, useRef } from 'react'
import type { PoseLandmark } from './types'

interface PoseVisualizerProps {
  landmarks: PoseLandmark[]
  videoWidth: number
  videoHeight: number
  isVisible?: boolean
}

// EMA 스무딩 클래스
class LandmarkSmoother {
  private smoothedLandmarks: PoseLandmark[] = []
  private alpha = 0.3 // 스무딩 강도 (0.1 = 강한 스무딩, 0.9 = 약한 스무딩)

  smooth(landmarks: PoseLandmark[]): PoseLandmark[] {
    if (this.smoothedLandmarks.length === 0) {
      // 첫 번째 프레임은 그대로 사용
      this.smoothedLandmarks = landmarks.map(landmark => ({ ...landmark }))
      return this.smoothedLandmarks
    }

    // EMA 스무딩 적용
    this.smoothedLandmarks = landmarks.map((landmark, index) => {
      const prev = this.smoothedLandmarks[index]
      if (!prev) return { ...landmark }

      return {
        x: this.alpha * landmark.x + (1 - this.alpha) * prev.x,
        y: this.alpha * landmark.y + (1 - this.alpha) * prev.y,
        z: this.alpha * landmark.z + (1 - this.alpha) * prev.z,
        visibility: landmark.visibility,
      }
    })

    return this.smoothedLandmarks
  }

  reset() {
    this.smoothedLandmarks = []
  }
}

const PoseVisualizer = ({
  landmarks,
  videoWidth,
  videoHeight,
  isVisible = true,
}: PoseVisualizerProps) => {
  const postureClass = usePostureStore(state => state.postureClass)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const smootherRef = useRef<LandmarkSmoother>(new LandmarkSmoother())

  // 랜드마크가 완전히 바뀔 때 스무더 리셋
  useEffect(() => {
    smootherRef.current.reset()
  }, [landmarks.length])

  useEffect(() => {
    if (!isVisible || landmarks.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // --- 색상 정의 ---
    const computedStyle = getComputedStyle(document.documentElement)
    const successColor = computedStyle
      .getPropertyValue('--color-success')
      .trim()
    const errorColor = computedStyle.getPropertyValue('--color-error').trim()
    const defaultColor = computedStyle
      .getPropertyValue('--color-yellow-500')
      .trim()

    // --- 상태에 따른 색상 결정 ---
    // 레벨 1-3: 초록색, 레벨 4-6: 빨간색, 레벨 0(측정중): 노란색
    const LineColor =
      postureClass >= 1 && postureClass <= 3
        ? successColor
        : postureClass >= 4 && postureClass <= 6
          ? errorColor
          : defaultColor

    // 부모 컨테이너의 실제 크기 가져오기
    const parent = canvas.parentElement
    const displayWidth = parent?.clientWidth || videoWidth
    const displayHeight = parent?.clientHeight || videoHeight

    // 캔버스 실제 해상도 설정 (고해상도 유지)
    const devicePixelRatio = window.devicePixelRatio || 1
    canvas.width = displayWidth * devicePixelRatio
    canvas.height = displayHeight * devicePixelRatio

    // CSS 크기는 부모에 맞게 설정
    canvas.style.width = `${displayWidth}px`
    canvas.style.height = `${displayHeight}px`

    // 고해상도 대응 스케일
    ctx.scale(devicePixelRatio, devicePixelRatio)

    // 캔버스 초기화
    ctx.clearRect(0, 0, displayWidth, displayHeight)

    // 스무딩 적용
    const smoothedLandmarks = smootherRef.current.smooth(landmarks)

    // 랜드마크 그리기 (거울모드 반전)
    const relevantLandmarks = [7, 8, 11, 12] // 귀, 어깨
    smoothedLandmarks.forEach((landmark, index) => {
      if (
        relevantLandmarks.includes(index) &&
        landmark.visibility &&
        landmark.visibility > 0.2
      ) {
        const x = displayWidth - landmark.x * displayWidth // X축 반전 (거울모드)
        const y = landmark.y * displayHeight

        // 랜드마크 점 크기
        const pointSize = 4

        // 랜드마크 점 그리기 (테두리 효과)
        ctx.beginPath()
        ctx.arc(x, y, pointSize + 1, 0, 2 * Math.PI) // 테두리
        ctx.fillStyle = 'white'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(x, y, pointSize, 0, 2 * Math.PI) // 원래 점

        // 색상 구분 (귀: 분홍색, 어깨: 파란색)
        if (index === 7 || index === 8) {
          // 귀
          ctx.fillStyle = LineColor
        } else if (index === 11 || index === 12) {
          // 어깨
          ctx.fillStyle = LineColor
        }

        ctx.fill()
      }
    })

    // 연결선 그리기 (HTML 스타일)
    ctx.lineWidth = 4

    // 어깨 라인 (흰색 반투명)
    const leftShoulder = smoothedLandmarks[11]
    const rightShoulder = smoothedLandmarks[12]
    if (
      leftShoulder &&
      rightShoulder &&
      (leftShoulder.visibility ?? 0) > 0.2 &&
      (rightShoulder.visibility ?? 0) > 0.2
    ) {
      const leftShoulderX = displayWidth - leftShoulder.x * displayWidth
      const leftShoulderY = leftShoulder.y * displayHeight
      const rightShoulderX = displayWidth - rightShoulder.x * displayWidth
      const rightShoulderY = rightShoulder.y * displayHeight

      ctx.strokeStyle = LineColor
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(leftShoulderX, leftShoulderY)
      ctx.lineTo(rightShoulderX, rightShoulderY)
      ctx.stroke()
    }

    // 귀 라인
    const leftEarLine = smoothedLandmarks[7]
    const rightEarLine = smoothedLandmarks[8]
    if (
      leftEarLine &&
      rightEarLine &&
      (leftEarLine.visibility ?? 0) > 0.2 &&
      (rightEarLine.visibility ?? 0) > 0.2
    ) {
      const leftEarX = displayWidth - leftEarLine.x * displayWidth
      const leftEarY = leftEarLine.y * displayHeight
      const rightEarX = displayWidth - rightEarLine.x * displayWidth
      const rightEarY = rightEarLine.y * displayHeight

      ctx.strokeStyle = LineColor
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(leftEarX, leftEarY)
      ctx.lineTo(rightEarX, rightEarY)
      ctx.stroke()
    }

    // 귀 중점 - 어깨 중점 라인 (상태에 따른 색상)
    const leftEar = smoothedLandmarks[7]
    const rightEar = smoothedLandmarks[8]
    const leftShoulder2 = smoothedLandmarks[11]
    const rightShoulder2 = smoothedLandmarks[12]

    if (
      leftEar &&
      rightEar &&
      leftShoulder2 &&
      rightShoulder2 &&
      (leftEar.visibility ?? 0) > 0.2 &&
      (rightEar.visibility ?? 0) > 0.2 &&
      (leftShoulder2.visibility ?? 0) > 0.2 &&
      (rightShoulder2.visibility ?? 0) > 0.2
    ) {
      // 귀 중점 계산 (displayWidth/Height 사용)
      const leftEarX = displayWidth - leftEar.x * displayWidth
      const leftEarY = leftEar.y * displayHeight
      const rightEarX = displayWidth - rightEar.x * displayWidth
      const rightEarY = rightEar.y * displayHeight
      const earMidX = (leftEarX + rightEarX) / 2
      const earMidY = (leftEarY + rightEarY) / 2

      // 어깨 중점 계산 (displayWidth/Height 사용)
      const leftShoulderX = displayWidth - leftShoulder2.x * displayWidth
      const leftShoulderY = leftShoulder2.y * displayHeight
      const rightShoulderX = displayWidth - rightShoulder2.x * displayWidth
      const rightShoulderY = rightShoulder2.y * displayHeight
      const shoulderMidX = (leftShoulderX + rightShoulderX) / 2
      const shoulderMidY = (leftShoulderY + rightShoulderY) / 2

      // 귀-어깨 중점 연결선
      ctx.strokeStyle = LineColor
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(shoulderMidX, shoulderMidY)
      ctx.lineTo(earMidX, earMidY)
      ctx.stroke()

      // 어깨 중점 강조 (테두리)
      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.arc(shoulderMidX, shoulderMidY, 4 + 1, 0, Math.PI * 2)
      ctx.fill()

      // 어깨 중점 강조 (원래 점)
      ctx.fillStyle = LineColor
      ctx.beginPath()
      ctx.arc(shoulderMidX, shoulderMidY, 4, 0, Math.PI * 2)
      ctx.fill()

      // 귀 중점 강조 (테두리)
      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.arc(earMidX, earMidY, 4 + 1, 0, Math.PI * 2)
      ctx.fill()

      // 귀 중점 강조 (원래 점)
      ctx.fillStyle = LineColor
      ctx.beginPath()
      ctx.arc(earMidX, earMidY, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [landmarks, videoWidth, videoHeight, isVisible, postureClass])

  if (!isVisible) return null

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute top-0 left-0 h-full w-full"
    />
  )
}

export default PoseVisualizer
