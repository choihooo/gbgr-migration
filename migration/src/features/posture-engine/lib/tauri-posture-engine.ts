import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import type {
  BackgroundMeasurementResponse,
  CalibrateFinishResponse,
  CalibrateFramePayload,
  CalibrateFrameResponse,
  CalibrateStartResponse,
  EngineStateEvent,
  LatestPostureStateResponse,
  PostureEngineResult,
  PostureWarningEvent,
  PushPostureFramePayload,
  PushPostureFrameResponse,
  SetCalibrationPayload,
  SetCalibrationResponse,
  StartBackgroundMeasurementPayload,
  StartPostureEngineResponse,
  StopBackgroundMeasurementPayload,
  StopPostureEngineResponse,
} from '@/entities/posture'
import { createEmptyEngineState } from '@/entities/posture'

export const POSTURE_RESULT_EVENT = 'posture://result'
export const POSTURE_ENGINE_STATUS_EVENT = 'posture://engine-status'
export const POSTURE_WARNING_EVENT = 'posture://warning'

export const isTauriRuntimeAvailable = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export async function startPostureEngine() {
  if (!isTauriRuntimeAvailable()) {
    return {
      engineStatus: 'ready',
      sessionId: null,
      mode: 'foreground',
    } satisfies StartPostureEngineResponse
  }

  return invoke<StartPostureEngineResponse>('start_posture_engine')
}

export async function stopPostureEngine() {
  if (!isTauriRuntimeAvailable()) {
    return {
      engineStatus: 'idle',
      releasedOwner: 'none',
    } satisfies StopPostureEngineResponse
  }

  return invoke<StopPostureEngineResponse>('stop_posture_engine')
}

export async function pushPostureFrame(payload: PushPostureFramePayload) {
  if (!isTauriRuntimeAvailable()) {
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
  if (!isTauriRuntimeAvailable()) {
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
  if (!isTauriRuntimeAvailable()) {
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
  if (!isTauriRuntimeAvailable()) {
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
  if (!isTauriRuntimeAvailable()) {
    return (() => {}) satisfies UnlistenFn
  }

  const unlisten = await listen<T>(event, eventPayload => {
    handler(eventPayload.payload)
  })

  let disposed = false

  return (() => {
    if (disposed) return
    disposed = true

    void Promise.resolve(unlisten()).catch(error => {
      console.warn(`[posture-engine] ${event} 이벤트 해제 실패:`, error)
    })
  }) satisfies UnlistenFn
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

// ── 캘리브레이션 API ────────────────────────────────────

export async function calibrateStart(): Promise<CalibrateStartResponse> {
  if (!isTauriRuntimeAvailable()) {
    return { status: 'calibrating' }
  }
  return invoke<CalibrateStartResponse>('calibrate_start')
}

export async function calibrateFrame(
  payload: CalibrateFramePayload,
): Promise<CalibrateFrameResponse> {
  if (!isTauriRuntimeAvailable()) {
    return {
      status: 'no_detection',
      frameCount: 0,
      step1Error: null,
      step2Error: null,
    }
  }
  return invoke<CalibrateFrameResponse>('calibrate_frame', { payload })
}

export async function calibrateFinish(): Promise<CalibrateFinishResponse> {
  if (!isTauriRuntimeAvailable()) {
    return {
      status: 'completed',
      success: false,
      muPi: null,
      sigmaPi: null,
      quality: null,
      nTotal: null,
      nPass: null,
      passRate: null,
      message: 'Tauri runtime unavailable',
    }
  }
  return invoke<CalibrateFinishResponse>('calibrate_finish')
}

export async function setCalibration(
  payload: SetCalibrationPayload,
): Promise<SetCalibrationResponse> {
  if (!isTauriRuntimeAvailable()) {
    return { status: 'calibration_set', mu: payload.mu, sigma: payload.sigma }
  }
  return invoke<SetCalibrationResponse>('set_calibration', { payload })
}
