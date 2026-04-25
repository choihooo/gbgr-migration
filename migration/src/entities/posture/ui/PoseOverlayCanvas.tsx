import { useEffect, useRef } from 'react'
import { usePostureEngineStore } from '@/entities/posture/model/posture-engine-store'
import type { PoseLandmark } from '@/entities/posture/model/posture-types'

interface PoseOverlayCanvasProps {
  landmarks: PoseLandmark[]
  width: number
  height: number
  className?: string
}

class LandmarkSmoother {
  private smoothedLandmarks: PoseLandmark[] = []
  private readonly alpha = 0.3

  smooth(landmarks: PoseLandmark[]): PoseLandmark[] {
    if (this.smoothedLandmarks.length === 0) {
      this.smoothedLandmarks = landmarks.map(landmark => ({ ...landmark }))
      return this.smoothedLandmarks
    }

    this.smoothedLandmarks = landmarks.map((landmark, index) => {
      const previous = this.smoothedLandmarks[index]
      if (!previous) return { ...landmark }

      return {
        x: this.alpha * landmark.x + (1 - this.alpha) * previous.x,
        y: this.alpha * landmark.y + (1 - this.alpha) * previous.y,
        z: this.alpha * landmark.z + (1 - this.alpha) * previous.z,
        visibility: landmark.visibility,
      }
    })

    return this.smoothedLandmarks
  }

  reset() {
    this.smoothedLandmarks = []
  }
}

export function PoseOverlayCanvas({
  landmarks,
  width,
  height,
  className,
}: PoseOverlayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const smootherRef = useRef(new LandmarkSmoother())
  const previousLandmarkCountRef = useRef(landmarks.length)
  const latestResult = usePostureEngineStore(state => state.latestResult)
  const restoredResult = usePostureEngineStore(state => state.restoredResult)
  const postureClass =
    latestResult?.postureClass ?? restoredResult?.postureClass ?? 0

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const parent = canvas.parentElement
    const displayWidth = parent?.clientWidth || width
    const displayHeight = parent?.clientHeight || height
    const devicePixelRatio = window.devicePixelRatio || 1

    canvas.width = displayWidth * devicePixelRatio
    canvas.height = displayHeight * devicePixelRatio
    canvas.style.width = `${displayWidth}px`
    canvas.style.height = `${displayHeight}px`

    context.scale(devicePixelRatio, devicePixelRatio)
    context.clearRect(0, 0, displayWidth, displayHeight)

    if (previousLandmarkCountRef.current !== landmarks.length) {
      smootherRef.current.reset()
      previousLandmarkCountRef.current = landmarks.length
    }
    if (landmarks.length === 0) return

    const computedStyle = getComputedStyle(document.documentElement)
    const successColor = computedStyle
      .getPropertyValue('--color-success')
      .trim()
    const errorColor = computedStyle.getPropertyValue('--color-error').trim()
    const defaultColor = computedStyle
      .getPropertyValue('--color-yellow-500')
      .trim()
    const lineColor =
      postureClass >= 1 && postureClass <= 3
        ? successColor
        : postureClass >= 4 && postureClass <= 6
          ? errorColor
          : defaultColor

    const smoothedLandmarks = smootherRef.current.smooth(landmarks)
    const relevantLandmarks = [7, 8, 11, 12]
    const pointSize = 4

    const drawPoint = (x: number, y: number) => {
      context.beginPath()
      context.arc(x, y, pointSize + 1, 0, 2 * Math.PI)
      context.fillStyle = 'white'
      context.fill()

      context.beginPath()
      context.arc(x, y, pointSize, 0, 2 * Math.PI)
      context.fillStyle = lineColor
      context.fill()
    }

    const getOverlayPoint = (landmark: PoseLandmark) => ({
      x: displayWidth - landmark.x * displayWidth,
      y: landmark.y * displayHeight,
    })

    for (const [index, landmark] of smoothedLandmarks.entries()) {
      if (
        !relevantLandmarks.includes(index) ||
        !landmark.visibility ||
        landmark.visibility <= 0.2
      ) {
        continue
      }

      const point = getOverlayPoint(landmark)
      drawPoint(point.x, point.y)
    }

    const drawLine = (from: PoseLandmark, to: PoseLandmark) => {
      const start = getOverlayPoint(from)
      const end = getOverlayPoint(to)
      context.strokeStyle = lineColor
      context.lineWidth = 4
      context.beginPath()
      context.moveTo(start.x, start.y)
      context.lineTo(end.x, end.y)
      context.stroke()
    }

    const leftShoulder = smoothedLandmarks[11]
    const rightShoulder = smoothedLandmarks[12]
    if (
      leftShoulder &&
      rightShoulder &&
      (leftShoulder.visibility ?? 0) > 0.2 &&
      (rightShoulder.visibility ?? 0) > 0.2
    ) {
      drawLine(leftShoulder, rightShoulder)
    }

    const leftEarLine = smoothedLandmarks[7]
    const rightEarLine = smoothedLandmarks[8]
    if (
      leftEarLine &&
      rightEarLine &&
      (leftEarLine.visibility ?? 0) > 0.2 &&
      (rightEarLine.visibility ?? 0) > 0.2
    ) {
      drawLine(leftEarLine, rightEarLine)
    }

    const leftEar = smoothedLandmarks[7]
    const rightEar = smoothedLandmarks[8]
    const leftShoulderMid = smoothedLandmarks[11]
    const rightShoulderMid = smoothedLandmarks[12]
    if (
      leftEar &&
      rightEar &&
      leftShoulderMid &&
      rightShoulderMid &&
      (leftEar.visibility ?? 0) > 0.2 &&
      (rightEar.visibility ?? 0) > 0.2 &&
      (leftShoulderMid.visibility ?? 0) > 0.2 &&
      (rightShoulderMid.visibility ?? 0) > 0.2
    ) {
      const leftEarPoint = getOverlayPoint(leftEar)
      const rightEarPoint = getOverlayPoint(rightEar)
      const earMidX = (leftEarPoint.x + rightEarPoint.x) / 2
      const earMidY = (leftEarPoint.y + rightEarPoint.y) / 2

      const leftShoulderPoint = getOverlayPoint(leftShoulderMid)
      const rightShoulderPoint = getOverlayPoint(rightShoulderMid)
      const shoulderMidX = (leftShoulderPoint.x + rightShoulderPoint.x) / 2
      const shoulderMidY = (leftShoulderPoint.y + rightShoulderPoint.y) / 2

      context.strokeStyle = lineColor
      context.lineWidth = 4
      context.beginPath()
      context.moveTo(shoulderMidX, shoulderMidY)
      context.lineTo(earMidX, earMidY)
      context.stroke()

      drawPoint(shoulderMidX, shoulderMidY)
      drawPoint(earMidX, earMidY)
    }
  }, [height, landmarks, postureClass, width])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
    />
  )
}
