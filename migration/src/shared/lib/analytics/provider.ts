import type { AnalyticsEventName, AnalyticsEventParamsMap } from './schema'

/**
 * 분석 provider 추상화 인터페이스.
 * GA4, PostHog 등 교체 가능한 구조를 제공한다.
 */
export interface AnalyticsProvider {
  logEvent<T extends AnalyticsEventName>(
    name: T,
    params?: AnalyticsEventParamsMap[T],
  ): Promise<void>

  setUserId(userId: string): Promise<void>
}
