import { create } from 'zustand'

export interface AuthUserProfile {
  id: string | null
  name: string | null
}

interface AuthUserState extends AuthUserProfile {
  setUser: (user: AuthUserProfile) => void
  clearUser: () => void
}

export const useAuthUserStore = create<AuthUserState>(set => ({
  id: null,
  name: null,
  setUser: user => set(user),
  clearUser: () => set({ id: null, name: null }),
}))
