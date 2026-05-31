import { fireEvent, render, screen } from '@testing-library/react'
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePostureEngineStore } from '@/entities/posture'
import CalibrationPage from '@/pages/calibration-page'
import { installMockStorage } from '../../setup/auth-test-storage'

const mockNavigate = vi.fn()
const mockCalibrateStart = vi.fn()
const mockCalibrateFrame = vi.fn()
const mockCalibrateFinish = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/features/posture-engine', () => ({
  calibrateStart: () => mockCalibrateStart(),
  calibrateCameraFrame: (payload: unknown) => mockCalibrateFrame(payload),
  calibrateFinish: () => mockCalibrateFinish(),
  useWindowVisibilitySync: vi.fn(),
}))

vi.mock('@/assets/common/images/calibration_guide.svg?react', () => ({
  default: () => <div>calibration-guide</div>,
}))

vi.mock('@/pages/calibration-page/components/WebcamView', () => ({
  default: ({
    remainingTime,
    onResultChange,
  }: {
    remainingTime?: number
    onResultChange?: (result: unknown) => void
  }) => {
    const didNotifyWebcamReadyRef = React.useRef(false)

    React.useEffect(() => {
      if (didNotifyWebcamReadyRef.current) return

      didNotifyWebcamReadyRef.current = true
      onResultChange?.({
        resultId: 'result-1',
        sessionId: 'session-1',
        timestamp: new Date().toISOString(),
        postureClass: 3,
        score: 1,
        pi: 0.1,
        landmarks: [{ x: 0.1, y: 0.1, z: 0.1 }],
        source: 'python_camera',
        engineMode: 'foreground',
        events: [],
      })
    }, [onResultChange])

    return <div>{`timer-${remainingTime ?? -1}`}</div>
  },
}))

describe('CalibrationPage', () => {
  beforeEach(() => {
    installMockStorage()
    vi.useFakeTimers()
    mockNavigate.mockReset()
    mockCalibrateStart.mockReset()
    mockCalibrateFrame.mockReset()
    mockCalibrateFinish.mockReset()
    usePostureEngineStore.getState().reset()
    usePostureEngineStore.getState().setEngineState({
      engineStatus: 'ready',
      mode: 'foreground',
      cameraOwner: 'python',
      updatedAt: new Date().toISOString(),
      message: null,
      recoverable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('보정 중 no_detection이 오면 타이머를 유지하고 자세 재감지를 기다린다', async () => {
    mockCalibrateStart.mockResolvedValue({ status: 'calibrating' })
    mockCalibrateFrame.mockResolvedValue({
      status: 'no_detection',
      frameCount: 1,
      step1Error: null,
      step2Error: '자세 감지가 끊겨 측정을 다시 준비하고 있어요',
    })
    mockCalibrateFinish.mockResolvedValue({
      status: 'completed',
      success: false,
      muPi: null,
      sigmaPi: null,
      quality: null,
      nTotal: null,
      nPass: null,
      passRate: null,
      message: null,
    })

    render(<CalibrationPage />)

    fireEvent.click(
      screen.getByRole('button', {
        name: 'onboarding.calibration.measureButton',
      }),
    )

    expect(screen.getByText('timer-5')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(150)
      await Promise.resolve()
    })

    await act(async () => {
      vi.advanceTimersByTime(1100)
      await Promise.resolve()
    })

    expect(screen.getByText('timer-5')).toBeInTheDocument()
    expect(
      screen.getByText('자세 감지가 끊겨 측정을 다시 준비하고 있어요'),
    ).toBeInTheDocument()
  })
})
