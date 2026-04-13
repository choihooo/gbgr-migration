import HideIcon from '@assets/common/icons/hide.svg?react'
import ShowIcon from '@assets/common/icons/show.svg?react'
import WidgetIcon from '@assets/common/icons/widget.svg?react'
import { useLevelQuery } from '@entities/dashboard'
import type { PoseLandmark, WorldLandmark } from '@entities/posture'
import {
  useCreateSessionMutation,
  usePauseSessionMutation,
  useResumeSessionMutation,
  useStopSessionMutation,
} from '@entities/session'
import { WebcamView } from '@features/calibration/ui'
import { Button } from '@shared/ui/button'
import { useCameraStore } from '@widgets/camera'
import { useWidget } from '@widgets/widget'

interface Props {
  onUserMediaError: (e: string | DOMException) => void
  onPoseDetected: (
    landmarks: PoseLandmark[],
    worldLandmarks?: WorldLandmark[],
  ) => void
  onToggleWebcam: () => void
  onSendMetrics: () => Promise<void>
}

const WebcamPanel = ({
  onPoseDetected,
  onToggleWebcam,
  onSendMetrics,
}: Props) => {
  const { cameraState, setShow, setHide, setExit } = useCameraStore()
  const { toggleWidget, isWidgetOpen } = useWidget()
  const isWebcamOn = cameraState === 'show'
  const isExit = cameraState === 'exit'

  const { mutate: createSession, isPending: isCreatingSession } =
    useCreateSessionMutation()
  const { mutate: stopSession, isPending: isStoppingSession } =
    useStopSessionMutation()
  const { mutate: pauseSession, isPending: isPausingSession } =
    usePauseSessionMutation()
  const { mutate: resumeSession, isPending: isResumingSession } =
    useResumeSessionMutation()
  const { data: levelData } = useLevelQuery()

  const handleStartStop = async () => {
    if (isExit) {
      // 시작하기: 세션 생성 후 카메라 시작
      createSession(undefined, {
        onSuccess: () => {
          /* 세션 시작 시점의 이동거리 저장 */
          const startDistance = levelData?.data.current || 0
          localStorage.setItem('sessionStartDistance', startDistance.toString())

          setShow()
        },
      })
    } else {
      // 종료하기: 메트릭 전송 완료 → 세션 중단 → 카메라 종료 → 위젯 닫기
      const sessionId = localStorage.getItem('sessionId')
      if (sessionId) {
        // 1. 수집된 메트릭을 서버로 전송 (완료 대기)
        await onSendMetrics()

        // 2. 세션 종료 (메트릭 전송 완료 후 실행)
        stopSession(sessionId, {
          onSuccess: () => {
            setExit()
            // 3. 위젯이 열려있으면 닫기
            if (isWidgetOpen) {
              toggleWidget()
            }
          },
        })
      } else {
        // sessionId가 없으면 그냥 카메라만 종료
        setExit()
        // 위젯이 열려있으면 닫기
        if (isWidgetOpen) {
          toggleWidget()
        }
      }
    }
  }

  // 카메라 보이기/숨기기 버튼: 일시정지/재개
  const handleToggleCamera = () => {
    const sessionId = localStorage.getItem('sessionId')

    if (isWebcamOn) {
      // 카메라 보이는 상태 → 숨기기: 세션 일시정지
      if (sessionId) {
        pauseSession(sessionId, {
          onSuccess: () => {
            setHide()
            onToggleWebcam()
          },
        })
      } else {
        setHide()
        onToggleWebcam()
      }
    } else {
      // 카메라 숨김 상태 → 보이기: 세션 재개
      if (sessionId) {
        resumeSession(sessionId, {
          onSuccess: () => {
            setShow()
            onToggleWebcam()
          },
        })
      } else {
        setShow()
        onToggleWebcam()
      }
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="relative aspect-video max-h-[198px] max-w-[352px]">
        <WebcamView onPoseDetected={onPoseDetected} showPoseOverlay={true} />
        <Button
          size={'md'}
          variant={'grey'}
          text={
            isWebcamOn ? (
              <HideIcon className="h-[18px] w-[18px]" />
            ) : (
              <ShowIcon className="h-[18px] w-[18px]" />
            )
          }
          onClick={handleToggleCamera}
          disabled={isExit || isPausingSession || isResumingSession}
          className="absolute top-2 right-2 h-[30px] w-[30px] px-0"
        />
      </div>
      <div className="flex gap-2">
        <Button
          size={'md'}
          variant={'primary'}
          text={
            isCreatingSession
              ? '세션 생성 중...'
              : isStoppingSession
                ? '세션 종료 중...'
                : isExit
                  ? '시작하기'
                  : '종료하기'
          }
          className="labtop:max-w-[260px] h-11 w-full max-w-[196px]"
          onClick={handleStartStop}
          disabled={isCreatingSession || isStoppingSession}
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

export default WebcamPanel
