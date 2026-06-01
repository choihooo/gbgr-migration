import { act } from '@testing-library/react'
import { useCameraStore } from '../use-camera-store'

describe('useCameraStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useCameraStore.getState().resetCameraLifecycle()
    useCameraStore.setState({ widgetState: 'hide' })
  })

  it('카메라 상태 전환을 순서대로 처리한다', () => {
    expect(useCameraStore.getState().cameraState).toBe('exit')

    act(() => useCameraStore.getState().setCameraState('show'))
    expect(useCameraStore.getState().cameraState).toBe('show')

    act(() => useCameraStore.getState().toggleCamera())
    expect(useCameraStore.getState().cameraState).toBe('hide')

    act(() => useCameraStore.getState().toggleCamera())
    expect(useCameraStore.getState().cameraState).toBe('show')

    act(() => useCameraStore.getState().setCameraState('exit'))
    expect(useCameraStore.getState().cameraState).toBe('exit')
  })

  it('위젯 상태를 토글하고 persist 한다', () => {
    act(() => useCameraStore.getState().toggleWidget())
    expect(useCameraStore.getState().widgetState).toBe('show')

    const persisted = localStorage.getItem('camera-store')
    expect(persisted).toContain('"widgetState":"show"')
  })

  it('카메라 생명주기를 사용자 의도와 런타임 상태로 분리한다', () => {
    expect(useCameraStore.getState().cameraLifecycle).toMatchObject({
      intent: 'exit',
      runtime: 'idle',
      streamUrl: null,
      errorCode: null,
    })

    act(() => useCameraStore.getState().setShow())
    expect(useCameraStore.getState().cameraLifecycle).toMatchObject({
      intent: 'show',
      runtime: 'idle',
    })

    act(() =>
      useCameraStore.getState().setCameraRuntime({
        runtime: 'starting',
        streamUrl: null,
        errorCode: null,
      }),
    )
    expect(useCameraStore.getState().cameraLifecycle.runtime).toBe('starting')

    act(() =>
      useCameraStore.getState().setCameraRuntime({
        runtime: 'ready',
        streamUrl: 'http://127.0.0.1:49152/video?token=test-token',
      }),
    )
    expect(useCameraStore.getState().isCameraLive()).toBe(true)

    act(() => useCameraStore.getState().setHide())
    expect(useCameraStore.getState().cameraLifecycle).toMatchObject({
      intent: 'hide',
      runtime: 'idle',
      streamUrl: null,
      errorCode: null,
    })
    expect(useCameraStore.getState().isCameraLive()).toBe(false)
  })

  it('런타임 streamUrl과 토큰을 persist 하지 않는다', () => {
    act(() => {
      useCameraStore.getState().setShow()
      useCameraStore.getState().setCameraRuntime({
        runtime: 'ready',
        streamUrl: 'http://127.0.0.1:49152/video?token=secret-token',
      })
    })

    const persisted = localStorage.getItem('camera-store')

    expect(persisted).toContain('"cameraState":"show"')
    expect(persisted).not.toContain('streamUrl')
    expect(persisted).not.toContain('secret-token')
  })
})
