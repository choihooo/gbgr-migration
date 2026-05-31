import { render, screen } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCameraStore } from '@/features/main-panels/model/use-camera-store'
import WebcamView from '@/pages/calibration-page/components/WebcamView'
import { installMockStorage } from '../../setup/auth-test-storage'

const mockUsePostureEngine = vi.fn()
const stopTrack = vi.fn()
const cameraPermissionModalProps: Array<{
  isOpen: boolean
  message: string
  onRetry: () => void
}> = []

vi.mock('@/features/posture-engine', () => ({
  CameraPermissionModal: (props: {
    isOpen: boolean
    message: string
    onRetry: () => void
  }) => {
    cameraPermissionModalProps.push(props)
    return props.isOpen ? (
      <button type="button" onClick={props.onRetry}>
        {props.message}
      </button>
    ) : null
  },
  usePostureEngine: (...args: unknown[]) => mockUsePostureEngine(...args),
}))

vi.mock('@/entities/posture', () => ({
  PoseOverlayCanvas: () => <div>pose-overlay</div>,
}))

vi.mock('react-webcam', () => {
  return {
    default: React.forwardRef(
      (props: { onUserMedia?: (stream: MediaStream) => void }, ref) => {
        const didNotifyUserMediaRef = React.useRef(false)

        React.useEffect(() => {
          if (didNotifyUserMediaRef.current) return

          didNotifyUserMediaRef.current = true
          props.onUserMedia?.({
            getTracks: () => [{ stop: stopTrack }],
            getVideoTracks: () => [],
          } as unknown as MediaStream)
        }, [props.onUserMedia])

        React.useImperativeHandle(ref, () => ({
          video: {
            srcObject: {
              getTracks: () => [{ stop: stopTrack }],
            },
            readyState: 4,
          },
        }))

        return <div data-testid="mock-webcam" />
      },
    ),
  }
})

describe('WebcamView', () => {
  beforeEach(() => {
    installMockStorage()
    cameraPermissionModalProps.length = 0
    useCameraStore.setState({ cameraState: 'show', widgetState: 'hide' })
    mockUsePostureEngine.mockReset()
    stopTrack.mockReset()
    mockUsePostureEngine.mockReturnValue({
      overlayLandmarks: [],
      latestResult: null,
      streamUrl: 'http://127.0.0.1:49152/video?token=test-token',
      engineState: {
        engineStatus: 'ready',
        mode: 'foreground',
        cameraOwner: 'python',
        updatedAt: new Date().toISOString(),
        message: null,
        recoverable: true,
      },
      runtimeAvailable: true,
    })
  })

  it('background 모드로 전환되어도 브라우저 웹캠을 열지 않는다', () => {
    const { rerender } = render(<WebcamView mode="foreground" />)

    expect(screen.queryByTestId('mock-webcam')).toBeNull()

    rerender(<WebcamView mode="background" />)

    expect(stopTrack).not.toHaveBeenCalled()
    expect(screen.queryByTestId('mock-webcam')).toBeNull()
  })

  it('foreground 모드에서도 브라우저 웹캠 대신 sidecar 스트림을 표시한다', () => {
    render(<WebcamView mode="foreground" />)

    expect(screen.queryByTestId('mock-webcam')).toBeNull()
    expect(screen.getByAltText('자세 측정 카메라 스트림')).toHaveAttribute(
      'src',
      'http://127.0.0.1:49152/video?token=test-token',
    )
  })

  it('카메라 상태 무시 옵션이 있으면 exit 상태에서도 sidecar 스트림을 표시한다', () => {
    useCameraStore.setState({ cameraState: 'exit', widgetState: 'hide' })
    const CalibrationWebcamView = WebcamView as React.ComponentType<{
      mode: 'foreground'
      ignoreCameraState: boolean
    }>

    render(<CalibrationWebcamView mode="foreground" ignoreCameraState={true} />)

    expect(screen.queryByText(/오늘 한걸음 나아갔네요/)).not.toBeInTheDocument()
    expect(screen.getByAltText('자세 측정 카메라 스트림')).toHaveAttribute(
      'src',
      'http://127.0.0.1:49152/video?token=test-token',
    )
  })

  it.each([
    ['camera_permission_denied', '권한'],
    ['camera_unavailable', '카메라를 열 수 없어요'],
    ['camera_busy', '다른 앱'],
    ['camera_frame_unavailable', '프레임'],
  ])('recoverable 카메라 에러 %s 안내와 재시도를 제공한다', (message, text) => {
    const retryStart = vi.fn()
    mockUsePostureEngine.mockReturnValue({
      overlayLandmarks: [],
      latestResult: null,
      streamUrl: null,
      retryStart,
      engineState: {
        engineStatus: 'error',
        mode: 'foreground',
        cameraOwner: 'none',
        updatedAt: new Date().toISOString(),
        message,
        recoverable: true,
      },
      runtimeAvailable: true,
    })

    render(<WebcamView mode="foreground" />)

    const retryButton = screen.getByRole('button', {
      name: new RegExp(text),
    })
    retryButton.click()

    expect(
      cameraPermissionModalProps[cameraPermissionModalProps.length - 1],
    ).toMatchObject({
      isOpen: true,
    })
    expect(retryStart).toHaveBeenCalledTimes(1)
  })
})
