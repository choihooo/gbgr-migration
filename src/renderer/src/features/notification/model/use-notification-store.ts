import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface NotificationSettings {
  isAllow: boolean
  stretching: {
    isEnabled: boolean
    interval: number // 분 단위
  }
  turtleNeck: {
    isEnabled: boolean
    interval: number // 분 단위
  }
}

interface NotificationStore extends NotificationSettings {
  setIsAllow: (isAllow: boolean) => void
  setStretchingEnabled: (isEnabled: boolean) => void
  setStretchingInterval: (interval: number) => void
  setTurtleNeckEnabled: (isEnabled: boolean) => void
  setTurtleNeckInterval: (interval: number) => void
  setSettings: (settings: NotificationSettings) => void
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    set => ({
      isAllow: false,
      stretching: {
        isEnabled: false,
        interval: 30,
      },
      turtleNeck: {
        isEnabled: false,
        interval: 10,
      },

      setIsAllow: isAllow => set({ isAllow }),

      setStretchingEnabled: isEnabled =>
        set(state => ({
          stretching: { ...state.stretching, isEnabled },
        })),

      setStretchingInterval: interval =>
        set(state => ({
          stretching: { ...state.stretching, interval },
        })),

      setTurtleNeckEnabled: isEnabled =>
        set(state => ({
          turtleNeck: { ...state.turtleNeck, isEnabled },
        })),

      setTurtleNeckInterval: interval =>
        set(state => ({
          turtleNeck: { ...state.turtleNeck, interval },
        })),

      setSettings: settings => set(settings),
    }),
    {
      name: 'notification-settings-storage',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
