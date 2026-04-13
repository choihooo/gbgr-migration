import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface EmailState {
  email: string
  setEmail: (email: string) => void
}

export const useEmailStore = create<EmailState>()(
  persist(
    set => ({
      email: '',
      setEmail: email => set({ email }),
    }),
    {
      name: 'email',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
