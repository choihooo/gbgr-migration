/**
 * 점수를 6단계 레벨로 분류합니다.
 *
 * @param score - 분류할 점수
 * @returns 레벨 (1-6)과 레벨 정보
 */
export type ScoreLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface ScoreLevelInfo {
  level: ScoreLevel
  label: string
  name: string // 레벨 이름 (angel-rini, pm-rini, rini, bugi, stone-bugi, tire-bugi)
  percentile: string
  minScore: number
  maxScore: number | null // null이면 무한대
}

const LEVEL_DEFINITIONS: Record<ScoreLevel, ScoreLevelInfo> = {
  1: {
    level: 1,
    label: 'L1',
    name: 'angel-rini',
    percentile: '하위 5%',
    minScore: Number.NEGATIVE_INFINITY,
    maxScore: -7.0,
  },
  2: {
    level: 2,
    label: 'L2',
    name: 'pm-rini',
    percentile: '25%',
    minScore: -7.0,
    maxScore: -3.6,
  },
  3: {
    level: 3,
    label: 'L3',
    name: 'rini',
    percentile: '45% (고정)',
    minScore: -3.6,
    maxScore: 1.2,
  },
  4: {
    level: 4,
    label: 'L4',
    name: 'bugi',
    percentile: '70%',
    minScore: 1.2,
    maxScore: 6.0,
  },
  5: {
    level: 5,
    label: 'L5',
    name: 'stone-bugi',
    percentile: '95%',
    minScore: 6.0,
    maxScore: 12.5,
  },
  6: {
    level: 6,
    label: 'L6',
    name: 'tire-bugi',
    percentile: '상위 5%',
    minScore: 12.5,
    maxScore: Number.POSITIVE_INFINITY,
  },
}

/**
 * 점수를 기반으로 레벨을 반환합니다.
 *
 * @param score - 분류할 점수
 * @returns 레벨 정보
 */
export function getScoreLevel(score: number): ScoreLevelInfo {
  // L1: score ≤ -7.0
  if (score <= -7.0) {
    return LEVEL_DEFINITIONS[1]
  }

  // L2: -7.0 < score ≤ -3.6
  if (score > -7.0 && score <= -3.6) {
    return LEVEL_DEFINITIONS[2]
  }

  // L3: -3.6 < score ≤ 1.2
  if (score > -3.6 && score <= 1.2) {
    return LEVEL_DEFINITIONS[3]
  }

  // L4: 1.2 < score ≤ 6.0
  if (score > 1.2 && score <= 6.0) {
    return LEVEL_DEFINITIONS[4]
  }

  // L5: 6.0 < score ≤ 12.5
  if (score > 6.0 && score <= 12.5) {
    return LEVEL_DEFINITIONS[5]
  }

  // L6: score > 12.5
  return LEVEL_DEFINITIONS[6]
}

/**
 * 모든 레벨 정의를 반환합니다.
 */
export function getAllLevelDefinitions(): ScoreLevelInfo[] {
  return Object.values(LEVEL_DEFINITIONS)
}
