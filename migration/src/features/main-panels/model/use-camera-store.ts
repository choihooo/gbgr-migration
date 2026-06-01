import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  type CameraLifecycle,
  type CameraLifecycleErrorCode,
  type CameraRuntimeStatus,
  type CameraState,
  createCameraLifecycle,
  isCameraLifecycleHidden,
  isCameraLifecycleLive,
  isCameraLifecyclePreparing,
  type WidgetState,
} from './types'

interface CameraStore {
  cameraState: CameraState
  cameraLifecycle: CameraLifecycle
  widgetState: WidgetState
  setCameraState: (state: CameraState) => void
  setCameraRuntime: (state: {
    runtime: CameraRuntimeStatus
    streamUrl?: string | null
    errorCode?: CameraLifecycleErrorCode | null
  }) => void
  resetCameraLifecycle: () => void
  setWidgetState: (state: WidgetState) => void
  toggleCamera: () => void
  toggleWidget: () => void
  setShow: () => void
  setHide: () => void
  setExit: () => void
  isCameraLive: () => boolean
  isCameraPreparing: () => boolean
  isCameraHidden: () => boolean
}

export const useCameraStore = create<CameraStore>()(
  persist(
    (set, get) => ({
      cameraState: 'exit',
      cameraLifecycle: createCameraLifecycle('exit'),
      widgetState: 'hide',
      setCameraState: cameraState =>
        set(state => ({
          cameraState,
          cameraLifecycle: {
            ...state.cameraLifecycle,
            intent: cameraState,
            runtime:
              cameraState === 'show' ? state.cameraLifecycle.runtime : 'idle',
            streamUrl:
              cameraState === 'show' ? state.cameraLifecycle.streamUrl : null,
            errorCode:
              cameraState === 'show' ? state.cameraLifecycle.errorCode : null,
            updatedAt: new Date().toISOString(),
          },
        })),
      setCameraRuntime: ({ runtime, streamUrl, errorCode }) =>
        set(state => ({
          cameraLifecycle: {
            ...state.cameraLifecycle,
            runtime,
            streamUrl: runtime === 'ready' ? (streamUrl ?? null) : null,
            errorCode:
              runtime === 'error' ? (errorCode ?? 'camera_unknown') : null,
            updatedAt: new Date().toISOString(),
          },
        })),
      resetCameraLifecycle: () =>
        set({
          cameraState: 'exit',
          cameraLifecycle: createCameraLifecycle('exit'),
        }),
      setWidgetState: widgetState => set({ widgetState }),
      toggleCamera: () =>
        set(state => ({
          cameraState: state.cameraState === 'show' ? 'hide' : 'show',
          cameraLifecycle: {
            ...state.cameraLifecycle,
            intent: state.cameraState === 'show' ? 'hide' : 'show',
            runtime: state.cameraState === 'show' ? 'idle' : 'idle',
            streamUrl: null,
            errorCode: null,
            updatedAt: new Date().toISOString(),
          },
        })),
      toggleWidget: () =>
        set(state => ({
          widgetState: state.widgetState === 'show' ? 'hide' : 'show',
        })),
      setShow: () =>
        set(state => ({
          cameraState: 'show',
          cameraLifecycle: {
            ...state.cameraLifecycle,
            intent: 'show',
            updatedAt: new Date().toISOString(),
          },
        })),
      setHide: () =>
        set(state => ({
          cameraState: 'hide',
          cameraLifecycle: {
            ...state.cameraLifecycle,
            intent: 'hide',
            runtime: 'idle',
            streamUrl: null,
            errorCode: null,
            updatedAt: new Date().toISOString(),
          },
        })),
      setExit: () =>
        set(state => ({
          cameraState: 'exit',
          cameraLifecycle: {
            ...state.cameraLifecycle,
            intent: 'exit',
            runtime: 'idle',
            streamUrl: null,
            errorCode: null,
            updatedAt: new Date().toISOString(),
          },
        })),
      isCameraLive: () => isCameraLifecycleLive(get().cameraLifecycle),
      isCameraPreparing: () =>
        isCameraLifecyclePreparing(get().cameraLifecycle),
      isCameraHidden: () => isCameraLifecycleHidden(get().cameraLifecycle),
    }),
    {
      name: 'camera-store',
      storage: createJSONStorage(() => window.localStorage),
      partialize: state => ({
        cameraState: state.cameraState,
        widgetState: state.widgetState,
      }),
      onRehydrateStorage: () => state => {
        if (!state) return
        state.cameraLifecycle = createCameraLifecycle(state.cameraState)
      },
    },
  ),
)
