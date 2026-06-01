import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCameraStore } from '../../model/use-camera-store'
import { WebcamPanel } from '../WebcamPanel'

const webcamViewProps: Array<{ isActive?: boolean; mode?: string }> = []
const pauseSessionMutate = vi.fn()
const resumeSessionMutate = vi.fn()

const latestWebcamViewProps = () => webcamViewProps[webcamViewProps.length - 1]

vi.mock('@/pages/calibration-page/components/WebcamView', () => ({
  default: (props: { isActive?: boolean; mode?: string }) => {
    webcamViewProps.push(props)
    return <div data-testid="webcam-view" />
  },
}))

vi.mock('@/entities/dashboard/model/use-dashboard-queries', () => ({
  useLevelQuery: () => ({ data: { data: { current: 0 } } }),
}))

vi.mock('@/entities/session/model/use-session-mutations', () => ({
  useCreateSessionMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useStopSessionMutation: () => ({ mutate: vi.fn(), isPending: false }),
  usePauseSessionMutation: () => ({
    mutate: pauseSessionMutate,
    isPending: false,
  }),
  useResumeSessionMutation: () => ({
    mutate: resumeSessionMutate,
    isPending: false,
  }),
}))

vi.mock('@/features/posture-engine/model/use-auto-metrics-sender', () => ({
  useAutoMetricsSender: vi.fn(),
}))

vi.mock('@/features/posture-engine/model/use-metrics-collector', () => ({
  useMetricsCollector: () => ({ flushMetrics: vi.fn() }),
}))

vi.mock('@/features/posture-engine/model/use-session-cleanup', () => ({
  useSessionCleanup: vi.fn(),
}))

vi.mock('@/shared/hooks/use-widget', () => ({
  useWidget: () => ({ toggleWidget: vi.fn() }),
}))

describe('WebcamPanel', () => {
  beforeEach(() => {
    webcamViewProps.length = 0
    pauseSessionMutate.mockReset()
    resumeSessionMutate.mockReset()
    localStorage.clear()
    useCameraStore.getState().resetCameraLifecycle()
    useCameraStore.setState({ widgetState: 'hide' })
  })

  it('종료 상태에서는 자세 엔진 카메라를 비활성화한다', () => {
    render(<WebcamPanel />)

    expect(screen.getByTestId('webcam-view')).toBeInTheDocument()
    expect(latestWebcamViewProps()?.isActive).toBe(false)
  })

  it('카메라 표시 상태에서만 자세 엔진 카메라를 활성화한다', () => {
    useCameraStore.getState().setShow()

    render(<WebcamPanel />)

    expect(latestWebcamViewProps()?.isActive).toBe(true)
  })

  it('show 의도여도 runtime 준비 전이면 preview live 상태는 false로 유지한다', () => {
    useCameraStore.getState().setShow()
    useCameraStore.getState().setCameraRuntime({
      runtime: 'starting',
      streamUrl: null,
      errorCode: null,
    })

    render(<WebcamPanel />)

    expect(latestWebcamViewProps()?.isActive).toBe(true)
    expect(useCameraStore.getState().isCameraLive()).toBe(false)
  })

  it('앱 visibility 변화와 무관하게 preview mode는 foreground로 유지한다', () => {
    localStorage.setItem('sessionId', 'session-1')
    useCameraStore.getState().setShow()

    render(<WebcamPanel />)

    document.dispatchEvent(new Event('visibilitychange'))

    expect(latestWebcamViewProps()).toMatchObject({
      isActive: true,
      mode: 'foreground',
    })
    expect(useCameraStore.getState().cameraState).toBe('show')
  })

  it('카메라 감추기 클릭 즉시 자세 엔진 카메라를 비활성화한다', async () => {
    localStorage.setItem('sessionId', 'session-1')
    useCameraStore.getState().setShow()

    render(<WebcamPanel />)
    fireEvent.click(screen.getAllByRole('button')[0])

    await waitFor(() => {
      expect(latestWebcamViewProps()?.isActive).toBe(false)
    })
    expect(pauseSessionMutate).toHaveBeenCalledWith(
      'session-1',
      expect.any(Object),
    )
  })

  it('숨김 후 다시 표시할 때 runtime ready 이후에만 세션을 재개한다', async () => {
    localStorage.setItem('sessionId', 'session-1')
    useCameraStore.getState().setHide()

    render(<WebcamPanel />)
    fireEvent.click(screen.getAllByRole('button')[0])

    expect(resumeSessionMutate).not.toHaveBeenCalled()

    useCameraStore.getState().setCameraRuntime({
      runtime: 'ready',
      streamUrl: 'http://127.0.0.1:49152/video?token=test-token',
      errorCode: null,
    })

    await waitFor(() => {
      expect(resumeSessionMutate).toHaveBeenCalledWith(
        'session-1',
        expect.any(Object),
      )
    })
  })
})
