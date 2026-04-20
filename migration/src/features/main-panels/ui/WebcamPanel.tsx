import { useState } from 'react'
import { useLevelQuery } from '@/entities/dashboard/model/use-dashboard-queries'
import {
  useCreateSessionMutation,
  usePauseSessionMutation,
  useResumeSessionMutation,
  useStopSessionMutation,
} from '@/entities/session/model/use-session-mutations'
import { useWindowVisibilitySync } from '@/features/posture-engine'
import WebcamView from '@/pages/calibration-page/components/WebcamView'
import { Button } from '@/shared/ui/button'
import { HideIcon, ShowIcon, WidgetIcon } from '@/shared/ui/icons/ui-icons'
import { useWidget } from '@/shared/hooks/use-widget'
import { useCameraStore } from '../model/use-camera-store'

export function WebcamPanel() {
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
          setCameraState('show')
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
      <div className="relative aspect-video max-h-[198px] max-w-[352px]">
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
              ? '세션 생성 중...'
              : stopSession.isPending
                ? '세션 종료 중...'
                : isExit
                  ? '시작하기'
                  : '종료하기'
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
              위젯
            </div>
          }
        />
      </div>
    </div>
  )
}
