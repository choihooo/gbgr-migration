import { create } from 'zustand'

interface AuthEmailState {
  email: string
  setEmail: (email: string) => void
}

export const useAuthEmailStore = create<AuthEmailState>(set => ({
  email: '',
  setEmail: email => set({ email }),
}))
