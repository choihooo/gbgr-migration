import { useState } from 'react'
import { useLevelQuery } from '@/entities/dashboard/model/use-dashboard-queries'
import { usePostureEngineStore } from '@/entities/posture'
import {
  useCreateSessionMutation,
  usePauseSessionMutation,
  useResumeSessionMutation,
  useStopSessionMutation,
} from '@/entities/session/model/use-session-mutations'
import { useWindowVisibilitySync } from '@/features/posture-engine'
import WebcamView from '@/pages/calibration-page/components/WebcamView'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { HideIcon, ShowIcon, WidgetIcon } from '@/shared/ui/icons/ui-icons'
import { useCameraStore } from '../model/use-camera-store'

function StatusCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex h-full flex-col justify-between rounded-[24px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.24),_rgba(255,255,255,0.08))] p-6 text-grey-0">
      <div>
        <p className="text-caption-sm-medium text-yellow-100">{title}</p>
        <p className="text-headline-2xl-semibold mt-2 whitespace-pre-line">
          {description}
        </p>
      </div>
      <div className="bg-white/16 h-14 rounded-full" />
    </div>
  )
}

export function WebcamPanel() {
  const [mode, setMode] = useState<'foreground' | 'background'>('foreground')
  const { cameraState, widgetState, setCameraState, toggleWidget } =
    useCameraStore()
  const engineState = usePostureEngineStore(state => state.engineState)
  const latestResult = usePostureEngineStore(state => state.latestResult)
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
    <section className="flex w-full flex-col gap-3">
      <div className="relative aspect-video max-h-[198px] max-w-[352px] overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#4B4A48_0%,#232323_100%)]">
        {cameraState === 'show' ? (
          <>
            <WebcamView isActive={true} mode={mode} />
            <div className="absolute bottom-2 left-2 rounded-full bg-black/40 px-3 py-1 text-[11px] text-white">
              {engineState.engineStatus === 'error'
                ? '엔진 오류'
                : latestResult
                  ? `자세 단계 ${latestResult.postureClass}`
                  : '엔진 준비 중'}
            </div>
          </>
        ) : cameraState === 'hide' ? (
          <StatusCard
            title="카메라 일시 숨김"
            description={'세션은 유지한 채\n화면만 잠시 숨겼습니다'}
          />
        ) : (
          <StatusCard
            title="세션 대기"
            description={'시작하기를 누르면\n웹캠 세션이 연결됩니다'}
          />
        )}

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
          className="h-11 w-[110px] px-[12px] py-[10px]"
          text={
            <div
              className={cn(
                'text-body-md-medium flex items-center gap-1',
                widgetState === 'show' ? 'text-yellow-600' : 'text-yellow-500',
              )}
            >
              <WidgetIcon className="h-6 w-6" />
              위젯
            </div>
          }
        />
      </div>
    </section>
  )
}
