import api from '@shared/api'
import { parseErrorMessage } from '@shared/lib/error/parse-error'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

type WithdrawResponse = {
  timestamp?: string
  success: boolean
  code?: string
  message?: string | null
}

const withdrawUser = async (): Promise<WithdrawResponse> => {
  try {
    const response = await api.delete<WithdrawResponse>('/users/me')
    const result = response.data

    if (!result.success) {
      throw new Error(result.message || '회원탈퇴 실패')
    }

    return result
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as {
        message?: string
        code?: string
      }
      throw new Error(errorData.message || errorData.code || '회원탈퇴 실패')
    }
    throw error instanceof Error ? error : new Error('회원탈퇴 실패')
  }
}

export const useWithdrawMutation = () => {
  return useMutation({
    mutationFn: withdrawUser,
  })
}
