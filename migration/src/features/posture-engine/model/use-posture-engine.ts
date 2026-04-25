import { useEffect, useMemo, useRef } from 'react'
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
  pushPostureFrame,
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

const captureVideoFrame = (video: HTMLVideoElement) => {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const context = canvas.getContext('2d')
  if (!context) return null
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  return {
    imagePayload: canvas.toDataURL('image/jpeg', 0.7),
    frameSize: {
      width: canvas.width,
      height: canvas.height,
    },
  }
}

export const usePostureEngine = ({
  active,
  mode = 'foreground',
  webcamRef,
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
      if (cancelled) return

      startedRef.current = true
      setEngineState({
        engineStatus: response.engineStatus,
        mode: response.mode,
        cameraOwner: response.mode === 'foreground' ? 'react' : 'python',
        updatedAt: new Date().toISOString(),
        message: null,
        recoverable: true,
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
    }
  }, [active, runtimeAvailable, setEngineState, setSession])

  useEffect(() => {
    if (!runtimeAvailable) return
    if (!active || !startedRef.current) return

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
        return
      }

      const response = await stopBackgroundMeasurement({
        sessionId: currentSessionId,
      })
      setEngineState({
        engineStatus: response.engineStatus,
        mode: response.mode,
        cameraOwner: 'react',
        updatedAt: new Date().toISOString(),
        message: null,
        recoverable: true,
      })
      setSession(buildFallbackSession(currentSessionId, response.mode))
    })()
  }, [
    active,
    mode,
    runtimeAvailable,
    session?.sessionId,
    setEngineState,
    setSession,
  ])

  useEffect(() => {
    if (!runtimeAvailable) return
    if (
      !active ||
      disableFramePush ||
      mode !== 'foreground' ||
      !webcamRef?.current
    ) {
      return
    }

    const interval = window.setInterval(() => {
      const video = webcamRef.current?.video
      const currentSessionId =
        session?.sessionId ?? localStorage.getItem('sessionId')

      if (!video || !currentSessionId || video.readyState < 2) {
        return
      }

      const frame = captureVideoFrame(video)
      if (!frame) return

      void pushPostureFrame({
        sessionId: currentSessionId,
        imagePayload: frame.imagePayload,
        capturedAt: new Date().toISOString(),
        frameSize: frame.frameSize,
      })
    }, 120)

    return () => {
      window.clearInterval(interval)
    }
  }, [
    active,
    disableFramePush,
    mode,
    runtimeAvailable,
    session?.sessionId,
    webcamRef,
  ])

  useEffect(() => {
    if (!runtimeAvailable) return
    if (active) return
    if (!startedRef.current) return

    void stopPostureEngine()
    startedRef.current = false
  }, [active, runtimeAvailable])

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
  }
}
