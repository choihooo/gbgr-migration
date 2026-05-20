import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PostureEngineResult } from '@/entities/posture'
import { usePostureEngineStore } from '@/entities/posture'
import * as bridge from '../lib/tauri-posture-engine'
import { usePostureEngine } from './use-posture-engine'

describe('usePostureEngine', () => {
  beforeEach(() => {
    usePostureEngineStore.getState().reset()
    localStorage.clear()
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
      source: 'react_frame' as const,
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
    vi.spyOn(bridge, 'pushPostureFrame').mockResolvedValue({
      accepted: true,
      reason: null,
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
})
