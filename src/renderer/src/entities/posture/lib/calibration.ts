import { checkFrontality, trimmedStats } from './calculations'
import type { CalibrationState } from './types'

// 캘리브레이션 데이터 처리
export function processCalibrationData(
  frames: CalibrationState['frames'],
  skipFrontalCheck = false,
) {
  const nTotal = frames.length
  let nPass = 0
  const piValues: number[] = []

  for (const frame of frames) {
    const frontality = checkFrontality(frame.lms)
    const shouldInclude = skipFrontalCheck || frontality.pass

    if (shouldInclude && frame.pi !== null) {
      // PI_EMA가 있으면 사용, 없으면 PI_raw 사용 (하위 호환성)
      const piValue =
        frame.pi_ema !== undefined ? frame.pi_ema : frame.pi.PI_raw
      piValues.push(piValue)
      nPass++
    }
  }

  if (piValues.length < 5) {
    const passRate = ((nPass / nTotal) * 100).toFixed(1)
    return {
      success: false,
      message: `정면성 통과 프레임이 너무 적습니다.\n통과: ${nPass}/${nTotal} (${passRate}%)\n\n💡 팁:\n- 정면을 바라보세요\n- 고개를 살짝 움직여보세요`,
    }
  }

  const stats = trimmedStats(piValues, 0.05)
  const passRate = nPass / nTotal

  let quality: 'poor' | 'medium' | 'good' = 'poor'
  if (passRate >= 0.5 && stats.std < 0.2) {
    quality = 'good'
  } else if (passRate >= 0.3 && stats.std < 0.3) {
    quality = 'medium'
  }

  return {
    success: true,
    nTotal,
    nPass,
    mu_PI: stats.mean,
    sigma_PI: stats.std,
    quality,
    passRate,
  }
}
