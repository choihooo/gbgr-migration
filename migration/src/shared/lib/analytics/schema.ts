export type AnalyticsEventParamsMap = {
  sign_up_complete: { user_id?: string }
  login_complete: { user_id?: string }
  onboarding_enter: { step: string }
  calibration_complete: { user_id?: string }
  measure_page_enter: { session_id: string }
  first_measure_start: { seconds_from_signup: number }
  measure_start: { session_id: string }
  measure_end: { session_id: string; duration_sec: number }
  bad_posture_enter: { session_id: string; posture_level: number }
  posture_recovered: {
    session_id: string
    posture_level: number
    recovery_time_sec: number
  }
  widget_toggle: { enabled: boolean }
  widget_visibility_end: { duration_sec: number; session_id?: string }
  notification_toggle: { enabled: boolean }
  meaningful_use: { type: string }
}

export type AnalyticsEventName = keyof AnalyticsEventParamsMap
