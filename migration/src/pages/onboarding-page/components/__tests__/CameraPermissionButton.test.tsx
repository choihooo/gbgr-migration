import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCameraStore } from '@/features/main-panels/model/use-camera-store'
import * as postureEngine from '@/features/posture-engine'
import OnboardingPage from '../../index'
import CameraPermissionButton from '../CameraPermissionButton'

const navigate = vi.fn()
const getUserMedia = vi.fn()
const stopTrack = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}))

vi.mock('@/features/posture-engine', () => ({
  startPostureEngine: vi.fn(),
  stopPostureEngine: vi.fn(),
}))

vi.mock('@/assets/common/icons/camera.svg?react', () => ({
  default: () => <svg aria-label="camera" />,
}))

describe('CameraPermissionButton', () => {
  beforeEach(() => {
    navigate.mockReset()
    getUserMedia.mockReset()
    stopTrack.mockReset()
    getUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: stopTrack }],
      getVideoTracks: () => [{ getSettings: () => ({}) }],
    })
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

  it('권한 요청 전에 카메라 사용 목적과 로컬 처리 안내를 보여준다', () => {
    render(<OnboardingPage />)

    expect(
      screen.getByText(/PC 웹캠을 통해 사용자의 자세를 실시간으로 분석/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/영상은 서버로 전송되지 않아요/),
    ).toBeInTheDocument()
    expect(getUserMedia).not.toHaveBeenCalled()
  })

  it('Tauri 런타임에서는 WebView 권한을 먼저 얻은 뒤 sidecar를 확인한다', async () => {
    render(<CameraPermissionButton />)

    fireEvent.click(screen.getByRole('button', { name: '카메라 권한 허용' }))

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledWith({
        video: true,
        audio: false,
      })
      expect(postureEngine.startPostureEngine).toHaveBeenCalled()
      expect(navigate).toHaveBeenCalledWith('/onboarding/calibration')
    })
    expect(stopTrack).toHaveBeenCalled()
    expect(getUserMedia.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(postureEngine.startPostureEngine).mock.invocationCallOrder[0],
    )
    expect(postureEngine.stopPostureEngine).toHaveBeenCalled()
    expect(useCameraStore.getState().cameraState).toBe('show')
  })

  it('WebView 권한 이후 sidecar 시작이 실패하면 캘리브레이션으로 이동하지 않는다', async () => {
    vi.mocked(postureEngine.startPostureEngine).mockRejectedValue(
      new Error('camera_unavailable'),
    )
    vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(<CameraPermissionButton />)

    fireEvent.click(screen.getByRole('button', { name: '카메라 권한 허용' }))

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalled()
      expect(postureEngine.startPostureEngine).toHaveBeenCalled()
    })

    expect(navigate).not.toHaveBeenCalled()
    expect(useCameraStore.getState().cameraState).toBe('exit')
    expect(postureEngine.stopPostureEngine).not.toHaveBeenCalled()
  })
})
