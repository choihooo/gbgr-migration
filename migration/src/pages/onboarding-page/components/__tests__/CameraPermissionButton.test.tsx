import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCameraStore } from '@/features/main-panels/model/use-camera-store'
import * as postureEngine from '@/features/posture-engine'
import CameraPermissionButton from '../CameraPermissionButton'

const navigate = vi.fn()
const getUserMedia = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}))

vi.mock('@/features/posture-engine', () => ({
  startPostureEngine: vi.fn(),
  stopPostureEngine: vi.fn(),
}))

describe('CameraPermissionButton', () => {
  beforeEach(() => {
    navigate.mockReset()
    getUserMedia.mockReset()
    vi.mocked(postureEngine.startPostureEngine).mockReset()
    vi.mocked(postureEngine.stopPostureEngine).mockReset()
    vi.mocked(postureEngine.startPostureEngine).mockResolvedValue({
      engineStatus: 'ready',
      sessionId: 'permission-probe',
      mode: 'foreground',
      streamUrl: 'http://127.0.0.1:49152/video?token=test-token',
    })
    vi.mocked(postureEngine.stopPostureEngine).mockResolvedValue({
      engineStatus: 'idle',
      releasedOwner: 'python',
    })
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
      expect(postureEngine.startPostureEngine).toHaveBeenCalled()
      expect(navigate).toHaveBeenCalledWith('/onboarding/calibration')
    })
    expect(postureEngine.stopPostureEngine).toHaveBeenCalled()
    expect(getUserMedia).not.toHaveBeenCalled()
    expect(useCameraStore.getState().cameraState).toBe('show')
  })
})
