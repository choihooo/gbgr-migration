import { useQuery } from '@tanstack/react-query'
import type {
  AttendanceQueryParams,
  HighlightQueryParams,
} from '@/entities/dashboard/types'
import {
  getAttendance,
  getAverageScore,
  getHighlight,
  getLevel,
  getPostureGraph,
  getPosturePattern,
} from '../api/dashboard-api'

export const useAverageScoreQuery = () => {
  return useQuery({
    queryKey: ['averageScore'],
    queryFn: getAverageScore,
  })
}

export const useAttendanceQuery = (
  params: AttendanceQueryParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: ['attendance', params.period, params.year, params.month],
    queryFn: () => getAttendance(params),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled,
  })
}

export const useLevelQuery = () => {
  return useQuery({
    queryKey: ['level'],
    queryFn: getLevel,
  })
}

export const usePostureGraphQuery = () => {
  return useQuery({
    queryKey: ['postureGraph'],
    queryFn: getPostureGraph,
  })
}

export const useHighlightQuery = (
  params: HighlightQueryParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: ['highlight', params.period, params.year, params.month],
    queryFn: () => getHighlight(params),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled,
  })
}

export const usePosturePatternQuery = () => {
  return useQuery({
    queryKey: ['posturePattern'],
    queryFn: getPosturePattern,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
