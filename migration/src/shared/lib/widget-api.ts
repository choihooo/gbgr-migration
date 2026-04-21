import { invoke } from '@tauri-apps/api/core'

export async function openWidget(): Promise<void> {
  await invoke('open_widget_window')
}

export async function closeWidget(): Promise<void> {
  await invoke('close_widget_window')
}

export async function isWidgetOpen(): Promise<boolean> {
  return invoke<boolean>('is_widget_open')
}
