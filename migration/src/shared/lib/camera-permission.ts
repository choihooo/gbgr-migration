import type { CameraErrorCode } from '@/entities/posture'

export function getCameraPermissionErrorCode(error: unknown): CameraErrorCode {
  const name =
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    typeof error.name === 'string'
      ? error.name
      : ''

  const message =
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
      ? error.message
      : typeof error === 'string'
        ? error
        : ''

  if (name === 'NotAllowedError' || message === 'camera_permission_denied') {
    return 'camera_permission_denied'
  }

  if (name === 'NotFoundError' || message === 'camera_unavailable') {
    return 'camera_unavailable'
  }

  if (name === 'NotReadableError' || message === 'camera_busy') {
    return 'camera_busy'
  }

  if (message === 'camera_frame_unavailable') {
    return 'camera_frame_unavailable'
  }

  if (message === 'camera_api_unavailable') {
    return 'camera_api_unavailable'
  }

  if (message === 'camera_stream_unauthorized') {
    return 'camera_stream_unauthorized'
  }

  return 'camera_unknown'
}

export function getCameraPermissionErrorMessage(error: unknown) {
  const message =
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
      ? error.message
      : ''

  const code = getCameraPermissionErrorCode(error)

  if (code === 'camera_permission_denied') {
    return '카메라 권한이 차단되어 있어요. macOS 시스템 설정 > 개인정보 보호 및 보안 > 카메라에서 거부기린 권한을 허용한 뒤 다시 시도해주세요.'
  }

  if (code === 'camera_unavailable') {
    return '사용 가능한 카메라를 찾을 수 없어요. 카메라 연결 상태를 확인한 뒤 다시 시도해주세요.'
  }

  if (code === 'camera_busy') {
    return '다른 앱이 이미 카메라를 사용 중일 수 있어요. 화상회의 앱 등을 종료한 뒤 다시 시도해주세요.'
  }

  if (code === 'camera_frame_unavailable') {
    return '카메라 프레임을 가져오지 못했어요. 카메라 연결 상태를 확인한 뒤 다시 시도해주세요.'
  }

  if (code === 'camera_api_unavailable') {
    return '이 환경에서는 카메라 API를 사용할 수 없어요. 데스크톱 앱에서 다시 시도해주세요.'
  }

  return message || '카메라를 연결할 수 없습니다.'
}

export function getSidecarCameraErrorMessage(message: string | null) {
  if (message === 'camera_permission_denied') {
    return '카메라 권한이 차단되어 있어요. macOS 시스템 설정 > 개인정보 보호 및 보안 > 카메라에서 거부기린 또는 posture-turtle 권한을 허용한 뒤 다시 시도해주세요.'
  }

  if (message === 'camera_unavailable') {
    return '카메라를 열 수 없어요. 권한을 허용했는지, 다른 앱이 카메라를 사용 중인지 확인한 뒤 다시 시도해주세요.'
  }

  if (message === 'camera_busy') {
    return '다른 앱이 이미 카메라를 사용 중일 수 있어요. 화상회의 앱 등을 종료한 뒤 다시 시도해주세요.'
  }

  if (message === 'camera_frame_unavailable') {
    return '카메라 프레임을 가져오지 못했어요. 카메라 연결 상태를 확인한 뒤 다시 시도해주세요.'
  }

  if (message === 'camera_stream_unauthorized') {
    return '카메라 스트림 접근이 차단됐어요. 측정을 다시 시작해주세요.'
  }

  return null
}

export function isSidecarCameraPermissionError(message: string | null) {
  return (
    message === 'camera_permission_denied' ||
    message === 'camera_unavailable' ||
    message === 'camera_busy' ||
    message === 'camera_frame_unavailable' ||
    message === 'camera_stream_unauthorized'
  )
}
