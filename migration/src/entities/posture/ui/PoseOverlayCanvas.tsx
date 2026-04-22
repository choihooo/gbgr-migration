import { useEffect, useRef } from 'react'
import {
  DEFAULT_POSE_CONNECTIONS,
  mapLandmarksToOverlay,
} from '@/entities/posture/lib/overlay-mapper'
import type { PoseLandmark } from '@/entities/posture/model/posture-types'

interface PoseOverlayCanvasProps {
  landmarks: PoseLandmark[]
  width: number
  height: number
  className?: string
}

export function PoseOverlayCanvas({
  landmarks,
  width,
  height,
  className,
}: PoseOverlayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    context.clearRect(0, 0, width, height)
    if (landmarks.length === 0) return

    const points = mapLandmarksToOverlay(landmarks, width, height)

    context.lineWidth = 3
    context.strokeStyle = 'rgba(255, 212, 59, 0.95)'
    context.fillStyle = 'rgba(255, 255, 255, 0.92)'

    for (const [from, to] of DEFAULT_POSE_CONNECTIONS) {
      const start = points[from]
      const end = points[to]
      if (!start || !end || !start.visible || !end.visible) continue
      context.beginPath()
      context.moveTo(start.x, start.y)
      context.lineTo(end.x, end.y)
      context.stroke()
    }

    for (const point of points) {
      if (!point.visible) continue
      context.beginPath()
      context.arc(point.x, point.y, 4, 0, Math.PI * 2)
      context.fill()
    }
  }, [height, landmarks, width])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
    />
  )
}
