// 포즈 랜드마크 타입
export interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

export interface WorldLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

// PI 지표 계산 결과
export interface PIResult {
  PI_raw: number
  S: { x: number; y: number; z: number }
  E: { x: number; y: number; z: number }
  W: number
}

// 정면성 검사 결과
export interface FrontalityResult {
  pass: boolean
  roll: number
  centerRatio: number
}

// 자세 판정 결과
export interface PostureClassification {
  text: string
  cls: 1 | 2 | 3 | 4 | 5 | 6 | 0
  zScore: number
  PI_EMA: number
  z_PI: number
  gamma: number
  Score: number
  events: string[]
}

// 캘리브레이션 상태
export interface CalibrationState {
  isCalibrating: boolean
  isCalibrated: boolean
  startTime: number
  frames: Array<{
    lms: PoseLandmark[]
    pi: PIResult
    worldLms: WorldLandmark[]
    pi_ema?: number // EMA 적용된 PI 값 (선택적)
    brightness?: number // 프레임의 평균 밝기 (0.0 ~ 1.0)
  }>
  mu_PI: number
  sigma_PI: number
  quality: 'poor' | 'medium' | 'good' | 'unknown'
}

// 캘리브레이션 프레임 타입
export type CalibrationFrame = CalibrationState['frames'][number]
