import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCameraStore } from '../../model/use-camera-store'
import { WebcamPanel } from '../WebcamPanel'

const webcamViewProps: Array<{ isActive?: boolean }> = []
const pauseSessionMutate = vi.fn()

const latestWebcamViewProps = () => webcamViewProps[webcamViewProps.length - 1]

vi.mock('@/pages/calibration-page/components/WebcamView', () => ({
  default: (props: { isActive?: boolean }) => {
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
  usePauseSessionMutation: () => ({ mutate: pauseSessionMutate, isPending: false }),
  useResumeSessionMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/features/posture-engine', () => ({
  useWindowVisibilitySync: vi.fn(),
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
    localStorage.clear()
    useCameraStore.setState({
      cameraState: 'exit',
      widgetState: 'hide',
    })
  })

  it('종료 상태에서는 자세 엔진 카메라를 비활성화한다', () => {
    render(<WebcamPanel />)

    expect(screen.getByTestId('webcam-view')).toBeInTheDocument()
    expect(latestWebcamViewProps()?.isActive).toBe(false)
  })

  it('카메라 표시 상태에서만 자세 엔진 카메라를 활성화한다', () => {
    useCameraStore.setState({ cameraState: 'show' })

    render(<WebcamPanel />)

    expect(latestWebcamViewProps()?.isActive).toBe(true)
  })

  it('카메라 감추기 클릭 즉시 자세 엔진 카메라를 비활성화한다', async () => {
    localStorage.setItem('sessionId', 'session-1')
    useCameraStore.setState({ cameraState: 'show' })

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
})
