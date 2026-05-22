import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type Webcam from 'react-webcam'
import type {
  EngineMode,
  MeasurementSession,
  PoseLandmark,
  StartPostureEngineResponse,
} from '@/entities/posture'
import { usePostureEngineStore } from '@/entities/posture'
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
    markHydratedFromCache,
  } = usePostureEngineStore()
  const startedRef = useRef(false)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)

  const stopStartedEngine = useCallback(() => {
    if (!startedRef.current) return

    void stopPostureEngine()
    startedRef.current = false
    setStreamUrl(null)
  }, [])

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
    if (!active || startedRef.current) return

    let cancelled = false

    void (async () => {
      let response: StartPostureEngineResponse
      try {
        response = await startPostureEngine()
      } catch (err) {
        console.error('[posture-engine] startPostureEngine 실패:', err)
        return
      }
      if (cancelled) {
        void stopPostureEngine()
        return
      }

      startedRef.current = true
      setEngineState({
        engineStatus: response.engineStatus,
        mode: response.mode,
        cameraOwner: 'python',
        updatedAt: new Date().toISOString(),
        message: null,
        recoverable: true,
      })
      setStreamUrl(response.streamUrl)

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
  }, [active, runtimeAvailable, setEngineState, setSession, stopStartedEngine])

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
  }
}
