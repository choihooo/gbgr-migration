import type { SessionActionResponse } from '@/entities/session/types'
import type {
  CheckEmailResponse,
  LoginInput,
  LoginResponse,
  MeResponse,
  ResendVerifyEmailRequest,
  SignupRequest,
  VerifyEmailRequest,
  VerifyEmailResponse,
} from '@/entities/user'
import api from '@/shared/api/instance'

export async function loginRequest(payload: LoginInput) {
  const response = await api.post<LoginResponse>('/auth/login', payload)
  return response.data
}

export async function fetchCurrentUser() {
  const response = await api.get<MeResponse>('/users/me')
  return response.data
}

export async function checkEmailRequest(email: string) {
  const response = await api.post<CheckEmailResponse>('/auth/check-email', {
    email,
  })
  return response.data
}

export async function signupRequest(payload: SignupRequest) {
  const response = await api.post('/auth/sign-up', payload)
  return response.data as {
    success: boolean
    code?: string
    message?: string | null
  }
}

export async function verifyEmailRequest(payload: VerifyEmailRequest) {
  const response = await api.post<VerifyEmailResponse>(
    '/auth/verify-email',
    payload,
  )
  return response.data
}

export async function withdrawRequest() {
  const response = await api.delete<SessionActionResponse>('/users/me')
  if (!response.data.success) {
    throw new Error(response.data.message || '회원탈퇴에 실패했습니다.')
  }
}

export async function resendVerificationEmailRequest(
  payload: ResendVerifyEmailRequest,
) {
  const response = await api.post('/auth/resend-verification-email', payload)
  return response.data as {
    success: boolean
    code?: string
    message?: string | null
  }
}
