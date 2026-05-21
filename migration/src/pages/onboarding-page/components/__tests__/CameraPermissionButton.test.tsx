import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCameraStore } from '@/features/main-panels/model/use-camera-store'
import CameraPermissionButton from '../CameraPermissionButton'

const navigate = vi.fn()
const getUserMedia = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}))

describe('CameraPermissionButton', () => {
  beforeEach(() => {
    navigate.mockReset()
    getUserMedia.mockReset()
    localStorage.clear()
    useCameraStore.setState({
      cameraState: 'exit',
      widgetState: 'hide',
    })

    Object.defineProperty(window, '__TAURI_INTERNALS__', {
      configurable: true,
      value: {},
    })
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia,
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    })
  })

  it('Tauri 런타임에서는 WebView getUserMedia를 호출하지 않는다', async () => {
    render(<CameraPermissionButton />)

    fireEvent.click(screen.getByRole('button', { name: '카메라 권한 허용' }))

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/onboarding/calibration')
    })
    expect(getUserMedia).not.toHaveBeenCalled()
    expect(useCameraStore.getState().cameraState).toBe('show')
  })
})
