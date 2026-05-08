import { GA_STORAGE_KEYS } from './storage-keys'

/**
 * GA 이벤트 중복 전송 방지 플래그들을 모두 삭제한다.
 * 로그아웃, 계정 전환 등의 시나리오에서 호출하여야 한다.
 */
export const clearAnalyticsFlags = (): void => {
  const flags = [
    GA_STORAGE_KEYS.ONBOARDING_ENTER_SENT,
    GA_STORAGE_KEYS.MEASURE_PAGE_ENTER_SENT,
    GA_STORAGE_KEYS.FIRST_MEASURE_START_SENT,
    GA_STORAGE_KEYS.MEANINGFUL_USE_SENT,
    GA_STORAGE_KEYS.SIGNUP_COMPLETED_AT,
  ]

  for (const flag of flags) {
    localStorage.removeItem(flag)
  }
}
