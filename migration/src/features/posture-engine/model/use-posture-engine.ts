import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type Webcam from 'react-webcam'
import type {
  CameraDiagnosticEvent,
  CameraDiagnosticTransition,
  CameraErrorCode,
  EngineMode,
  MeasurementSession,
  PoseLandmark,
  StartPostureEngineResponse,
} from '@/entities/posture'
import { usePostureEngineStore } from '@/entities/posture'
import { useCameraStore } from '@/features/main-panels/model/use-camera-store'
import {
  getLatestPostureState,
  isTauriRuntimeAvailable,
  setCalibration,
  startBackgroundMeasurement,
  startPostureEngine,
  stopBackgroundMeasurement,
  stopPostureEngine,
  subscribeToPostureEngineStatus,
  subscribeToPostureResults,
  subscribeToPostureWarnings,
} from '../lib/tauri-posture-engine'

interface UsePostureEngineOptions {
  active: boolean
  mode?: EngineMode
  webcamRef?: React.RefObject<Webcam | null>
  disableFramePush?: boolean
}

const buildFallbackSession = (
  sessionId: string,
  mode: EngineMode,
): MeasurementSession => ({
  sessionId,
  status: 'running',
  mode,
  startedAt: new Date().toISOString(),
  lastResultAt: null,
  latestResultId: null,
  lastErrorCode: null,
})

const DEFAULT_PREVIEW_READY_TIMEOUT_MS = 5000

const getPreviewReadyTimeoutMs = () => {
  const configured = (
    globalThis as {
      __GBGR_CAMERA_PREVIEW_TIMEOUT_MS__?: number
    }
  ).__GBGR_CAMERA_PREVIEW_TIMEOUT_MS__

  return typeof configured === 'number'
    ? configured
    : DEFAULT_PREVIEW_READY_TIMEOUT_MS
}

const CAMERA_ERROR_CODES = new Set<CameraErrorCode>([
  'camera_permission_denied',
  'camera_unavailable',
  'camera_busy',
  'camera_frame_unavailable',
  'camera_api_unavailable',
  'camera_stream_unauthorized',
  'camera_unknown',
])

const toCameraErrorCode = (error: unknown): CameraErrorCode => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : ''

  return CAMERA_ERROR_CODES.has(message as CameraErrorCode)
    ? (message as CameraErrorCode)
    : 'camera_unknown'
}

const waitForUsableStream = async (
  response: StartPostureEngineResponse,
): Promise<StartPostureEngineResponse> => {
  if (response.streamUrl) return response

  await new Promise(resolve => {
    window.setTimeout(resolve, getPreviewReadyTimeoutMs())
  })

  throw new Error('camera_frame_unavailable')
}

const buildCameraDiagnostic = ({
  errorCode,
  transition,
  durationMs,
}: {
  errorCode: CameraErrorCode | null
  transition: CameraDiagnosticTransition
  durationMs: number | null
}): CameraDiagnosticEvent => ({
  errorCode,
  permissionState:
    errorCode === 'camera_permission_denied' ? 'denied' : 'unknown',
  transition,
  durationMs,
  occurredAt: new Date().toISOString(),
})

