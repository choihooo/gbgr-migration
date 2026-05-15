import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCameraStore } from '@/features/main-panels/model/use-camera-store'
import CameraPermissionButton from '@/pages/onboarding-page/components/CameraPermissionButton'
import { installMockStorage } from '../../setup/auth-test-storage'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('CameraPermissionButton', () => {
  beforeEach(() => {
    installMockStorage()
    mockNavigate.mockReset()
    useCameraStore.setState({ cameraState: 'exit', widgetState: 'hide' })
    Object.defineProperty(window, 'alert', {
      configurable: true,
      value: vi.fn(),
    })
    Object.defineProperty(window.navigator, 'platform', {
      configurable: true,
      value: 'MacIntel',
    })
  })

  it('권한 요청 성공 시 보정 화면으로 이동하기 전에 카메라 상태를 연다', async () => {
    const stop = vi.fn()
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop }],
      getVideoTracks: () => [
        {
          getSettings: () => ({ deviceId: 'camera-1' }),
        },
      ],
    })

    Object.defineProperty(window.navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia,
        enumerateDevices: vi.fn(),
      },
    })

    render(<CameraPermissionButton />)

    await userEvent.click(screen.getByRole('button', { name: '카메라 권한 허용' }))

    await waitFor(() => {
      expect(useCameraStore.getState().cameraState).toBe('show')
      expect(window.localStorage.getItem('preferred-camera-device')).toBe(
        'camera-1',
      )
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/calibration')
      expect(stop).toHaveBeenCalled()
    })
  })

  it('윈도우에서 기본 선택 카메라 접근이 실패해도 일반 카메라 요청으로 폴백한다', async () => {
    const stop = vi.fn()
    const enumerateDevices = vi.fn().mockResolvedValue([
      { kind: 'videoinput', deviceId: 'camera-1' },
      { kind: 'videoinput', deviceId: 'camera-2' },
    ])
    const getUserMedia = vi
      .fn()
      .mockRejectedValueOnce(new Error('device busy'))
      .mockResolvedValueOnce({
        getTracks: () => [{ stop }],
        getVideoTracks: () => [
          {
            getSettings: () => ({}),
          },
        ],
      })

    Object.defineProperty(window.navigator, 'platform', {
      configurable: true,
      value: 'Win32',
    })
    Object.defineProperty(window.navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia,
        enumerateDevices,
      },
    })

    render(<CameraPermissionButton />)

    await userEvent.click(screen.getByRole('button', { name: '카메라 권한 허용' }))

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenNthCalledWith(1, {
        video: { deviceId: { exact: 'camera-2' } },
        audio: false,
      })
      expect(getUserMedia).toHaveBeenNthCalledWith(2, {
        video: true,
        audio: false,
      })
      expect(useCameraStore.getState().cameraState).toBe('show')
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/calibration')
      expect(window.localStorage.getItem('preferred-camera-device')).toBeNull()
      expect(window.alert).not.toHaveBeenCalled()
    })
  })
})
