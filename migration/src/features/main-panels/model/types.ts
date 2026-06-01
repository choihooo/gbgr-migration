/**
 * 메인 패널 공통 타입 정의
 * @legacy src/renderer/src/features/dashboard/ui/ 내 각 패널 props 참고
 */

/** 카메라 표시 상태 */
export type CameraState = 'show' | 'hide' | 'exit'

/** 실제 카메라 런타임 준비 상태 */
export type CameraRuntimeStatus =
  | 'idle'
  | 'starting'
  | 'ready'
  | 'stopping'
  | 'error'

/** 카메라 런타임 실패 코드 */
export type CameraLifecycleErrorCode =
  | 'camera_permission_denied'
  | 'camera_unavailable'
  | 'camera_busy'
  | 'camera_frame_unavailable'
  | 'camera_api_unavailable'
  | 'camera_stream_unauthorized'
  | 'camera_unknown'

/** 사용자 의도와 실제 런타임을 함께 담는 카메라 생명주기 */
export interface CameraLifecycle {
  intent: CameraState
  runtime: CameraRuntimeStatus
  streamUrl: string | null
  errorCode: CameraLifecycleErrorCode | null
  updatedAt: string
}

/** 위젯 표시 상태 */
export type WidgetState = 'show' | 'hide'

/** 패널 기본 Props */
export interface PanelBaseProps {
  className?: string
}

/** 조회 기간 (주간/월간) */
export type Period = 'WEEKLY' | 'MONTHLY'

export const createCameraLifecycle = (
  intent: CameraState = 'exit',
): CameraLifecycle => ({
  intent,
  runtime: 'idle',
  streamUrl: null,
  errorCode: null,
  updatedAt: new Date(0).toISOString(),
})

export const isCameraLifecycleLive = (lifecycle: CameraLifecycle) =>
  lifecycle.intent === 'show' &&
  lifecycle.runtime === 'ready' &&
  Boolean(lifecycle.streamUrl)

export const isCameraLifecyclePreparing = (lifecycle: CameraLifecycle) =>
  lifecycle.intent === 'show' && lifecycle.runtime === 'starting'

export const isCameraLifecycleHidden = (lifecycle: CameraLifecycle) =>
  lifecycle.intent === 'hide'
