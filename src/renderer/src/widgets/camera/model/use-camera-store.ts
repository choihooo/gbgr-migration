import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type CameraState = 'show' | 'hide' | 'exit'

interface CameraStore {
  cameraState: CameraState
  setShow: () => void
  setHide: () => void
  setExit: () => void
}

export const useCameraStore = create<CameraStore>()(
  persist(
    set => ({
      cameraState: 'hide',
      setShow: () => set({ cameraState: 'show' }),
      setHide: () => set({ cameraState: 'hide' }),
      setExit: () => set({ cameraState: 'exit' }),
    }),
    {
      name: 'camera-state-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