export const usePostureEngine = ({
  active,
  mode = 'foreground',
  webcamRef: _webcamRef,
  disableFramePush = false,
}: UsePostureEngineOptions) => {
  const runtimeAvailable = isTauriRuntimeAvailable()
  const {
    engineState,
    latestResult,
    restoredResult,
    session,
    warning,
    setEngineState,
    setLatestResult,
    setRestoredResult,
    setSession,
    setWarning,
    appendCameraDiagnostic,
    markHydratedFromCache,
  } = usePostureEngineStore()
  const setCameraRuntime = useCameraStore(state => state.setCameraRuntime)
  const startedRef = useRef(false)
  const engineStatusRef = useRef(engineState.engineStatus)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [restartToken, setRestartToken] = useState(0)

  useEffect(() => {
    engineStatusRef.current = engineState.engineStatus
  }, [engineState.engineStatus])

  const stopStartedEngine = useCallback(() => {
    setCameraRuntime({
      runtime: 'idle',
      streamUrl: null,
      errorCode: null,
    })
    if (!startedRef.current) return

    void stopPostureEngine()
    startedRef.current = false
    setStreamUrl(null)
    appendCameraDiagnostic(
      buildCameraDiagnostic({
        errorCode: null,
        transition: 'ready->stopped',
        durationMs: null,
      }),
    )
  }, [appendCameraDiagnostic, setCameraRuntime])

  const retryStart = useCallback(() => {
    startedRef.current = false
    setStreamUrl(null)
    setCameraRuntime({
      runtime: 'starting',
      streamUrl: null,
      errorCode: null,
    })
    appendCameraDiagnostic(
      buildCameraDiagnostic({
        errorCode: null,
        transition: 'error->checking',
        durationMs: null,
      }),
    )
    setRestartToken(value => value + 1)
  }, [appendCameraDiagnostic, setCameraRuntime])

  useEffect(() => {
    if (!runtimeAvailable) {
      setEngineState({
        engineStatus: 'idle',
        mode: 'foreground',
        cameraOwner: 'none',
        updatedAt: new Date().toISOString(),
        message: 'tauri_runtime_unavailable',
        recoverable: true,
      })
      setLatestResult(null)
      setRestoredResult(null)
      setSession(null)
      setStreamUrl(null)
      setCameraRuntime({
        runtime: 'idle',
        streamUrl: null,
        errorCode: null,
      })
      markHydratedFromCache()
      return
    }

    let isMounted = true
    const unlisteners: Array<() => void> = []

    const cleanupListeners = () => {
      while (unlisteners.length > 0) {
        const unlisten = unlisteners.pop()
        unlisten?.()
      }
    }

    void (async () => {
      const [unlistenResult, unlistenStatus, unlistenWarning] =
        await Promise.all([
          subscribeToPostureResults(result => {
            setLatestResult(result)
          }),
          subscribeToPostureEngineStatus(state => {
            setEngineState(state)
          }),
          subscribeToPostureWarnings(event => {
            setWarning(event)
          }),
        ])

      if (!isMounted) {
        unlistenWarning()
        unlistenStatus()
        unlistenResult()
        return
      }

      unlisteners.push(unlistenResult, unlistenStatus, unlistenWarning)
    })()

    return () => {
      isMounted = false
      cleanupListeners()
    }
  }, [
    markHydratedFromCache,
    runtimeAvailable,
    setEngineState,
    setLatestResult,
    setRestoredResult,
    setSession,
    setWarning,
    setCameraRuntime,
  ])

  useEffect(() => {
    if (!runtimeAvailable) return

    void (async () => {
      const latestState = await getLatestPostureState()
      setSession(latestState.session)
      setEngineState(latestState.engineState)
      setLatestResult(latestState.latestResult)
      setRestoredResult(latestState.latestResult)
      markHydratedFromCache()
    })()
  }, [
    markHydratedFromCache,
    runtimeAvailable,
    setEngineState,
    setLatestResult,
    setRestoredResult,
    setSession,
  ])

  useEffect(() => {
    if (!runtimeAvailable) return
    // retryStart bumps restartToken so this effect can run again after a
    // recoverable camera-start failure.
    void restartToken
    if (!active || startedRef.current) return

    let cancelled = false

    void (async () => {
      let response: StartPostureEngineResponse
      const startedAt = Date.now()
      setCameraRuntime({
        runtime: 'starting',
        streamUrl: null,
        errorCode: null,
      })
      appendCameraDiagnostic(
        buildCameraDiagnostic({
          errorCode: null,
          transition:
            engineStatusRef.current === 'error'
              ? 'error->checking'
              : 'idle->checking',
          durationMs: null,
        }),
      )
      try {
        response = await waitForUsableStream(await startPostureEngine())
      } catch (err) {
        console.error('[posture-engine] startPostureEngine 실패:', err)
        const errorCode = toCameraErrorCode(err)
        appendCameraDiagnostic(
          buildCameraDiagnostic({
            errorCode,
            transition: 'checking->error',
            durationMs: Date.now() - startedAt,
          }),
        )
        setEngineState({
          engineStatus: 'error',
          mode: 'foreground',
          cameraOwner: 'none',
          updatedAt: new Date().toISOString(),
          message: errorCode,
          recoverable: true,
        })
        setStreamUrl(null)
        setCameraRuntime({
          runtime: 'error',
          streamUrl: null,
          errorCode,
        })
        return
      }
      if (cancelled) {
        setCameraRuntime({
          runtime: 'idle',
          streamUrl: null,
          errorCode: null,
        })
        void stopPostureEngine()
        return
      }

      startedRef.current = true
      appendCameraDiagnostic(
        buildCameraDiagnostic({
          errorCode: null,
          transition: 'checking->ready',
          durationMs: Date.now() - startedAt,
        }),
      )
      setEngineState({
        engineStatus: response.engineStatus,
        mode: response.mode,
        cameraOwner: 'python',
        updatedAt: new Date().toISOString(),
        message: null,
        recoverable: true,
      })
      setStreamUrl(response.streamUrl)
      setCameraRuntime({
        runtime: 'ready',
        streamUrl: response.streamUrl,
        errorCode: null,
      })

      if (response.sessionId) {
        setSession(buildFallbackSession(response.sessionId, response.mode))
      }

      // 캘리브레이션 결과 복원
      try {
        const calibRaw = localStorage.getItem('calibration_result_v1')
        if (calibRaw) {
          const calib = JSON.parse(calibRaw)
          if (calib.mu_PI != null && calib.sigma_PI != null) {
            await setCalibration({ mu: calib.mu_PI, sigma: calib.sigma_PI })
          }
        }
      } catch {
        // 캘리브레이션 복원 실패는 치명적이지 않음
      }
    })()

    return () => {
      cancelled = true
      stopStartedEngine()
    }
  }, [
    active,
    appendCameraDiagnostic,
    restartToken,
    runtimeAvailable,
    setEngineState,
    setSession,
    setCameraRuntime,
    stopStartedEngine,
  ])

  useEffect(() => {
    if (!runtimeAvailable) return
    if (!active || !startedRef.current) return
    if (disableFramePush) return

    const currentSessionId =
      session?.sessionId ?? localStorage.getItem('sessionId') ?? 'local-session'

    void (async () => {
      console.log(
        '[posture-engine] mode change:',
        mode,
        'sessionId:',
        currentSessionId,
      )
      if (mode === 'background') {
        try {
          const response = await startBackgroundMeasurement({
            sessionId: currentSessionId,
            reason: 'manual',
          })
          setEngineState({
            engineStatus: response.engineStatus,
            mode: response.mode,
            cameraOwner: 'python',
            updatedAt: new Date().toISOString(),
            message: null,
            recoverable: true,
          })
          setSession(buildFallbackSession(currentSessionId, response.mode))
        } catch (err) {
          console.error(
            '[posture-engine] startBackgroundMeasurement 실패:',
            err,
          )
          setEngineState({
            engineStatus: 'error',
            mode: 'foreground',
            cameraOwner: 'python',
            updatedAt: new Date().toISOString(),
            message: err instanceof Error ? err.message : String(err),
            recoverable: true,
          })
        }
        return
      }

      if (engineState.mode !== 'background') return

      try {
        const response = await stopBackgroundMeasurement({
          sessionId: currentSessionId,
        })
        setEngineState({
          engineStatus: response.engineStatus,
          mode: response.mode,
          cameraOwner: 'python',
          updatedAt: new Date().toISOString(),
          message: null,
          recoverable: true,
        })
        setSession(buildFallbackSession(currentSessionId, response.mode))
      } catch (err) {
        console.error('[posture-engine] stopBackgroundMeasurement 실패:', err)
      }
    })()
  }, [
    active,
    disableFramePush,
    engineState.mode,
    mode,
    runtimeAvailable,
    session?.sessionId,
    setEngineState,
    setSession,
  ])

  useEffect(() => {
    if (!runtimeAvailable) return
    if (active) return

    stopStartedEngine()
  }, [active, runtimeAvailable, stopStartedEngine])

  const overlayLandmarks = useMemo<PoseLandmark[]>(
    () =>
      latestResult?.engineMode === 'foreground'
        ? latestResult.landmarks
        : (restoredResult?.landmarks ?? []),
    [
      latestResult?.engineMode,
      latestResult?.landmarks,
      restoredResult?.landmarks,
    ],
  )

  return {
    runtimeAvailable,
    session,
    latestResult,
    restoredResult,
    overlayLandmarks,
    engineState,
    warning,
    streamUrl,
    retryStart,
  }
}
