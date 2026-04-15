import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import type {
  BackgroundMeasurementResponse,
  EngineStateEvent,
  LatestPostureStateResponse,
  PostureEngineResult,
  PostureWarningEvent,
  PushPostureFramePayload,
  PushPostureFrameResponse,
  StartBackgroundMeasurementPayload,
  StartPostureEngineResponse,
  StopBackgroundMeasurementPayload,
  StopPostureEngineResponse,
} from '@/entities/posture'
import { createEmptyEngineState } from '@/entities/posture'

export const POSTURE_RESULT_EVENT = 'posture://result'
export const POSTURE_ENGINE_STATUS_EVENT = 'posture://engine-status'
export const POSTURE_WARNING_EVENT = 'posture://warning'

const isTauriRuntime = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export async function startPostureEngine() {
  if (!isTauriRuntime()) {
    return {
      engineStatus: 'ready',
      sessionId: null,
      mode: 'foreground',
    } satisfies StartPostureEngineResponse
  }

  return invoke<StartPostureEngineResponse>('start_posture_engine')
}

export async function stopPostureEngine() {
  if (!isTauriRuntime()) {
    return {
      engineStatus: 'idle',
      releasedOwner: 'none',
    } satisfies StopPostureEngineResponse
  }

  return invoke<StopPostureEngineResponse>('stop_posture_engine')
}

export async function pushPostureFrame(payload: PushPostureFramePayload) {
  if (!isTauriRuntime()) {
    return {
      accepted: false,
      reason: 'tauri_runtime_unavailable',
    } satisfies PushPostureFrameResponse
  }

  return invoke<PushPostureFrameResponse>('push_posture_frame', { payload })
}

export async function startBackgroundMeasurement(
  payload: StartBackgroundMeasurementPayload,
) {
  if (!isTauriRuntime()) {
    return {
      engineStatus: 'switching',
      mode: 'background',
    } satisfies BackgroundMeasurementResponse
  }

  return invoke<BackgroundMeasurementResponse>('start_background_measurement', {
    payload,
  })
}

export async function stopBackgroundMeasurement(
  payload: StopBackgroundMeasurementPayload,
) {
  if (!isTauriRuntime()) {
    return {
      engineStatus: 'ready',
      mode: 'foreground',
    } satisfies BackgroundMeasurementResponse
  }

  return invoke<BackgroundMeasurementResponse>('stop_background_measurement', {
    payload,
  })
}

export async function getLatestPostureState() {
  if (!isTauriRuntime()) {
    return {
      session: null,
      latestResult: null,
      engineState: createEmptyEngineState(),
    } satisfies LatestPostureStateResponse
  }

  return invoke<LatestPostureStateResponse>('get_latest_posture_state')
}

const listenWhenAvailable = async <T>(
  event: string,
  handler: (payload: T) => void,
) => {
  if (!isTauriRuntime()) {
    return (() => {}) satisfies UnlistenFn
  }

  return listen<T>(event, eventPayload => {
    handler(eventPayload.payload)
  })
}

export const subscribeToPostureResults = (
  handler: (payload: PostureEngineResult) => void,
) => listenWhenAvailable<PostureEngineResult>(POSTURE_RESULT_EVENT, handler)

export const subscribeToPostureEngineStatus = (
  handler: (payload: EngineStateEvent) => void,
) => listenWhenAvailable<EngineStateEvent>(POSTURE_ENGINE_STATUS_EVENT, handler)

export const subscribeToPostureWarnings = (
  handler: (payload: PostureWarningEvent) => void,
) => listenWhenAvailable<PostureWarningEvent>(POSTURE_WARNING_EVENT, handler)
