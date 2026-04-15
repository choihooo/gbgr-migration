export interface ApiEnvelope<T> {
  timestamp?: string
  success: boolean
  code?: string
  message?: string | null
  data: T
}

export interface LoginInput {
  email: string
  password: string
}

export interface LoginData {
  accessToken: string
  refreshToken: string
}

export type LoginResponse = ApiEnvelope<LoginData>

export interface SignupRequest {
  email: string
  password: string
  name: string
  callbackUrl: string
  avatar?: string
}

export interface CheckEmailData {
  isDuplicate: boolean
}

export type CheckEmailResponse = ApiEnvelope<CheckEmailData>

export interface VerifyEmailRequest {
  token: string
}

export interface VerifyEmailData {
  id?: string
  userId?: string
}

export type VerifyEmailResponse = ApiEnvelope<VerifyEmailData | null>

export interface ResendVerifyEmailRequest {
  email: string
  callbackUrl: string
}

export interface MeData {
  id?: string
  userId?: string
  name?: string
  email?: string
  avatar?: string
}

export type MeResponse = ApiEnvelope<MeData>
