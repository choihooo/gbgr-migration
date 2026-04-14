import { create } from 'zustand'

export type AuthSessionStatus = 'checking' | 'authenticated' | 'unauthenticated'

export interface AuthSessionState {
  status: AuthSessionStatus
  accessToken: string | null
  refreshToken: string | null
  userId: string | null
  userName: string | null
  redirectPath: string | null
  lastErrorCode: string | null
  hydratedAt: number | null
  setSession: (
    session: Partial<
      Omit<
        AuthSessionState,
        | 'setSession'
        | 'markChecking'
        | 'markUnauthenticated'
        | 'setRedirectPath'
      >
    >,
  ) => void
  markChecking: () => void
  markUnauthenticated: (errorCode?: string | null) => void
  setRedirectPath: (path: string | null) => void
  clearRedirectPath: () => void
}

const initialState = {
  status: 'checking' as const,
  accessToken: null,
  refreshToken: null,
  userId: null,
  userName: null,
  redirectPath: null,
  lastErrorCode: null,
  hydratedAt: null,
}

export const useAuthSessionStore = create<AuthSessionState>(set => ({
  ...initialState,
  setSession: session =>
    set(previous => ({
      ...previous,
      ...session,
    })),
  markChecking: () =>
    set(previous => ({
      ...previous,
      status: 'checking',
      lastErrorCode: null,
    })),
  markUnauthenticated: errorCode =>
    set(previous => ({
      ...previous,
      ...initialState,
      status: 'unauthenticated',
      redirectPath: previous.redirectPath,
      lastErrorCode: errorCode ?? null,
      hydratedAt: Date.now(),
    })),
  setRedirectPath: path => set({ redirectPath: path }),
  clearRedirectPath: () => set({ redirectPath: null }),
}))
