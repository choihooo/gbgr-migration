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

interface UpdateConfigPayload {
  endpoints: string[]
  pubkey: string
}

const isTauriRuntimeAvailable = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

const parseUpdaterEndpoints = () =>
  (import.meta.env.VITE_UPDATER_ENDPOINTS ?? '')
    .split(/[\n,]/)
    .map((endpoint: string) => endpoint.trim())
    .filter(Boolean)

const getUpdaterConfig = (): UpdateConfigPayload | null => {
  const endpoints = parseUpdaterEndpoints()
  const pubkey = (import.meta.env.VITE_UPDATER_PUBLIC_KEY ?? '').trim()

  if (endpoints.length === 0 || !pubkey) {
    return null
  }

  return {
    endpoints,
    pubkey,
  }
}

export async function fetchUpdate() {
  if (!isTauriRuntimeAvailable()) {
    return {
      configured: false,
      update: null,
    } satisfies FetchUpdateResponse
  }

  const config = getUpdaterConfig()
  if (!config) {
    return {
      configured: false,
      update: null,
    } satisfies FetchUpdateResponse
  }

  return invoke<FetchUpdateResponse>('fetch_update', { config })
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

  const config = getUpdaterConfig()
  if (!config) {
    return {
      configured: false,
      installed: false,
      shouldRestart: false,
      exitsOnInstall: false,
    } satisfies InstallUpdateResponse
  }

  return invoke<InstallUpdateResponse>('install_update', { config })
}
