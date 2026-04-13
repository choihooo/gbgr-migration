import { AxiosError } from 'axios'

interface ErrorResponse {
  message?: string
  code?: string
}

/**
 * API 에러를 파싱하여 사용자에게 보여줄 메시지 반환
 * 에러 코드가 있으면 "[CODE] message" 형식으로 반환
 */
export const parseErrorMessage = (error: unknown): string => {
  // Axios 에러인 경우
  if (error instanceof AxiosError && error.response?.data) {
    const errorData = error.response.data as ErrorResponse
    const code = errorData.code
    const message = errorData.message

    if (code && message) {
      return `[${code}] ${message}`
    }
    if (message) {
      return message
    }
    if (code) {
      return `에러 코드: ${code}`
    }
  }

  // 일반 Error인 경우
  if (error instanceof Error) {
    return error.message
  }

  // 알 수 없는 에러
  return '알 수 없는 오류가 발생했습니다.'
}
