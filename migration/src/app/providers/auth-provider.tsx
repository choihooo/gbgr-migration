import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useAuthBootstrap } from '@/features/auth/model/use-auth-bootstrap'

interface AuthProviderProps {
  children: ReactNode
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

function AuthBootstrapBoundary({ children }: AuthProviderProps) {
  useAuthBootstrap()

  return children
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrapBoundary>{children}</AuthBootstrapBoundary>
    </QueryClientProvider>
  )
}
