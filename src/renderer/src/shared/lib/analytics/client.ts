import type { AnalyticsEventName, AnalyticsEventParamsMap } from './schema'

type EventParams = Record<string, string | number | boolean>

const toEventParams = <T extends AnalyticsEventName>(
  params?: AnalyticsEventParamsMap[T],
): EventParams | undefined => {
  if (!params) return undefined
  const compact = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  ) as EventParams
  return Object.keys(compact).length > 0 ? compact : undefined
}

export const logEvent = async <T extends AnalyticsEventName>(
  name: T,
  params?: AnalyticsEventParamsMap[T],
) => {
  if (!window.electronAPI?.analytics) return
  await window.electronAPI.analytics.logEvent(name, toEventParams(params))
}

export const setAnalyticsUserId = async (userId: string) => {
  if (!window.electronAPI?.analytics) return
  if (!userId) return
  await window.electronAPI.analytics.setUserId(userId)
}
