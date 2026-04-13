export type AttendancePeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface AttendanceData {
  attendances: Record<string, number> // 날짜별 레벨 값 (예: "2025-01-01": 3)
  title: string
  content1: string
  content2: string
  subContent: string
}

export interface AttendanceResponse {
  timestamp: string
  success: boolean
  data: AttendanceData
  code: string
  message: string
}

export interface AttendanceQueryParams {
  period: AttendancePeriod
  year: number
  month?: number
}

export interface AverageScoreData {
  score: number
}

export interface AverageScoreResponse {
  timestamp: string
  success: boolean
  data: AverageScoreData
  code: string
  message: string | null
}

export type HighlightPeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface HighlightData {
  current: number
  previous: number
}

export interface HighlightResponse {
  timestamp: string
  success: boolean
  data: HighlightData
  code: string
  message: string
}

export interface HighlightQueryParams {
  period: HighlightPeriod
  year: number
  month?: number
}

export interface LevelData {
  level: number
  current: number
  required: number
}

export interface LevelResponse {
  timestamp: string
  success: boolean
  data: LevelData
  code: string
  message: string | null
}

export interface PostureGraphData {
  points: Record<string, number>
}

export interface PostureGraphResponse {
  timestamp: string
  success: boolean
  data: PostureGraphData
  code: string
  message: string | null
}

export interface PosturePatternData {
  worstTime: string // "14:00:00" 형식
  worstDay: string // "FRIDAY" 형식
  recovery: number // 회복까지 평균 시간 (분)
  stretching: string // 스트레칭 추천
}

export interface PosturePatternResponse {
  timestamp: string
  success: boolean
  data: PosturePatternData
  code: string
  message: string
}
