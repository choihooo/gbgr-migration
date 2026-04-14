import { act } from '@testing-library/react'
import { useCameraStore } from '../use-camera-store'

describe('useCameraStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useCameraStore.setState({
      cameraState: 'exit',
      widgetState: 'hide',
    })
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
})
