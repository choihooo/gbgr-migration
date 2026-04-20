import { invoke } from '@tauri-apps/api/core'

export async function openWidget(): Promise<void> {
  await invoke('open_widget_window')
}

export async function closeWidget(): Promise<void> {
  await invoke('close_widget_window')
}

export async function isWidgetOpen(): Promise<boolean> {
  return await invoke('is_widget_open')
}
