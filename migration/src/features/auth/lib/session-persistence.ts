import { AUTH_STORAGE_KEYS } from '@/shared/lib/auth'

export interface StoredAuthSession {
  accessToken: string | null
  refreshToken: string | null
  userId: string | null
  userName: string | null
  redirectPath: string | null
}

export function readStoredAuthSession(): StoredAuthSession {
  return {
    accessToken: localStorage.getItem(AUTH_STORAGE_KEYS.accessToken),
    refreshToken: localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken),
    userId: localStorage.getItem(AUTH_STORAGE_KEYS.userId),
    userName: localStorage.getItem(AUTH_STORAGE_KEYS.userName),
    redirectPath: localStorage.getItem(AUTH_STORAGE_KEYS.redirectPath),
  }
}

export function persistAuthSession(session: {
  accessToken: string
  refreshToken: string
  userId: string
  userName: string
}) {
  localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, session.accessToken)
  localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, session.refreshToken)
  localStorage.setItem(AUTH_STORAGE_KEYS.userId, session.userId)
  localStorage.setItem(AUTH_STORAGE_KEYS.userName, session.userName)
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken)
  localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken)
  localStorage.removeItem(AUTH_STORAGE_KEYS.userId)
  localStorage.removeItem(AUTH_STORAGE_KEYS.userName)
}

export function persistRedirectPath(path: string) {
  localStorage.setItem(AUTH_STORAGE_KEYS.redirectPath, path)
}

export function clearRedirectPath() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.redirectPath)
}

export function readSavedEmail() {
  return localStorage.getItem(AUTH_STORAGE_KEYS.savedEmail)
}

export function persistSavedEmail(email: string) {
  localStorage.setItem(AUTH_STORAGE_KEYS.savedEmail, email)
}

export function clearSavedEmail() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.savedEmail)
}
