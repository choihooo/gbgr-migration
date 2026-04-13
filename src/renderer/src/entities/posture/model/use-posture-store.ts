import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface PostureState {
  postureClass: 1 | 2 | 3 | 4 | 5 | 6 | 0
  score: number
  setStatus: (postureClass: 1 | 2 | 3 | 4 | 5 | 6 | 0, score?: number) => void
}

/* 자세 상태 저장소 localstorage 동기화 추가 */
export const usePostureStore = create<PostureState>()(
  persist(
    set => ({
      postureClass: 0,
      score: 0,
      setStatus: (postureClass, score = 0) => set({ postureClass, score }),
    }),
    {
      name: 'posture-state-storage', // localStorage 키
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
