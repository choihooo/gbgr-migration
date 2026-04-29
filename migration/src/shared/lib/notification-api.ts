import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification'

interface NotificationPayload {
  title: string
  body: string
}

const isTauriRuntimeAvailable = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export async function requestNotificationPermission(): Promise<boolean> {
  if (isTauriRuntimeAvailable()) {
    let granted = await isPermissionGranted()

    if (!granted) {
      const permission = await requestPermission()
      granted = permission === 'granted'
    }

    return granted
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export async function showNotification({
  title,
  body,
}: NotificationPayload): Promise<boolean> {
  const granted = await requestNotificationPermission()
  if (!granted) return false

  if (isTauriRuntimeAvailable()) {
    sendNotification({ title, body })
    return true
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    new Notification(title, { body })
    return true
  }

  return false
}
