/**
 * 대시보드 엔티티 타입 정의
 * @legacy src/renderer/src/entities/dashboard/types/index.ts
 */

export type AttendancePeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface AttendanceData {
  attendances: Record<string, number>
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
  worstTime: string
  worstDay: string
  recovery: number
  stretching: string
}

export interface PosturePatternResponse {
  timestamp: string
  success: boolean
  data: PosturePatternData
  code: string
  message: string
}
