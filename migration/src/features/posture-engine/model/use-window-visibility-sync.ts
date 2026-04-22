import { useEffect } from 'react'
import type { EngineMode } from '@/entities/posture'
import { usePostureEngineStore } from '@/entities/posture'

export const resolveEngineModeFromVisibility = (
  isHidden: boolean,
): EngineMode => (isHidden ? 'background' : 'foreground')

export const useWindowVisibilitySync = (
  onModeChange: (mode: EngineMode) => void,
) => {
  const sessionId = usePostureEngineStore(state => state.session?.sessionId)

  useEffect(() => {
    if (!sessionId) return

    const handleVisibilityChange = () => {
      onModeChange(resolveEngineModeFromVisibility(document.hidden))
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [onModeChange, sessionId])
}
