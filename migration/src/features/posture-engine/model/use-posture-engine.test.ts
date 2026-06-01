import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  PostureEngineResult,
  StartPostureEngineResponse,
} from '@/entities/posture'
import {
  createEmptyEngineState,
  usePostureEngineStore,
} from '@/entities/posture'
import { useCameraStore } from '@/features/main-panels/model/use-camera-store'
import * as bridge from '../lib/tauri-posture-engine'
import { usePostureEngine } from './use-posture-engine'

const createDeferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('usePostureEngine', () => {
  beforeEach(() => {
    usePostureEngineStore.getState().reset()
    useCameraStore.getState().resetCameraLifecycle()
    localStorage.clear()
    delete (
      globalThis as {
        __GBGR_CAMERA_PREVIEW_TIMEOUT_MS__?: number
      }
    ).__GBGR_CAMERA_PREVIEW_TIMEOUT_MS__
    vi.restoreAllMocks()
  })

  it('최신 결과 이벤트를 수신하면 스토어에 반영한다', async () => {
    const latestResult: PostureEngineResult = {
      resultId: 'result-1',
      sessionId: 'session-1',
      timestamp: new Date().toISOString(),
      postureClass: 3,
      score: 1.2,
      pi: 0.4,
      landmarks: [{ x: 0.3, y: 0.2, z: 0.1 }],
      source: 'python_camera' as const,
      engineMode: 'foreground' as const,
      events: [],
    }

    vi.spyOn(bridge, 'getLatestPostureState').mockResolvedValue({
      session: null,
      latestResult,
      engineState: {
        engineStatus: 'idle',
        mode: 'foreground',
        cameraOwner: 'none',
        updatedAt: new Date().toISOString(),
        message: null,
        recoverable: true,
      },
    })
    vi.spyOn(bridge, 'startPostureEngine').mockResolvedValue({
      engineStatus: 'ready',
      sessionId: 'session-1',
      mode: 'foreground',
      streamUrl: 'http://127.0.0.1:49152/video?token=test-token',
    })
    vi.spyOn(bridge, 'stopBackgroundMeasurement').mockResolvedValue({
      engineStatus: 'ready',
      mode: 'foreground',
    })
    vi.spyOn(bridge, 'subscribeToPostureResults').mockImplementation(
      async handler => {
        handler(latestResult)
        return () => {}
      },
    )
    vi.spyOn(bridge, 'subscribeToPostureEngineStatus').mockResolvedValue(
      () => {},
    )
    vi.spyOn(bridge, 'subscribeToPostureWarnings').mockResolvedValue(() => {})
    vi.spyOn(bridge, 'isTauriRuntimeAvailable').mockReturnValue(true)

    renderHook(() => usePostureEngine({ active: true }))

    await act(async () => {
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(usePostureEngineStore.getState().latestResult).toEqual(
        latestResult,
      )
    })
    expect(usePostureEngineStore.getState().session?.sessionId).toBe(
      'session-1',
    )
  })

  it('활성화된 상태로 언마운트되면 sidecar 카메라를 정리한다', async () => {
    vi.spyOn(bridge, 'isTauriRuntimeAvailable').mockReturnValue(true)
    vi.spyOn(bridge, 'getLatestPostureState').mockResolvedValue({
      session: null,
      latestResult: null,
      engineState: {
        engineStatus: 'idle',
        mode: 'foreground',
        cameraOwner: 'none',
        updatedAt: new Date().toISOString(),
        message: null,
        recoverable: true,
      },
    })
    vi.spyOn(bridge, 'subscribeToPostureResults').mockResolvedValue(() => {})
    vi.spyOn(bridge, 'subscribeToPostureEngineStatus').mockResolvedValue(
      () => {},
    )
    vi.spyOn(bridge, 'subscribeToPostureWarnings').mockResolvedValue(() => {})
    vi.spyOn(bridge, 'startPostureEngine').mockResolvedValue({
      engineStatus: 'ready',
      sessionId: 'session-cleanup',
      mode: 'foreground',
      streamUrl: 'http://127.0.0.1:49152/video?token=test-token',
    })
    vi.spyOn(bridge, 'stopBackgroundMeasurement').mockResolvedValue({
      engineStatus: 'ready',
      mode: 'foreground',
    })
    const stopPostureEngine = vi
      .spyOn(bridge, 'stopPostureEngine')
      .mockResolvedValue({
        engineStatus: 'idle',
        releasedOwner: 'python',
      })

    const { unmount } = renderHook(() => usePostureEngine({ active: true }))

    await waitFor(() => {
      expect(bridge.startPostureEngine).toHaveBeenCalled()
    })

    unmount()

    await waitFor(() => {
      expect(stopPostureEngine).toHaveBeenCalled()
    })
  })

  it('retryStart가 자세 엔진 시작을 다시 시도한다', async () => {
    vi.spyOn(bridge, 'isTauriRuntimeAvailable').mockReturnValue(true)
    vi.spyOn(bridge, 'getLatestPostureState').mockResolvedValue({
      session: null,
      latestResult: null,
      engineState: createEmptyEngineState(),
    })
    vi.spyOn(bridge, 'subscribeToPostureResults').mockResolvedValue(() => {})
    vi.spyOn(bridge, 'subscribeToPostureEngineStatus').mockResolvedValue(
      () => {},
    )
    vi.spyOn(bridge, 'subscribeToPostureWarnings').mockResolvedValue(() => {})
    const start = vi.spyOn(bridge, 'startPostureEngine').mockResolvedValue({
      engineStatus: 'ready',
      sessionId: 'session-retry',
      mode: 'foreground',
      streamUrl: 'http://127.0.0.1:49152/video?token=test-token',
    })

    const { result } = renderHook(() => usePostureEngine({ active: true }))

    await waitFor(() => {
      expect(start).toHaveBeenCalledTimes(1)
    })

    act(() => {
      result.current.retryStart()
    })

    await waitFor(() => {
      expect(start).toHaveBeenCalledTimes(2)
    })
  })

  it('startPostureEngine 실패를 엔진 에러 상태로 반영한다', async () => {
    vi.spyOn(bridge, 'isTauriRuntimeAvailable').mockReturnValue(true)
    vi.spyOn(bridge, 'getLatestPostureState').mockResolvedValue({
      session: null,
      latestResult: null,
      engineState: createEmptyEngineState(),
    })
    vi.spyOn(bridge, 'subscribeToPostureResults').mockResolvedValue(() => {})
    vi.spyOn(bridge, 'subscribeToPostureEngineStatus').mockResolvedValue(
      () => {},
    )
    vi.spyOn(bridge, 'subscribeToPostureWarnings').mockResolvedValue(() => {})
    vi.spyOn(bridge, 'startPostureEngine').mockRejectedValue(
      'camera_unavailable',
    )

    renderHook(() => usePostureEngine({ active: true }))

    await waitFor(() => {
      expect(usePostureEngineStore.getState().engineState).toMatchObject({
        engineStatus: 'error',
        cameraOwner: 'none',
        message: 'camera_unavailable',
      })
    })
  })

  it('startPostureEngine 성공 시 streamUrl을 노출하고 실패 시 제거한다', async () => {
    vi.spyOn(bridge, 'isTauriRuntimeAvailable').mockReturnValue(true)
    vi.spyOn(bridge, 'getLatestPostureState').mockResolvedValue({
      session: null,
      latestResult: null,
      engineState: createEmptyEngineState(),
    })
    vi.spyOn(bridge, 'subscribeToPostureResults').mockResolvedValue(() => {})
    vi.spyOn(bridge, 'subscribeToPostureEngineStatus').mockResolvedValue(
      () => {},
    )
    vi.spyOn(bridge, 'subscribeToPostureWarnings').mockResolvedValue(() => {})
    vi.spyOn(bridge, 'startPostureEngine')
      .mockResolvedValueOnce({
        engineStatus: 'ready',
        sessionId: 'session-stream',
        mode: 'foreground',
        streamUrl: 'http://127.0.0.1:49152/video?token=test-token',
      })
      .mockRejectedValueOnce(new Error('camera_unavailable'))
    vi.spyOn(bridge, 'stopPostureEngine').mockResolvedValue({
      engineStatus: 'idle',
      releasedOwner: 'python',
    })

    const { result } = renderHook(() => usePostureEngine({ active: true }))

    await waitFor(() => {
      expect(result.current.streamUrl).toBe(
        'http://127.0.0.1:49152/video?token=test-token',
      )
    })

    act(() => {
      result.current.retryStart()
    })

    await waitFor(() => {
      expect(result.current.streamUrl).toBeNull()
      expect(usePostureEngineStore.getState().engineState.message).toBe(
        'camera_unavailable',
      )
    })
  })

  it('preview streamUrl이 5초 안에 준비되지 않으면 복구 가능한 에러로 전환한다', async () => {
    ;(
      globalThis as {
        __GBGR_CAMERA_PREVIEW_TIMEOUT_MS__?: number
      }
    ).__GBGR_CAMERA_PREVIEW_TIMEOUT_MS__ = 1
    vi.spyOn(bridge, 'isTauriRuntimeAvailable').mockReturnValue(true)
    vi.spyOn(bridge, 'getLatestPostureState').mockResolvedValue({
      session: null,
      latestResult: null,
      engineState: createEmptyEngineState(),
    })
    vi.spyOn(bridge, 'subscribeToPostureResults').mockResolvedValue(() => {})
    vi.spyOn(bridge, 'subscribeToPostureEngineStatus').mockResolvedValue(
      () => {},
    )
    vi.spyOn(bridge, 'subscribeToPostureWarnings').mockResolvedValue(() => {})
    vi.spyOn(bridge, 'startPostureEngine').mockResolvedValue({
      engineStatus: 'ready',
      sessionId: 'session-timeout',
      mode: 'foreground',
      streamUrl: null,
    })

    renderHook(() => usePostureEngine({ active: true }))

    await waitFor(() => {
      expect(bridge.startPostureEngine).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(usePostureEngineStore.getState().engineState).toMatchObject({
        engineStatus: 'error',
        message: 'camera_frame_unavailable',
        recoverable: true,
      })
    })
  })

  it('비활성 상태로 전환되면 sidecar를 정리하고 streamUrl을 비운다', async () => {
    vi.spyOn(bridge, 'isTauriRuntimeAvailable').mockReturnValue(true)
    vi.spyOn(bridge, 'getLatestPostureState').mockResolvedValue({
      session: null,
      latestResult: null,
      engineState: createEmptyEngineState(),
    })
    vi.spyOn(bridge, 'subscribeToPostureResults').mockResolvedValue(() => {})
    vi.spyOn(bridge, 'subscribeToPostureEngineStatus').mockResolvedValue(
      () => {},
    )
    vi.spyOn(bridge, 'subscribeToPostureWarnings').mockResolvedValue(() => {})
    vi.spyOn(bridge, 'startPostureEngine').mockResolvedValue({
      engineStatus: 'ready',
      sessionId: 'session-inactive',
      mode: 'foreground',
      streamUrl: 'http://127.0.0.1:49152/video?token=test-token',
    })
    const stopPostureEngine = vi
      .spyOn(bridge, 'stopPostureEngine')
      .mockResolvedValue({
        engineStatus: 'idle',
        releasedOwner: 'python',
      })

    const { result, rerender } = renderHook(
      ({ active }) => usePostureEngine({ active }),
      {
        initialProps: { active: true },
      },
    )

    await waitFor(() => {
      expect(result.current.streamUrl).toContain('127.0.0.1')
    })

    rerender({ active: false })

    await waitFor(() => {
      expect(stopPostureEngine).toHaveBeenCalledTimes(1)
      expect(result.current.streamUrl).toBeNull()
    })
  })

  it('카메라 시작 중에는 lifecycle starting을 발행하고 stream 준비 후 ready로 전환한다', async () => {
    const deferred = createDeferred<StartPostureEngineResponse>()
    useCameraStore.getState().setShow()
    vi.spyOn(bridge, 'isTauriRuntimeAvailable').mockReturnValue(true)
    vi.spyOn(bridge, 'getLatestPostureState').mockResolvedValue({
      session: null,
      latestResult: null,
      engineState: createEmptyEngineState(),
    })
    vi.spyOn(bridge, 'subscribeToPostureResults').mockResolvedValue(() => {})
    vi.spyOn(bridge, 'subscribeToPostureEngineStatus').mockResolvedValue(
      () => {},
    )
    vi.spyOn(bridge, 'subscribeToPostureWarnings').mockResolvedValue(() => {})
    vi.spyOn(bridge, 'startPostureEngine').mockReturnValue(deferred.promise)

    renderHook(() => usePostureEngine({ active: true }))

    await waitFor(() => {
      expect(useCameraStore.getState().cameraLifecycle).toMatchObject({
        intent: 'show',
        runtime: 'starting',
        streamUrl: null,
      })
    })

    deferred.resolve({
      engineStatus: 'ready',
      sessionId: 'session-lifecycle',
      mode: 'foreground',
      streamUrl: 'http://127.0.0.1:49152/video?token=test-token',
    })

    await waitFor(() => {
      expect(useCameraStore.getState().cameraLifecycle).toMatchObject({
        intent: 'show',
        runtime: 'ready',
        streamUrl: 'http://127.0.0.1:49152/video?token=test-token',
        errorCode: null,
      })
    })
  })

  it('비활성 전환 후 늦게 도착한 시작 성공은 lifecycle ready로 반영하지 않는다', async () => {
    const deferred = createDeferred<StartPostureEngineResponse>()
    useCameraStore.getState().setShow()
    vi.spyOn(bridge, 'isTauriRuntimeAvailable').mockReturnValue(true)
    vi.spyOn(bridge, 'getLatestPostureState').mockResolvedValue({
      session: null,
      latestResult: null,
      engineState: createEmptyEngineState(),
    })
    vi.spyOn(bridge, 'subscribeToPostureResults').mockResolvedValue(() => {})
    vi.spyOn(bridge, 'subscribeToPostureEngineStatus').mockResolvedValue(
      () => {},
    )
    vi.spyOn(bridge, 'subscribeToPostureWarnings').mockResolvedValue(() => {})
    vi.spyOn(bridge, 'startPostureEngine').mockReturnValue(deferred.promise)
    vi.spyOn(bridge, 'stopPostureEngine').mockResolvedValue({
      engineStatus: 'idle',
      releasedOwner: 'python',
    })

    const { rerender } = renderHook(
      ({ active }) => usePostureEngine({ active }),
      { initialProps: { active: true } },
    )

    await waitFor(() => {
      expect(useCameraStore.getState().cameraLifecycle.runtime).toBe('starting')
    })

    useCameraStore.getState().setHide()
    rerender({ active: false })
    deferred.resolve({
      engineStatus: 'ready',
      sessionId: 'session-late',
      mode: 'foreground',
      streamUrl: 'http://127.0.0.1:49152/video?token=late-token',
    })

    await waitFor(() => {
      expect(useCameraStore.getState().cameraLifecycle).toMatchObject({
        intent: 'hide',
        runtime: 'idle',
        streamUrl: null,
      })
    })
  })

  it('카메라 시작 실패는 show intent를 유지하고 lifecycle error와 null streamUrl을 기록한다', async () => {
    useCameraStore.getState().setShow()
    vi.spyOn(bridge, 'isTauriRuntimeAvailable').mockReturnValue(true)
    vi.spyOn(bridge, 'getLatestPostureState').mockResolvedValue({
      session: null,
      latestResult: null,
      engineState: createEmptyEngineState(),
    })
    vi.spyOn(bridge, 'subscribeToPostureResults').mockResolvedValue(() => {})
    vi.spyOn(bridge, 'subscribeToPostureEngineStatus').mockResolvedValue(
      () => {},
    )
    vi.spyOn(bridge, 'subscribeToPostureWarnings').mockResolvedValue(() => {})
    vi.spyOn(bridge, 'startPostureEngine').mockRejectedValue(
      new Error('camera_busy'),
    )

    renderHook(() => usePostureEngine({ active: true }))

    await waitFor(() => {
      expect(useCameraStore.getState().cameraLifecycle).toMatchObject({
        intent: 'show',
        runtime: 'error',
        streamUrl: null,
        errorCode: 'camera_busy',
      })
    })
  })

  it('카메라 진단에는 프레임, 장치 식별자, 스트림 토큰을 저장하지 않는다', async () => {
    vi.spyOn(bridge, 'isTauriRuntimeAvailable').mockReturnValue(true)
    vi.spyOn(bridge, 'getLatestPostureState').mockResolvedValue({
      session: null,
      latestResult: null,
      engineState: createEmptyEngineState(),
    })
    vi.spyOn(bridge, 'subscribeToPostureResults').mockResolvedValue(() => {})
    vi.spyOn(bridge, 'subscribeToPostureEngineStatus').mockResolvedValue(
      () => {},
    )
    vi.spyOn(bridge, 'subscribeToPostureWarnings').mockResolvedValue(() => {})
    vi.spyOn(bridge, 'startPostureEngine').mockRejectedValue(
      new Error('camera_permission_denied'),
    )

    renderHook(() => usePostureEngine({ active: true }))

    await waitFor(() => {
      expect(usePostureEngineStore.getState().cameraDiagnostics.length).toBe(2)
    })

    const diagnostics = JSON.stringify(
      usePostureEngineStore.getState().cameraDiagnostics,
    )

    expect(diagnostics).not.toContain('data:image')
    expect(diagnostics).not.toContain('deviceId')
    expect(diagnostics).not.toContain('FaceTime')
    expect(diagnostics).not.toContain('token=')
  })
})
