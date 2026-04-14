import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { AUTH_STORAGE_KEYS } from '@/shared/lib/auth'

interface AuthEmailState {
  email: string
  setEmail: (email: string) => void
  clearEmail: () => void
}

export const useAuthEmailStore = create<AuthEmailState>()(
  persist(
    set => ({
      email: '',
      setEmail: email => set({ email }),
      clearEmail: () => set({ email: '' }),
    }),
    {
      name: AUTH_STORAGE_KEYS.signupEmail,
      storage: createJSONStorage(() => window.localStorage),
    },
  ),
)
