import { openUrl } from '@tauri-apps/plugin-opener'
import { isTauriRuntimeAvailable } from './tauri-posture-engine'

const MACOS_CAMERA_SETTINGS_URL =
  'x-apple.systempreferences:com.apple.preference.security?Privacy_Camera'

export async function openCameraPrivacySettings() {
  if (!isTauriRuntimeAvailable()) return

  await openUrl(MACOS_CAMERA_SETTINGS_URL)
}
