export interface LoginInput {
  email: string
  password: string
}

export interface LoginResponse {
  timestamp: string
  success: boolean
  data: {
    accessToken: string
    refreshToken: string
  }
  code: string
  message: string
}

export interface SignupRequest {
  email: string
  password: string
  name: string
  callbackUrl: string
  avatar?: string
}

export interface ResendVerifyEmailRequest {
  email: string
  callbackUrl: string
}
