/**
 * @legacy src/renderer/src/features/notification/ui/NotificationModal.tsx
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { requestNotificationPermission } from '@/shared/lib/notification-api'
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
  const { t } = useTranslation()
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
  const handleSave = async () => {
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

    if (isAllow) {
      await requestNotificationPermission()
    }

    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-[339px]">
      <div className="flex flex-col gap-2 rounded-[24px] border border-grey-50 bg-surface-modal p-4 shadow-[0_0_24px_rgba(0,0,0,0.12)]">
        {/* 알림 허용 */}
        <div className="flex items-center justify-between rounded-[12px] bg-surface-modal-container p-3">
          <span className="text-body-lg-semibold text-grey-900">
            {t('dashboard.notification.allow')}
          </span>
          <NotificationToggleSwitch
            checked={isAllow}
            onChange={() => setIsAllow(!isAllow)}
          />
        </div>

        {/* 맞춤 스트레칭 주기 */}
        <TimeControlSection
          title={t('dashboard.notification.stretchingTitle')}
          description={t('dashboard.notification.stretchingDescription')}
          isEnabled={isStretchingEnabled}
          onToggle={() => setIsStretchingEnabled(!isStretchingEnabled)}
          isDisabled={!isAllow}
          timeEditor={stretching}
        />

        {/* 거북목 경고 */}
        <TimeControlSection
          title={t('dashboard.notification.turtleTitle')}
          description={t('dashboard.notification.turtleDescription')}
          isEnabled={isTurtleNeckEnabled}
          onToggle={() => setIsTurtleNeckEnabled(!isTurtleNeckEnabled)}
          isDisabled={!isAllow}
          timeEditor={turtleNeck}
        />

        {/* 저장하기 버튼 */}
        <Button
          onClick={handleSave}
          text={t('dashboard.notification.save')}
          variant="primary"
          size="md"
          className="mt-2 h-11"
        />
      </div>
    </Modal>
  )
}
