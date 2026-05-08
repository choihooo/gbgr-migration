import { AxiosError } from 'axios'

export type AuthErrorCode =
  | 'AUTH-101'
  | 'AUTH-102'
  | 'AUTH-UNVERIFIED'
  | 'AUTH-INVALID-CREDENTIALS'
  | 'AUTH-UNKNOWN'

export interface AuthErrorShape {
  code: AuthErrorCode
  message: string
}

function readErrorPayload(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    return error.response.data as { code?: string; message?: string | null }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    }
  }

  return {}
}

export function classifyAuthError(error: unknown): AuthErrorShape {
  const payload = readErrorPayload(error)
  const code = payload.code?.toUpperCase()
  const message = payload.message ?? '인증 처리 중 오류가 발생했습니다.'
  const normalized = message.toLowerCase()

  if (code === 'AUTH-101') {
    return { code: 'AUTH-101', message }
  }

  if (code === 'AUTH-102') {
    return { code: 'AUTH-102', message }
  }

  if (
    code === 'AUTH-UNVERIFIED' ||
    code === 'AUTH-EMAIL-UNVERIFIED' ||
    code === 'EMAIL-UNVERIFIED' ||
    normalized.includes('verify') ||
    normalized.includes('verification') ||
    normalized.includes('unverified') ||
    normalized.includes('이메일 인증') ||
    normalized.includes('메일 인증')
  ) {
    return { code: 'AUTH-UNVERIFIED', message }
  }

  if (
    normalized.includes('password') ||
    normalized.includes('credential') ||
    normalized.includes('비밀번호')
  ) {
    return { code: 'AUTH-INVALID-CREDENTIALS', message }
  }

  return { code: 'AUTH-UNKNOWN', message }
}
