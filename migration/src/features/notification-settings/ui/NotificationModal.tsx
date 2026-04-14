/**
 * @legacy src/renderer/src/features/notification/ui/NotificationModal.tsx
 */
import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { NotificationToggleSwitch } from '@/shared/ui/toggle-switch'
import { useTimeEditor } from '../lib/use-time-editor'
import { useNotificationStore } from '../model/use-notification-store'
import { TimeControlSection } from './components/TimeControlSection'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
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

  /* 저장하기 핸들러 */
  const handleSave = () => {
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
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-[339px]">
      <div className="flex flex-col gap-2 rounded-[24px] border border-grey-0 bg-white p-4 shadow-[0_0_24px_rgba(0,0,0,0.12)] dark:bg-grey-1000">
        {/* 알림 허용 */}
        <div className="flex items-center justify-between rounded-[12px] bg-grey-25 p-3 dark:bg-grey-900">
          <span className="text-body-lg-semibold text-grey-900 dark:text-grey-100">
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
    </Modal>
  )
}
