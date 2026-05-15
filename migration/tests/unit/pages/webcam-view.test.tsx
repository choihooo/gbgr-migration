import { render, screen } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCameraStore } from '@/features/main-panels/model/use-camera-store'
import WebcamView from '@/pages/calibration-page/components/WebcamView'
import { installMockStorage } from '../../setup/auth-test-storage'

const mockUsePostureEngine = vi.fn()
const stopTrack = vi.fn()

vi.mock('@/features/posture-engine', () => ({
  usePostureEngine: (...args: unknown[]) => mockUsePostureEngine(...args),
}))

vi.mock('@/entities/posture', () => ({
  PoseOverlayCanvas: () => <div>pose-overlay</div>,
}))

vi.mock('react-webcam', () => {
  return {
    default: React.forwardRef((props: { onUserMedia?: (stream: MediaStream) => void }, ref) => {
      React.useEffect(() => {
        props.onUserMedia?.({
          getTracks: () => [{ stop: stopTrack }],
          getVideoTracks: () => [],
        } as unknown as MediaStream)
      }, [])

      React.useImperativeHandle(ref, () => ({
        video: {
          srcObject: {
            getTracks: () => [{ stop: stopTrack }],
          },
          readyState: 4,
        },
      }))

      return <div data-testid="mock-webcam" />
    }),
  }
})

describe('WebcamView', () => {
  beforeEach(() => {
    installMockStorage()
    useCameraStore.setState({ cameraState: 'show', widgetState: 'hide' })
    mockUsePostureEngine.mockReset()
    stopTrack.mockReset()
    mockUsePostureEngine.mockReturnValue({
      overlayLandmarks: [],
      latestResult: null,
      engineState: {
        engineStatus: 'ready',
        mode: 'foreground',
        cameraOwner: 'react',
        updatedAt: new Date().toISOString(),
        message: null,
        recoverable: true,
      },
      runtimeAvailable: true,
    })
  })

  it('background 모드로 전환되면 브라우저 웹캠을 정지하고 언마운트한다', () => {
    const { rerender } = render(<WebcamView mode="foreground" />)

    expect(screen.getByTestId('mock-webcam')).toBeInTheDocument()

    rerender(<WebcamView mode="background" />)

    expect(stopTrack).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('mock-webcam')).toBeNull()
  })
})
