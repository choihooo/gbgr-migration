import { useMutation } from '@tanstack/react-query'
import { checkEmailRequest, signupRequest } from './auth-api'

export function useCheckEmailMutation() {
  return useMutation({
    mutationFn: checkEmailRequest,
  })
}

export function useSignupMutation() {
  return useMutation({
    mutationFn: signupRequest,
  })
}
