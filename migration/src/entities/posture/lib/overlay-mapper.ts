import type { PoseLandmark } from '@/entities/posture/model/posture-types'

export interface OverlayPoint {
  x: number
  y: number
  visible: boolean
}

export const mapLandmarksToOverlay = (
  landmarks: PoseLandmark[],
  width: number,
  height: number,
): OverlayPoint[] => {
  return landmarks.map(landmark => ({
    x: (1 - landmark.x) * width,
    y: landmark.y * height,
    visible: (landmark.visibility ?? 1) > 0.1,
  }))
}
