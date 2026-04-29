/**
 * @legacy src/renderer/src/features/calibration/lib/useNotificationScheduler.ts
 */
import { useCallback, useEffect, useRef } from 'react'
import { usePostureEngineStore } from '@/entities/posture'
import { showNotification } from '@/shared/lib/notification-api'
import { useNotificationStore } from './use-notification-store'

export const useNotificationScheduler = () => {
  const { isAllow, stretching, turtleNeck } = useNotificationStore()
  const latestResult = usePostureEngineStore(state => state.latestResult)
  const restoredResult = usePostureEngineStore(state => state.restoredResult)
  const postureClass =
    latestResult?.postureClass ?? restoredResult?.postureClass ?? 0
  const stretchingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const turtleNeckCheckRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const badPostureStartTimeRef = useRef<number | null>(null)

  const showStretchingNotification = useCallback(async () => {
    await showNotification({
      title: '스트레칭 시간이에요!',
      body: `${stretching.interval}분이 지났어요. 잠시 스트레칭을 해보는 건 어떨까요?`,
    })
  }, [stretching.interval])

  const showTurtleNeckNotification = useCallback(async () => {
    await showNotification({
      title: '자세를 확인해주세요!',
      body: `${turtleNeck.interval}분 동안 거북목 자세가 감지되었어요. 자세를 바로잡아주세요.`,
    })
  }, [turtleNeck.interval])

  useEffect(() => {
    if (stretchingTimerRef.current) {
      clearInterval(stretchingTimerRef.current)
      stretchingTimerRef.current = null
    }

    if (isAllow && stretching.isEnabled && stretching.interval > 0) {
      stretchingTimerRef.current = setInterval(
        () => void showStretchingNotification(),
        stretching.interval * 60 * 1000,
      )
    }

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

  useEffect(() => {
    const isBadPosture = postureClass >= 4 && postureClass <= 6

    if (isBadPosture) {
      badPostureStartTimeRef.current ??= Date.now()
      return
    }

    badPostureStartTimeRef.current = null
  }, [postureClass])

  useEffect(() => {
    if (turtleNeckCheckRef.current) {
      clearInterval(turtleNeckCheckRef.current)
      turtleNeckCheckRef.current = null
    }

    if (isAllow && turtleNeck.isEnabled && turtleNeck.interval > 0) {
      const thresholdMs = turtleNeck.interval * 60 * 1000

      turtleNeckCheckRef.current = setInterval(() => {
        if (!badPostureStartTimeRef.current) return

        const duration = Date.now() - badPostureStartTimeRef.current
        if (duration < thresholdMs) return

        void showTurtleNeckNotification()
        badPostureStartTimeRef.current = Date.now()
      }, 10000)
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

  return {
    showStretchingNotification,
    showTurtleNeckNotification,
  }
}
