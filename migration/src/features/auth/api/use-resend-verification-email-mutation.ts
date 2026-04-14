import { useMutation } from '@tanstack/react-query'
import { resendVerificationEmailRequest } from './auth-api'

export function useResendVerificationEmailMutation() {
  return useMutation({
    mutationFn: resendVerificationEmailRequest,
  })
}
