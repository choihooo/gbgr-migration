import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { openCameraPrivacySettings } from '../lib/open-camera-settings'

interface CameraPermissionModalProps {
  isOpen: boolean
  message: string
  onClose: () => void
  onRetry: () => void
}

export function CameraPermissionModal({
  isOpen,
  message,
  onClose,
  onRetry,
}: CameraPermissionModalProps) {
  const handleOpenSettings = async () => {
    await openCameraPrivacySettings()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-[360px]">
      <div className="bg-grey-0 flex flex-col gap-5 rounded-[16px] p-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-title-xl-bold text-grey-1000">
            카메라 권한이 필요합니다
          </h2>
          <p className="text-body-md-regular text-grey-500 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            text="설정 열기"
            className="flex-1"
            onClick={handleOpenSettings}
          />
          <Button
            text="다시 시도"
            variant="sub"
            className="flex-1"
            onClick={onRetry}
          />
        </div>
        <button
          type="button"
          className="text-body-sm-medium text-grey-400 self-center"
          onClick={onClose}
        >
          나중에 하기
        </button>
      </div>
    </Modal>
  )
}
