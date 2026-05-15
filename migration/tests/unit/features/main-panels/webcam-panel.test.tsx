import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCameraStore } from '@/features/main-panels/model/use-camera-store'
import { WebcamPanel } from '@/features/main-panels/ui/WebcamPanel'
import { installMockStorage } from '../../../setup/auth-test-storage'

const mockCreateSessionMutate = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/entities/dashboard/model/use-dashboard-queries', () => ({
  useLevelQuery: () => ({
    data: {
      data: {
        current: 0,
      },
    },
  }),
}))

vi.mock('@/entities/session/model/use-session-mutations', () => ({
  useCreateSessionMutation: () => ({
    mutate: mockCreateSessionMutate,
    isPending: false,
  }),
  useStopSessionMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  usePauseSessionMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useResumeSessionMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/features/posture-engine', () => ({
  useWindowVisibilitySync: vi.fn(),
}))

vi.mock('@/features/posture-engine/model/use-auto-metrics-sender', () => ({
  useAutoMetricsSender: vi.fn(),
}))

vi.mock('@/features/posture-engine/model/use-metrics-collector', () => ({
  useMetricsCollector: () => ({
    flushMetrics: vi.fn(),
  }),
}))

vi.mock('@/features/posture-engine/model/use-session-cleanup', () => ({
  useSessionCleanup: vi.fn(),
}))

vi.mock('@/pages/calibration-page/components/WebcamView', () => ({
  default: () => <div>webcam-view</div>,
}))

vi.mock('@/shared/hooks/use-widget', () => ({
  useWidget: () => ({
    toggleWidget: vi.fn(),
  }),
}))

describe('WebcamPanel', () => {
  beforeEach(() => {
    installMockStorage()
    useCameraStore.setState({ cameraState: 'exit', widgetState: 'hide' })
    mockCreateSessionMutate.mockReset()
  })

  it('세션 생성 실패 시 카메라 상태를 show로 바꾸지 않는다', async () => {
    mockCreateSessionMutate.mockImplementation(
      (_value: unknown, options?: { onError?: () => void }) => {
        options?.onError?.()
      },
    )

    render(<WebcamPanel />)

    await userEvent.click(
      screen.getByRole('button', { name: 'dashboard.webcam.start' }),
    )

    expect(useCameraStore.getState().cameraState).toBe('exit')
  })
})
