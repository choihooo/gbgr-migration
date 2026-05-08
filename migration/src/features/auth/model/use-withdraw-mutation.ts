import { useMutation } from '@tanstack/react-query'
import { withdrawRequest } from '../api/auth-api'

export function useWithdrawMutation() {
  return useMutation({ mutationFn: withdrawRequest })
}
