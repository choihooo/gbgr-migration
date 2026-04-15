/**
 * 세션 엔티티 타입 정의
 * @legacy src/renderer/src/entities/session/types/index.ts
 */

export interface CreateSessionResponse {
  timestamp: string
  success: boolean
  data: {
    sessionId: string
  }
  code: string
  message: string
}

export interface SessionActionResponse {
  timestamp: string
  success: boolean
  code: string
  message: string
}

export interface MetricData {
  score: number
  timestamp: string
}

export interface SaveMetricsRequest {
  sessionId: string
  metrics: MetricData[]
}

export interface SaveMetricsResponse {
  timestamp: string
  success: boolean
  code: string
  message: string
}

export interface SessionReportData {
  totalSeconds: number
  goodSeconds: number
  score: number
}

export interface SessionReportResponse {
  timestamp: string
  success: boolean
  data: SessionReportData
  code: string
  message: string
}

export interface BackgroundSessionMetrics {
  totalResults: number
  badResults: number
  lastScore: number | null
  lastPostureClass: number | null
  updatedAt: string | null
}

export interface BackgroundNotificationDecision {
  shouldNotify: boolean
  message: string | null
}
