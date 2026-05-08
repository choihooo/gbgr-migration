import { invoke } from '@tauri-apps/api/core'

export interface UpdateMetadata {
  version: string
  currentVersion: string
}

export interface FetchUpdateResponse {
  configured: boolean
  update: UpdateMetadata | null
}

export interface InstallUpdateResponse {
  configured: boolean
  installed: boolean
  shouldRestart: boolean
  exitsOnInstall: boolean
}

const isTauriRuntimeAvailable = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export async function fetchUpdate() {
  if (!isTauriRuntimeAvailable()) {
    return {
      configured: false,
      update: null,
    } satisfies FetchUpdateResponse
  }

  return invoke<FetchUpdateResponse>('fetch_update')
}

export async function installUpdate() {
  if (!isTauriRuntimeAvailable()) {
    return {
      configured: false,
      installed: false,
      shouldRestart: false,
      exitsOnInstall: false,
    } satisfies InstallUpdateResponse
  }

  return invoke<InstallUpdateResponse>('install_update')
}
