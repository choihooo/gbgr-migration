const AUTH_VERIFY_CALLBACK_PATH = '/auth/verify-callback'
const TAURI_AUTH_VERIFY_CALLBACK_URL = 'gbgr://auth/verify-callback'

export function buildAuthVerifyCallbackUrl() {
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    return TAURI_AUTH_VERIFY_CALLBACK_URL
  }

  return `${window.location.origin}${AUTH_VERIFY_CALLBACK_PATH}`
}
