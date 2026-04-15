import { useEffect, useMemo, useRef } from 'react'
import type Webcam from 'react-webcam'
import type {
  EngineMode,
  MeasurementSession,
  PoseLandmark,
} from '@/entities/posture'
import { usePostureEngineStore } from '@/entities/posture'
import {
  getLatestPostureState,
  pushPostureFrame,
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
}: UsePostureEngineOptions) => {
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
    let isMounted = true
    const unlisteners: Array<() => void> = []

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
        unlistenResult()
        unlistenStatus()
        unlistenWarning()
        return
      }

      unlisteners.push(unlistenResult, unlistenStatus, unlistenWarning)
    })()

    return () => {
      isMounted = false
      for (const unlisten of unlisteners) {
        unlisten()
      }
    }
  }, [setEngineState, setLatestResult, setWarning])

  useEffect(() => {
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
    setEngineState,
    setLatestResult,
    setRestoredResult,
    setSession,
  ])

  useEffect(() => {
    if (!active || startedRef.current) return

    let cancelled = false

    void (async () => {
      const response = await startPostureEngine()
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
    })()

    return () => {
      cancelled = true
    }
  }, [active, setEngineState, setSession])

  useEffect(() => {
    if (!active || !startedRef.current) return

    const currentSessionId =
      session?.sessionId ?? localStorage.getItem('sessionId') ?? 'local-session'

    void (async () => {
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
  }, [active, mode, session?.sessionId, setEngineState, setSession])

  useEffect(() => {
    if (!active || mode !== 'foreground' || !webcamRef?.current) return

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
  }, [active, mode, session?.sessionId, webcamRef])

  useEffect(() => {
    if (active) return
    if (!startedRef.current) return

    void stopPostureEngine()
    startedRef.current = false
  }, [active])

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
    session,
    latestResult,
    restoredResult,
    overlayLandmarks,
    engineState,
    warning,
  }
}
