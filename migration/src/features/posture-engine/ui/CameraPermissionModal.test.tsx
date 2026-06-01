import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CameraPermissionModal } from './CameraPermissionModal'

vi.mock('../lib/open-camera-settings', () => ({
  openCameraPrivacySettings: vi.fn(),
}))

describe('CameraPermissionModal', () => {
  it('권한 안내와 다시 시도 액션을 보여준다', () => {
    const onRetry = vi.fn()
    const onClose = vi.fn()

    render(
      <CameraPermissionModal
        isOpen={true}
        message="카메라 권한 안내"
        onClose={onClose}
        onRetry={onRetry}
      />,
    )

    expect(screen.getByText('카메라 권한이 필요합니다')).toBeInTheDocument()
    expect(screen.getByText('카메라 권한 안내')).toBeInTheDocument()

    fireEvent.click(screen.getByText('다시 시도'))

    expect(onRetry).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('나중에 하기'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('다시 시도는 닫기 액션과 분리되어 실행된다', () => {
    const onRetry = vi.fn()
    const onClose = vi.fn()

    render(
      <CameraPermissionModal
        isOpen={true}
        message="카메라 사용 중"
        onClose={onClose}
        onRetry={onRetry}
      />,
    )

    fireEvent.click(screen.getByText('다시 시도'))

    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })
})
