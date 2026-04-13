import { usePostureStore } from '@entities/posture'
import { useNotificationStore } from '@features/notification'
import { useCallback, useEffect, useRef } from 'react'

/* 알림 스케줄러 훅 , 설정된 시간에 따라 시스템 알림을 자동으로 표시 */
export const useNotificationScheduler = () => {
  const { isAllow, stretching, turtleNeck } = useNotificationStore()
  const postureClass = usePostureStore(state => state.postureClass)

  /* 타이머 저장 변수 */
  const stretchingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const turtleNeckCheckRef = useRef<ReturnType<typeof setInterval> | null>(null)
  /* 거북목 상태 시작 시간 */
  const badPostureStartTime = useRef<number | null>(null)

  /* 스트레칭 알림 표시 */
  const showStretchingNotification = useCallback(async () => {
    try {
      await window.electronAPI.notification.show(
        '스트레칭 시간이에요! 🧘',
        `${stretching.interval}분이 지났어요. 잠시 스트레칭을 해보는 건 어떨까요?`,
      )
    } catch (error) {
      console.error('Failed to show stretching notification:', error)
    }
  }, [stretching.interval])

  /* 거북목 알림 표시 */
  const showTurtleNeckNotification = useCallback(async () => {
    try {
      await window.electronAPI.notification.show(
        '자세를 확인해주세요! 🐢',
        `${turtleNeck.interval}분 동안 거북목 자세가 감지되었어요. 자세를 바로잡아주세요.`,
      )
    } catch (error) {
      console.error('Failed to show turtle neck notification:', error)
    }
  }, [turtleNeck.interval])

  /* 스트레칭 타이머 설정 */
  useEffect(() => {
    /* 기존 타이머 정리 */
    if (stretchingTimerRef.current) {
      clearInterval(stretchingTimerRef.current)
      stretchingTimerRef.current = null
    }

    /* 알림이 허용되고 스트레칭 알림이 활성화된 경우에만 타이머 시작 */
    if (isAllow && stretching.isEnabled && stretching.interval > 0) {
      const intervalMs = stretching.interval * 60 * 1000

      stretchingTimerRef.current = setInterval(() => {
        showStretchingNotification()
      }, intervalMs)
    }

    /* 클린업: 컴포넌트 언마운트 시 타이머 정리 */
    return () => {
      if (stretchingTimerRef.current) {
        clearInterval(stretchingTimerRef.current)
        stretchingTimerRef.current = null
      }
    }
  }, [
    isAllow,
    stretching.isEnabled,
    stretching.interval,
    showStretchingNotification,
  ])

  /* 거북목 상태 추적 - postureClass가 4, 5, 6 (bugi 계열)일 때 시작 시간 기록 */
  useEffect(() => {
    const isBadPosture = postureClass >= 4 && postureClass <= 6

    if (isBadPosture) {
      if (!badPostureStartTime.current) {
        badPostureStartTime.current = Date.now()
      }
    } else {
      badPostureStartTime.current = null
    }
  }, [postureClass])

  /* 거북목 지속 시간 체크 - 설정된 시간 초과 시 알림 */
  useEffect(() => {
    if (turtleNeckCheckRef.current) {
      clearInterval(turtleNeckCheckRef.current)
      turtleNeckCheckRef.current = null
    }

    if (isAllow && turtleNeck.isEnabled && turtleNeck.interval > 0) {
      const thresholdMs = turtleNeck.interval * 60 * 1000

      turtleNeckCheckRef.current = setInterval(() => {
        if (badPostureStartTime.current) {
          const duration = Date.now() - badPostureStartTime.current

          if (duration >= thresholdMs) {
            showTurtleNeckNotification()
            /* 알림 후 타이머 리셋 (다음 알림을 위해) */
            badPostureStartTime.current = Date.now()
          }
        }
      }, 10000) /* 30초마다 체크 */
    }
    return () => {
      if (turtleNeckCheckRef.current) {
        clearInterval(turtleNeckCheckRef.current)
        turtleNeckCheckRef.current = null
      }
    }
  }, [
    isAllow,
    turtleNeck.isEnabled,
    turtleNeck.interval,
    showTurtleNeckNotification,
  ])

  /* 수동으로 알림을 트리거하는 함수들 (테스트용) */
  return {
    showStretchingNotification,
    showTurtleNeckNotification,
  }
}
