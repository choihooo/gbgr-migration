/**
 * GA (Google Analytics) localStorage 키 상수
 * 이벤트 중복 전송 방지를 위한 플래그 키들을 관리합니다
 */
export const GA_STORAGE_KEYS = {
  ONBOARDING_ENTER_SENT: 'ga_onboarding_enter_sent',
  MEASURE_PAGE_ENTER_SENT: 'ga_measure_page_enter_sent',
  FIRST_MEASURE_START_SENT: 'ga_first_measure_start_sent',
  MEANINGFUL_USE_SENT: 'ga_meaningful_use_sent',
  SIGNUP_COMPLETED_AT: 'signupCompletedAt',
} as const
