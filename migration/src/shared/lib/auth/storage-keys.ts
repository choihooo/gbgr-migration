export const AUTH_STORAGE_KEYS = {
  accessToken: 'auth.accessToken',
  refreshToken: 'auth.refreshToken',
  userId: 'auth.userId',
  userName: 'auth.userName',
  redirectPath: 'auth.redirectPath',
  signupEmail: 'auth.signupEmail',
  savedEmail: 'savedEmail',
} as const

export type AuthStorageKey =
  (typeof AUTH_STORAGE_KEYS)[keyof typeof AUTH_STORAGE_KEYS]
