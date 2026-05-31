import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePostureEngineStore } from '@/entities/posture'
import * as bridge from '../lib/tauri-posture-engine'
import {
  resetAutoStartPostureEngineForTest,
  useAutoStartPostureEngine,
} from './use-auto-start-posture-engine'

const idleEngineState = {
  engineStatus: 'idle' as const,
  mode: 'foreground' as const,
  cameraOwner: 'none' as const,
  updatedAt: new Date().toISOString(),
  message: null,
  recoverable: true,
}

function mockCameraPermission() {
  const stop = vi.fn()
  const stream = {
    getTracks: () => [{ stop }],
  } as unknown as MediaStream
  const getUserMedia = vi.fn().mockResolvedValue(stream)

  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia,
    },
  })
  Object.defineProperty(navigator, 'permissions', {
    configurable: true,
    value: {
      query: vi.fn().mockResolvedValue({ state: 'granted' }),
    },
  })

  return { getUserMedia, stop }
}

describe('useAutoStartPostureEngine', () => {
  beforeEach(() => {
    usePostureEngineStore.getState().reset()
    resetAutoStartPostureEngineForTest()
    localStorage.clear()
    vi.restoreAllMocks()
    mockCameraPermission()
  })

  it('활성화되면 카메라 권한을 확인한 뒤 sidecar를 자동 시작한다', async () => {
    vi.spyOn(bridge, 'isTauriRuntimeAvailable').mockReturnValue(true)
    vi.spyOn(bridge, 'getLatestPostureState').mockResolvedValue({
      session: null,
      latestResult: null,
      engineState: idleEngineState,
    })
    const startPostureEngine = vi
      .spyOn(bridge, 'startPostureEngine')
      .mockResolvedValue({
        engineStatus: 'ready',
        sessionId: 'auto-session',
        mode: 'foreground',
        streamUrl: 'http://127.0.0.1:49152/video?token=test-token',
      })
    vi.spyOn(bridge, 'setCalibration').mockResolvedValue({
      status: 'calibration_set',
      mu: 0,
      sigma: 1,
    })

    renderHook(() => useAutoStartPostureEngine(true))

    await waitFor(() => {
      expect(startPostureEngine).toHaveBeenCalled()
    })
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      video: true,
      audio: false,
    })
    expect(usePostureEngineStore.getState().engineState.engineStatus).toBe(
      'ready',
    )
    expect(usePostureEngineStore.getState().session?.sessionId).toBe(
      'auto-session',
    )
  })

  it('비활성화 상태에서는 sidecar를 시작하지 않는다', async () => {
    vi.spyOn(bridge, 'isTauriRuntimeAvailable').mockReturnValue(true)
    const startPostureEngine = vi
      .spyOn(bridge, 'startPostureEngine')
      .mockResolvedValue({
        engineStatus: 'ready',
        sessionId: 'auto-session',
        mode: 'foreground',
        streamUrl: null,
      })

    renderHook(() => useAutoStartPostureEngine(false))

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(startPostureEngine).not.toHaveBeenCalled()
  })

  it('이미 엔진이 실행 중이면 중복 시작하지 않는다', async () => {
    vi.spyOn(bridge, 'isTauriRuntimeAvailable').mockReturnValue(true)
    vi.spyOn(bridge, 'getLatestPostureState').mockResolvedValue({
      session: null,
      latestResult: null,
      engineState: {
        ...idleEngineState,
        engineStatus: 'ready',
        cameraOwner: 'python',
      },
    })
    const startPostureEngine = vi
      .spyOn(bridge, 'startPostureEngine')
      .mockResolvedValue({
        engineStatus: 'ready',
        sessionId: 'auto-session',
        mode: 'foreground',
        streamUrl: null,
      })

    renderHook(() => useAutoStartPostureEngine(true))

    await waitFor(() => {
      expect(bridge.getLatestPostureState).toHaveBeenCalled()
    })
    expect(startPostureEngine).not.toHaveBeenCalled()
  })

  it('권한 확인 후 sidecar 시작 실패를 recoverable 에러로 기록한다', async () => {
    vi.spyOn(bridge, 'isTauriRuntimeAvailable').mockReturnValue(true)
    vi.spyOn(bridge, 'getLatestPostureState').mockResolvedValue({
      session: null,
      latestResult: null,
      engineState: idleEngineState,
    })
    vi.spyOn(bridge, 'startPostureEngine').mockRejectedValue(
      new Error('camera_busy'),
    )

    renderHook(() => useAutoStartPostureEngine(true))

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
      expect(bridge.startPostureEngine).toHaveBeenCalled()
      expect(usePostureEngineStore.getState().engineState).toMatchObject({
        engineStatus: 'error',
        cameraOwner: 'none',
        message: 'camera_busy',
        recoverable: true,
      })
    })
    expect(usePostureEngineStore.getState().session).toBeNull()
  })
})
