import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePostureEngineStore } from '@/entities/posture'
import { useCameraStore } from '../../model/use-camera-store'
import { MiniRunningPanel } from '../MiniRunningPanel'

vi.mock('@/entities/session', () => ({
  useSessionReportQuery: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
}))

vi.mock('@/entities/dashboard/model/use-dashboard-queries', () => ({
  useLevelQuery: () => ({ data: { data: { current: 0 } } }),
}))

describe('MiniRunningPanel', () => {
  beforeEach(() => {
    localStorage.clear()
    usePostureEngineStore.getState().reset()
    useCameraStore.getState().resetCameraLifecycle()
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(
      undefined,
    )
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(
      () => {},
    )
  })

  it('show 의도여도 카메라 런타임이 준비 전이면 캐릭터 영상을 재생하지 않는다', () => {
    useCameraStore.getState().setShow()
    useCameraStore.getState().setCameraRuntime({
      runtime: 'starting',
      streamUrl: null,
      errorCode: null,
    })

    const { container } = render(<MiniRunningPanel />)

    expect(container.querySelectorAll('video')).toHaveLength(1)
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled()
  })

  it('show 의도와 ready 런타임 및 streamUrl이 모두 있을 때만 캐릭터 영상을 재생한다', () => {
    useCameraStore.getState().setShow()
    useCameraStore.getState().setCameraRuntime({
      runtime: 'ready',
      streamUrl: 'http://127.0.0.1:49152/video?token=test-token',
      errorCode: null,
    })

    const { container } = render(<MiniRunningPanel />)

    expect(container.querySelectorAll('video')).toHaveLength(2)
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled()
  })
})
