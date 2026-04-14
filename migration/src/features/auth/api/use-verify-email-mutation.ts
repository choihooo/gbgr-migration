import { useMutation } from '@tanstack/react-query'
import { verifyEmailRequest } from './auth-api'

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: verifyEmailRequest,
  })
}
