import { calculatePI } from './calculations'
import type { CalibrationFrame, PoseLandmark, WorldLandmark } from './types'

// 스텝 1: 측정 시작 전 체크 - "귀와 어깨가 일직선이 되도록 턱을 살짝 당겨주세요"
export function checkStep1Error(
  landmarks: PoseLandmark[],
  worldLandmarks: WorldLandmark[],
): string | null {
  const pi = calculatePI(landmarks, worldLandmarks)
  if (!pi) return null

  if (pi.PI_raw > 0.7) {
    return '귀와 어깨가 일직선이 되도록 턱을 살짝 당겨주세요'
  }

  return null
}

// 스텝 2: 측정 중 예외 케이스 체크 함수들

// 1. 얼굴과 어깨 visibility 체크
export function checkLandmarkVisibility(
  frames: CalibrationFrame[],
): string | null {
  if (frames.length < 5) return null

  const recentFrames = frames.slice(-10)
  const requiredLandmarks = [7, 8, 11, 12] // LEFT_EAR, RIGHT_EAR, LEFT_SHOULDER, RIGHT_SHOULDER
  const minVisibility = 0.3

  let lowVisibilityCount = 0
  for (const frame of recentFrames) {
    const hasLowVisibility = requiredLandmarks.some(idx => {
      const lm = frame.lms[idx]
      return !lm || (lm.visibility || 0) < minVisibility
    })
    if (hasLowVisibility) lowVisibilityCount++
  }

  // 10개 중 8개 이상이 낮으면 경고
  if (lowVisibilityCount >= 8) {
    return '얼굴과 어깨가 모두 보일 수 있게 뒤로 가주세요'
  }
  return null
}

// 2. 거리 및 위치 체크
export function checkDistanceAndPosition(
  frames: CalibrationFrame[],
): string | null {
  if (frames.length < 5) return null

  const recentFrames = frames.slice(-10)

  // 평균 어깨 너비 계산
  const avgW =
    recentFrames.reduce((sum, f) => {
      const LS = f.worldLms[11]
      const RS = f.worldLms[12]
      if (!LS || !RS) return sum

      const W = Math.sqrt(
        (RS.x - LS.x) ** 2 + (RS.y - LS.y) ** 2 + (RS.z - LS.z) ** 2,
      )
      return sum + W
    }, 0) / recentFrames.length

  // 평균 어깨 중심 위치 계산
  const avgShoulderCenter = recentFrames.reduce(
    (sum, f) => {
      const LS = f.lms[11]
      const RS = f.lms[12]
      if (!LS || !RS) return sum

      const centerX = (LS.x + RS.x) / 2
      const centerY = (LS.y + RS.y) / 2
      return {
        x: sum.x + centerX,
        y: sum.y + centerY,
      }
    },
    { x: 0, y: 0 },
  )

  avgShoulderCenter.x /= recentFrames.length
  avgShoulderCenter.y /= recentFrames.length

  const distanceFromCenter = Math.sqrt(
    (avgShoulderCenter.x - 0.5) ** 2 + (avgShoulderCenter.y - 0.5) ** 2,
  )

  // 너무 멀리 있거나 화면 중앙에서 벗어난 경우
  if (avgW < 0.03 || distanceFromCenter > 0.7) {
    return '조금 더 가까이, 화면 중앙으로 와주세요'
  }
  return null
}

// 비디오 프레임의 평균 밝기 계산 (0.0 ~ 1.0)
export function calculateFrameBrightness(
  videoElement: HTMLVideoElement,
): number | null {
  if (!videoElement || videoElement.readyState < 2) return null

  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null

    canvas.width = videoElement.videoWidth || 640
    canvas.height = videoElement.videoHeight || 480

    // 비디오 프레임을 캔버스에 그리기
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

    // 이미지 데이터 가져오기
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // RGB 값을 밝기(Luminance)로 변환
    // Luminance = 0.299*R + 0.587*G + 0.114*B
    let totalBrightness = 0
    const pixelCount = data.length / 4 // RGBA이므로 4개씩

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      // Luminance 계산 (0~255 범위)
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b
      // 0.0 ~ 1.0 범위로 정규화
      totalBrightness += luminance / 255
    }

    return totalBrightness / pixelCount
  } catch (error) {
    console.error('Failed to calculate frame brightness:', error)
    return null
  }
}

// 3. 밝기 체크 (실제 프레임 밝기 사용)
export function checkBrightness(frames: CalibrationFrame[]): string | null {
  if (frames.length < 5) return null

  const recentFrames = frames.slice(-15)

  // brightness 값이 있는 프레임만 필터링
  const framesWithBrightness = recentFrames.filter(
    frame => frame.brightness !== undefined && frame.brightness !== null,
  )

  if (framesWithBrightness.length < 5) return null

  // 평균 밝기 계산
  const avgBrightness =
    framesWithBrightness.reduce((sum, frame) => {
      return sum + (frame.brightness || 0)
    }, 0) / framesWithBrightness.length

  // 밝기가 0.2 미만이면 어둡다고 판단 (0.0 ~ 1.0 범위)
  if (avgBrightness < 0.2) {
    return '주변을 조금 더 밝게 해주세요'
  }

  return null
}

// 4. 자세 안정성 체크
export function checkPostureStability(
  frames: CalibrationFrame[],
): string | null {
  // 최소 프레임 수 (5개 이상)
  if (frames.length < 15) return null

  // 최근 5개 프레임만 확인
  const recentFrames = frames.slice(-15)
  const recentPIs = recentFrames.map(f => {
    // EMA 대신 PI_raw 사용 (변동을 더 정확히 감지하기 위해)
    return f.pi.PI_raw
  })

  // 표준편차 체크
  const mean = recentPIs.reduce((a, b) => a + b, 0) / recentPIs.length
  const variance =
    recentPIs.reduce((sum, pi) => {
      return sum + (pi - mean) ** 2
    }, 0) / recentPIs.length
  const std = Math.sqrt(variance)

  // 연속된 프레임 간의 급격한 변화 체크 (포즈가 갑자기 감지될 때)
  for (let i = 1; i < recentPIs.length; i++) {
    const diff = Math.abs(recentPIs[i] - recentPIs[i - 1])
    // 연속된 프레임 간 차이가 0.3 이상이면 급격한 변화
    if (diff > 0.3) {
      return '정확한 측정을 위해, 5초 동안 자세를 그대로 유지해주세요'
    }
  }

  // 표준편차 임계값 완화
  if (std > 0.04) {
    return '정확한 측정을 위해, 5초 동안 자세를 그대로 유지해주세요'
  }

  return null
}

// 스텝 2 에러 메시지 결정 (우선순위 순)
export function getStep2Error(frames: CalibrationFrame[]): string | null {
  // Step 2 에러들 (우선순위 순)
  return (
    checkLandmarkVisibility(frames) ||
    checkDistanceAndPosition(frames) ||
    checkBrightness(frames) ||
    checkPostureStability(frames)
  )
}
