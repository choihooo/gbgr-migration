import { useEffect } from 'react'
import { usePostureEngineStore } from '@/entities/posture'
import {
  isTauriRuntimeAvailable,
  warmupPostureEngine,
} from '../lib/tauri-posture-engine'

let warmupInFlight = false
let warmupCompleted = false

export function usePostureEngineWarmup(enabled: boolean) {
  const engineStatus = usePostureEngineStore(
    state => state.engineState.engineStatus,
  )
  const setEngineState = usePostureEngineStore(state => state.setEngineState)

  useEffect(() => {
    if (!enabled) return
    if (!isTauriRuntimeAvailable()) return
    if (warmupInFlight || warmupCompleted) return
    if (engineStatus !== 'idle') return

    warmupInFlight = true

    void warmupPostureEngine()
      .then(response => {
        warmupCompleted = response.engineStatus === 'ready'
        setEngineState({
          engineStatus: response.engineStatus,
          mode: 'foreground',
          cameraOwner: 'none',
          updatedAt: new Date().toISOString(),
          message: response.message,
          recoverable: true,
        })
      })
      .catch(error => {
        setEngineState({
          engineStatus: 'error',
          mode: 'foreground',
          cameraOwner: 'none',
          updatedAt: new Date().toISOString(),
          message: error instanceof Error ? error.message : String(error),
          recoverable: true,
        })
      })
      .finally(() => {
        warmupInFlight = false
      })
  }, [enabled, engineStatus, setEngineState])
}

export function resetPostureEngineWarmupForTest() {
  warmupInFlight = false
  warmupCompleted = false
}
