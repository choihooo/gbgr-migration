import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLevelQuery } from '@/entities/dashboard/model/use-dashboard-queries'
import {
  useCreateSessionMutation,
  usePauseSessionMutation,
  useResumeSessionMutation,
  useStopSessionMutation,
} from '@/entities/session/model/use-session-mutations'
import { useWindowVisibilitySync } from '@/features/posture-engine'
import { useAutoMetricsSender } from '@/features/posture-engine/model/use-auto-metrics-sender'
import { useMetricsCollector } from '@/features/posture-engine/model/use-metrics-collector'
import { useSessionCleanup } from '@/features/posture-engine/model/use-session-cleanup'
import WebcamView from '@/pages/calibration-page/components/WebcamView'
import { useWidget } from '@/shared/hooks/use-widget'
import { Button } from '@/shared/ui/button'
import { HideIcon, ShowIcon, WidgetIcon } from '@/shared/ui/icons/ui-icons'
import { useCameraStore } from '../model/use-camera-store'

export function WebcamPanel() {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'foreground' | 'background'>('foreground')
  const { cameraState, setCameraState } = useCameraStore()
  const { toggleWidget } = useWidget()
  const isWebcamOn = cameraState === 'show'
  const isExit = cameraState === 'exit'
  const currentSessionId =
    typeof window !== 'undefined' ? localStorage.getItem('sessionId') : null

  const { data: levelData } = useLevelQuery()
  const createSession = useCreateSessionMutation()
  const stopSession = useStopSessionMutation()
  const pauseSession = usePauseSessionMutation()
  const resumeSession = useResumeSessionMutation()

  useWindowVisibilitySync(setMode)

  const { flushMetrics } = useMetricsCollector()
  useAutoMetricsSender(flushMetrics)
  useSessionCleanup(flushMetrics)

  const handleStartStop = () => {
    if (isExit) {
      createSession.mutate(undefined, {
        onSuccess: () => {
          localStorage.setItem(
            'sessionStartDistance',
            String(levelData?.data.current ?? 0),
          )
          setCameraState('show')
        },
        onError: () => {
          setCameraState('exit')
        },
      })
      return
    }

    if (!currentSessionId) {
      setCameraState('exit')
      return
    }

    stopSession.mutate(currentSessionId, {
      onSettled: () => {
        flushMetrics()
        setCameraState('exit')
      },
    })
  }

  const handleToggleCamera = () => {
    if (isExit) return

    if (isWebcamOn && currentSessionId) {
      pauseSession.mutate(currentSessionId, {
        onSettled: () => setCameraState('hide'),
      })
      return
    }

    if (!isWebcamOn && currentSessionId) {
      resumeSession.mutate(currentSessionId, {
        onSettled: () => setCameraState('show'),
      })
      return
    }

    setCameraState(isWebcamOn ? 'hide' : 'show')
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="relative aspect-video max-h-[198px] w-full max-w-[352px] min-w-0 overflow-hidden">
        <WebcamView isActive={true} mode={mode} />
        <Button
          size="md"
          variant="grey"
          text={
            isWebcamOn ? (
              <HideIcon className="h-[18px] w-[18px]" />
            ) : (
              <ShowIcon className="h-[18px] w-[18px]" />
            )
          }
          onClick={handleToggleCamera}
          disabled={isExit || pauseSession.isPending || resumeSession.isPending}
          className="absolute top-2 right-2 h-[30px] w-[30px] px-0"
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="md"
          variant="primary"
          text={
            createSession.isPending
              ? t('dashboard.webcam.creatingSession')
              : stopSession.isPending
                ? t('dashboard.webcam.stoppingSession')
                : isExit
                  ? t('dashboard.webcam.start')
                  : t('dashboard.webcam.stop')
          }
          className="h-11 w-full max-w-[196px]"
          onClick={handleStartStop}
          disabled={createSession.isPending || stopSession.isPending}
        />
        <Button
          size="md"
          variant="sub"
          onClick={toggleWidget}
          disabled={isExit}
          className="h-11 w-[110px] px-[12px] py-[10px] disabled:pointer-events-none"
          text={
            <div className="text-body-md-medium flex items-center gap-1 text-yellow-500">
              <WidgetIcon className="h-6 w-6" />
              {t('dashboard.webcam.widget')}
            </div>
          }
        />
      </div>
    </div>
  )
}
