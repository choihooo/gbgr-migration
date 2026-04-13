/**
 * GA 이벤트 전송을 위한 유효성 검증 헬퍼 함수들
 */

/**
 * userId 유효성을 검증하고 로그를 출력합니다
 * @param userId - 검증할 userId
 * @param eventName - 이벤트 이름 (로그용)
 * @returns userId가 유효한 경우 true
 */
export const validateAndLogUserId = (
  userId: string | undefined,
  eventName: string,
): userId is string => {
  if (!userId) {
    console.warn(`[GA] ${eventName}: user_id is missing from response`)
    return false
  }
  return true
}

/**
 * sessionId 유효성을 검증하고 로그를 출력합니다
 * @param sessionId - 검증할 sessionId
 * @param eventName - 이벤트 이름 (로그용)
 * @returns sessionId가 유효한 경우 true
 */
export const validateAndLogSessionId = (
  sessionId: string | null | undefined,
  eventName: string,
): sessionId is string => {
  if (!sessionId) {
    console.warn(`[GA] ${eventName}: session_id is missing`)
    return false
  }
  return true
}
