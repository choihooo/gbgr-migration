import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CameraState, WidgetState } from './types'

interface CameraStore {
  cameraState: CameraState
  widgetState: WidgetState
  setCameraState: (state: CameraState) => void
  setWidgetState: (state: WidgetState) => void
  toggleCamera: () => void
  toggleWidget: () => void
  setShow: () => void
  setHide: () => void
  setExit: () => void
}

export const useCameraStore = create<CameraStore>()(
  persist(
    set => ({
      cameraState: 'exit',
      widgetState: 'hide',
      setCameraState: cameraState => set({ cameraState }),
      setWidgetState: widgetState => set({ widgetState }),
      toggleCamera: () =>
        set(state => ({
          cameraState: state.cameraState === 'show' ? 'hide' : 'show',
        })),
      toggleWidget: () =>
        set(state => ({
          widgetState: state.widgetState === 'show' ? 'hide' : 'show',
        })),
      setShow: () => set({ cameraState: 'show' }),
      setHide: () => set({ cameraState: 'hide' }),
      setExit: () => set({ cameraState: 'exit' }),
    }),
    {
      name: 'camera-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
