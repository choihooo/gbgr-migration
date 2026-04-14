import type {
  AttendanceQueryParams,
  AttendanceResponse,
  AverageScoreResponse,
  HighlightQueryParams,
  HighlightResponse,
  LevelResponse,
  PostureGraphResponse,
  PosturePatternResponse,
} from '@/entities/dashboard/types'
import { api } from '@/shared/api/instance'

export const getAverageScore = async (): Promise<AverageScoreResponse> => {
  const response = await api.get<AverageScoreResponse>(
    '/dashboard/average-score',
  )
  if (!response.data.success) {
    throw new Error('평균 점수 조회에 실패했습니다.')
  }
  return response.data
}

export const getAttendance = async (
  params: AttendanceQueryParams,
): Promise<AttendanceResponse> => {
  const response = await api.get<AttendanceResponse>('/dashboard/attendance', {
    params,
  })
  if (!response.data.success) {
    throw new Error('출석 정보 조회에 실패했습니다.')
  }
  return response.data
}

export const getLevel = async (): Promise<LevelResponse> => {
  const response = await api.get<LevelResponse>('/dashboard/level')
  if (!response.data.success) {
    throw new Error('레벨 조회에 실패했습니다.')
  }
  return response.data
}

export const getPostureGraph = async (): Promise<PostureGraphResponse> => {
  const response = await api.get<PostureGraphResponse>(
    '/dashboard/posture-graph',
  )
  if (!response.data.success) {
    throw new Error('자세 그래프 조회에 실패했습니다.')
  }
  return response.data
}

export const getHighlight = async (
  params: HighlightQueryParams,
): Promise<HighlightResponse> => {
  const response = await api.get<HighlightResponse>('/dashboard/highlight', {
    params,
  })
  if (!response.data.success) {
    throw new Error('하이라이트 조회에 실패했습니다.')
  }
  return response.data
}

export const getPosturePattern = async (): Promise<PosturePatternResponse> => {
  const response = await api.get<PosturePatternResponse>(
    '/dashboard/posture-pattern',
  )
  if (!response.data.success) {
    throw new Error('자세 패턴 조회에 실패했습니다.')
  }
  return response.data
}
