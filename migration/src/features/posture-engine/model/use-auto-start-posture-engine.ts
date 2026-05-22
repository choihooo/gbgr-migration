import { useEffect } from 'react'
import type { EngineMode, MeasurementSession } from '@/entities/posture'
import { usePostureEngineStore } from '@/entities/posture'
import {
  getLatestPostureState,
  isTauriRuntimeAvailable,
  setCalibration,
  startPostureEngine,
} from '../lib/tauri-posture-engine'

let autoStartInFlight = false
let autoStartBlocked = false

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

const stopStream = (stream: MediaStream | null) => {
  stream?.getTracks().forEach(track => {
    track.stop()
  })
}

const waitForCameraRelease = () =>
  new Promise(resolve => {
    window.setTimeout(resolve, 100)
  })

async function requestCameraAccess() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('camera_api_unavailable')
  }

  const permissionName = 'camera' as PermissionName
  const permissionStatus = await navigator.permissions
    ?.query({ name: permissionName })
    .catch(() => null)

  if (permissionStatus?.state === 'denied') {
    throw new Error('camera_permission_denied')
  }

  let stream: MediaStream | null = null
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    })
  } finally {
    stopStream(stream)
  }

  await waitForCameraRelease()
}

async function restoreCalibration() {
  const calibRaw = localStorage.getItem('calibration_result_v1')
  if (!calibRaw) return

  const calib = JSON.parse(calibRaw)
  if (calib.mu_PI == null || calib.sigma_PI == null) return

  await setCalibration({ mu: calib.mu_PI, sigma: calib.sigma_PI })
}

export function useAutoStartPostureEngine(enabled: boolean) {
  const engineStatus = usePostureEngineStore(
    state => state.engineState.engineStatus,
  )
  const setEngineState = usePostureEngineStore(state => state.setEngineState)
  const setLatestResult = usePostureEngineStore(state => state.setLatestResult)
  const setRestoredResult = usePostureEngineStore(
    state => state.setRestoredResult,
  )
  const setSession = usePostureEngineStore(state => state.setSession)

  useEffect(() => {
    if (!enabled) return
    if (!isTauriRuntimeAvailable()) return
    if (autoStartInFlight || autoStartBlocked) return
    if (engineStatus !== 'idle') return

    autoStartInFlight = true

    void (async () => {
      try {
        const latestState = await getLatestPostureState()
        setSession(latestState.session)
        setEngineState(latestState.engineState)
        setLatestResult(latestState.latestResult)
        setRestoredResult(latestState.latestResult)

        if (latestState.engineState.engineStatus !== 'idle') return

        await requestCameraAccess()

        const response = await startPostureEngine()
        setEngineState({
          engineStatus: response.engineStatus,
          mode: response.mode,
          cameraOwner: 'python',
          updatedAt: new Date().toISOString(),
          message: null,
          recoverable: true,
        })

        if (response.sessionId) {
          setSession(buildFallbackSession(response.sessionId, response.mode))
        }

        try {
          await restoreCalibration()
        } catch (error) {
          console.warn('[posture-engine] 자동 시작 후 보정 복원 실패:', error)
        }
      } catch (error) {
        autoStartBlocked = true
        console.warn('[posture-engine] 자동 시작 실패:', error)
        setEngineState({
          engineStatus: 'error',
          mode: 'foreground',
          cameraOwner: 'none',
          updatedAt: new Date().toISOString(),
          message: error instanceof Error ? error.message : String(error),
          recoverable: true,
        })
      } finally {
        autoStartInFlight = false
      }
    })()
  }, [
    enabled,
    engineStatus,
    setEngineState,
    setLatestResult,
    setRestoredResult,
    setSession,
  ])
}

export function resetAutoStartPostureEngineForTest() {
  autoStartInFlight = false
  autoStartBlocked = false
}
