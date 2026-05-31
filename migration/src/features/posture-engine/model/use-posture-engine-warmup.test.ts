import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePostureEngineStore } from '@/entities/posture'
import * as bridge from '../lib/tauri-posture-engine'
import {
  resetPostureEngineWarmupForTest,
  usePostureEngineWarmup,
} from './use-posture-engine-warmup'

describe('usePostureEngineWarmup', () => {
  beforeEach(() => {
    usePostureEngineStore.getState().reset()
    resetPostureEngineWarmupForTest()
    vi.restoreAllMocks()
  })

  it('enabled이고 idle이면 sidecar를 한 번만 warmup한다', async () => {
    vi.spyOn(bridge, 'isTauriRuntimeAvailable').mockReturnValue(true)
    const warmup = vi.spyOn(bridge, 'warmupPostureEngine').mockResolvedValue({
      engineStatus: 'ready',
      message: null,
    })

    const { rerender } = renderHook(() => usePostureEngineWarmup(true))

    await waitFor(() => {
      expect(warmup).toHaveBeenCalledTimes(1)
    })
    expect(usePostureEngineStore.getState().engineState).toMatchObject({
      engineStatus: 'ready',
      cameraOwner: 'none',
    })

    rerender()

    expect(warmup).toHaveBeenCalledTimes(1)
  })

  it('Tauri 런타임이 아니면 warmup하지 않는다', async () => {
    vi.spyOn(bridge, 'isTauriRuntimeAvailable').mockReturnValue(false)
    const warmup = vi.spyOn(bridge, 'warmupPostureEngine')

    renderHook(() => usePostureEngineWarmup(true))

    await new Promise(resolve => setTimeout(resolve, 0))
    expect(warmup).not.toHaveBeenCalled()
  })
})
