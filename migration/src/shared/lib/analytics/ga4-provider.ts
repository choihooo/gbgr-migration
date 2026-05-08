import { invoke } from '@tauri-apps/api/core'
import type { AnalyticsProvider } from './provider'
import type {
  AnalyticsEventName,
  AnalyticsEventParamsMap,
} from './schema'

const isTauriRuntime =
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

/**
 * GA4 Measurement Protocol provider.
 * Tauri 런타임에서는 Rust command로 GA4 API를 호출하고,
 * 그 외 환경(테스트 등)에서는 console.log로 폴백한다.
 */
export class GA4Provider implements AnalyticsProvider {
  async logEvent<T extends AnalyticsEventName>(
    name: T,
    params?: AnalyticsEventParamsMap[T],
  ): Promise<void> {
    if (!isTauriRuntime) {
      console.log('[analytics]', name, params ?? '')
      return
    }

    try {
      await invoke('analytics_log_event', { name, params: params ?? null })
    } catch (error) {
      console.warn('[analytics] logEvent 실패:', error)
    }
  }

  async setUserId(userId: string): Promise<void> {
    if (!userId) return

    if (!isTauriRuntime) {
      console.log('[analytics] setUserId:', userId)
      return
    }

    try {
      await invoke('analytics_set_user_id', { userId })
    } catch (error) {
      console.warn('[analytics] setUserId 실패:', error)
    }
  }
}
