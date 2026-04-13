import type {
  FrontalityResult,
  PIResult,
  PoseLandmark,
  WorldLandmark,
} from './types'

// EMA 스무딩 클래스
export class EmaSmoother {
  private alpha: number
  private y: number | null = null

  constructor(alpha = 0.25) {
    this.alpha = alpha
  }

  next(x: number): number {
    this.y = this.y === null ? x : this.alpha * x + (1 - this.alpha) * this.y
    return this.y
  }

  reset() {
    this.y = null
  }
}

// PI 지표 계산 함수
export function calculatePI(
  landmarks: PoseLandmark[],
  worldLandmarks: WorldLandmark[],
): PIResult | null {
  if (!worldLandmarks) return null

  const LEFT_EAR = 7
  const RIGHT_EAR = 8
  const LEFT_SHOULDER = 11
  const RIGHT_SHOULDER = 12

  const LE = worldLandmarks[LEFT_EAR]
  const RE = worldLandmarks[RIGHT_EAR]
  const LS = worldLandmarks[LEFT_SHOULDER]
  const RS = worldLandmarks[RIGHT_SHOULDER]

  if (!LE || !RE || !LS || !RS) return null

  // S = (LEFT_SHOULDER + RIGHT_SHOULDER) / 2
  const S = {
    x: (LS.x + RS.x) / 2,
    y: (LS.y + RS.y) / 2,
    z: (LS.z + RS.z) / 2,
  }

  // E = (LEFT_EAR + RIGHT_EAR) / 2
  const E = {
    x: (LE.x + RE.x) / 2,
    y: (LE.y + RE.y) / 2,
    z: (LE.z + RE.z) / 2,
  }

  // W = || RIGHT_SHOULDER - LEFT_SHOULDER || (world 공간 길이)
  const W = Math.sqrt(
    (RS.x - LS.x) ** 2 + (RS.y - LS.y) ** 2 + (RS.z - LS.z) ** 2,
  )

  if (W === 0) return null

  // PI_raw = (z_S - z_E) / W
  const PI_raw = (S.z - E.z) / W

  return { PI_raw, S, E, W }
}

// 정면성 검사 함수
export function checkFrontality(landmarks: PoseLandmark[]): FrontalityResult {
  const LEFT_EAR = 7
  const RIGHT_EAR = 8
  const LEFT_SHOULDER = 11
  const RIGHT_SHOULDER = 12
  const NOSE = 0

  const LE = landmarks[LEFT_EAR]
  const RE = landmarks[RIGHT_EAR]
  const LS = landmarks[LEFT_SHOULDER]
  const RS = landmarks[RIGHT_SHOULDER]
  const nose = landmarks[NOSE]

  if (!LE || !RE || !LS || !RS || !nose) {
    return { pass: false, roll: 0, centerRatio: 1 }
  }

  // roll = atan2(|(R_e - L_e).y|, (R_e - L_e).x) [deg]
  const earDiff = { x: RE.x - LE.x, y: RE.y - LE.y }
  const roll = Math.abs(
    (Math.atan2(Math.abs(earDiff.y), earDiff.x) * 180) / Math.PI,
  )

  // center_ratio = |NOSE.x - S.x| / ||R_s - L_s||_2D
  const S_2D = { x: (LS.x + RS.x) / 2, y: (LS.y + RS.y) / 2 }
  const shoulderDiff = { x: RS.x - LS.x, y: RS.y - LS.y }
  const shoulderWidth2D = Math.sqrt(
    shoulderDiff.x * shoulderDiff.x + shoulderDiff.y * shoulderDiff.y,
  )
  const centerRatio =
    shoulderWidth2D > 0 ? Math.abs(nose.x - S_2D.x) / shoulderWidth2D : 1

  // 정면성 패스: |roll| ≤ 10°, center_ratio ≤ 0.15
  const pass = roll <= 10 && centerRatio <= 0.15

  return { pass, roll, centerRatio }
}

// 상하 5% 절사 평균 및 표준편차 계산
export function trimmedStats(values: number[], trimPercent = 0.05) {
  if (values.length === 0) return { mean: 0, std: 0 }

  const sorted = [...values].sort((a, b) => a - b)
  const trimCount = Math.floor(sorted.length * trimPercent)
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount)

  if (trimmed.length === 0) return { mean: 0, std: 0 }

  const mean = trimmed.reduce((sum, v) => sum + v, 0) / trimmed.length
  const variance =
    trimmed.reduce((sum, v) => sum + (v - mean) ** 2, 0) / trimmed.length
  const std = Math.sqrt(variance)

  return { mean, std }
}
