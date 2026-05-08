import { GA4Provider } from './ga4-provider'
import type { AnalyticsProvider } from './provider'
import type {
  AnalyticsEventName,
  AnalyticsEventParamsMap,
} from './schema'

let provider: AnalyticsProvider = new GA4Provider()

/** 테스트 또는 커스텀 provider 교체용 */
export const setAnalyticsProvider = (next: AnalyticsProvider): void => {
  provider = next
}

export const logEvent = <T extends AnalyticsEventName>(
  name: T,
  params?: AnalyticsEventParamsMap[T],
): Promise<void> => provider.logEvent(name, params)

export const setAnalyticsUserId = (userId: string): Promise<void> =>
  provider.setUserId(userId)
