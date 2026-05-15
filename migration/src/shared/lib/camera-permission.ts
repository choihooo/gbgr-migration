export function getCameraPermissionErrorMessage(error: unknown) {
  const message =
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
      ? error.message
      : ''

  const name =
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    typeof error.name === 'string'
      ? error.name
      : ''

  if (name === 'NotAllowedError') {
    return '카메라 권한이 차단되어 있어요. macOS 시스템 설정 > 개인정보 보호 및 보안 > 카메라에서 거부기린 권한을 허용한 뒤 다시 시도해주세요.'
  }

  if (name === 'NotFoundError') {
    return '사용 가능한 카메라를 찾을 수 없어요. 카메라 연결 상태를 확인한 뒤 다시 시도해주세요.'
  }

  if (name === 'NotReadableError') {
    return '다른 앱이 이미 카메라를 사용 중일 수 있어요. 화상회의 앱 등을 종료한 뒤 다시 시도해주세요.'
  }

  return message || '카메라를 연결할 수 없습니다.'
}
