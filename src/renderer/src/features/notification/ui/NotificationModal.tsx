import { AnalyticsEvents } from '@shared/lib/analytics/events'
import { Button } from '@shared/ui/button'
import { NotificationToggleSwitch } from '@shared/ui/toggle-switch'
import { useState } from 'react'
import { useNotificationStore } from '../model/use-notification-store'
import { TimeControlSection } from './components/TimeControlSection'
import { useTimeEditor } from './hooks/useTimeEditor'

interface NotificationModalProps {
  onClose: () => void
}

const NotificationModal = ({ onClose }: NotificationModalProps) => {
  const store = useNotificationStore()

  /* 알림 허용 */
  const [isAllow, setIsAllow] = useState(store.isAllow)

  /* 스트레칭 주기 */
  const [isStretchingEnabled, setIsStretchingEnabled] = useState(
    store.stretching.isEnabled,
  )
  const stretching = useTimeEditor({
    initialTime: store.stretching.interval,
    isEnabled: isAllow && isStretchingEnabled,
  })

  /* 거북목 경고 */
  const [isTurtleNeckEnabled, setIsTurtleNeckEnabled] = useState(
    store.turtleNeck.isEnabled,
  )
  const turtleNeck = useTimeEditor({
    initialTime: store.turtleNeck.interval,
    isEnabled: isAllow && isTurtleNeckEnabled,
  })

  /* 저장하기 핸들러 - 알림 허용, 스트레칭, 거북목 시간 간격 전역 저장 */
  const handleSave = async () => {
    if (store.isAllow !== isAllow) {
      AnalyticsEvents.notificationToggle({ enabled: isAllow })
    }

    store.setSettings({
      isAllow,
      stretching: {
        isEnabled: isStretchingEnabled,
        interval: stretching.time,
      },
      turtleNeck: {
        isEnabled: isTurtleNeckEnabled,
        interval: turtleNeck.time,
      },
    })

    /* 알림 권한 요청 (처음 활성화하는 경우) */
    if (isAllow) {
      try {
        await window.electronAPI.notification.requestPermission()
      } catch (error) {
        console.error('Failed to request notification permission:', error)
      }
    }
    onClose()
  }

  return (
    <>
      <div
        className="fixed inset-0 z-999999 h-full w-full bg-black/40 dark:bg-black/70"
        onClick={onClose}
      >
        <div
          className="bg-surface-modal border-grey-0 fixed top-[45%] left-1/2 flex w-[339px] -translate-x-1/2 -translate-y-1/2 flex-col gap-2 rounded-[24px] border p-4"
          onClick={e => e.stopPropagation()}
        >
          {/* 알림 허용 */}
          <div className="bg-surface-modal-container flex items-center justify-between rounded-[12px] p-3">
            <span className="text-body-lg-semibold text-grey-900">
              알림 허용
            </span>
            <NotificationToggleSwitch
              checked={isAllow}
              onChange={() => setIsAllow(!isAllow)}
            />
          </div>

          {/* 맞춤 스트레칭 주기 */}
          <TimeControlSection
            title="맞춤 스트레칭 주기"
            description="나만의 스트레칭 타이밍이에요. 뽀모도로 타이머처럼 휴식 구간으로 설정해도 좋아요"
            isEnabled={isStretchingEnabled}
            onToggle={() => setIsStretchingEnabled(!isStretchingEnabled)}
            isDisabled={!isAllow}
            timeEditor={stretching}
          />

          {/* 거북목 경고 */}
          <TimeControlSection
            title="거북목 경고"
            description="거북목 자세가 지속되면 자세 교정 알림이 울려요"
            isEnabled={isTurtleNeckEnabled}
            onToggle={() => setIsTurtleNeckEnabled(!isTurtleNeckEnabled)}
            isDisabled={!isAllow}
            timeEditor={turtleNeck}
          />

          {/* 저장하기 버튼 */}
          <Button
            onClick={handleSave}
            text="저장하기"
            variant="primary"
            size="md"
            className="mt-2 h-11"
          />
        </div>
      </div>
    </>
  )
}

export default NotificationModal
