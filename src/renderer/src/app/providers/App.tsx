import { router } from '@shared/config/router'
import { LoadingSpinner } from '@shared/ui/loading'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'

function App() {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense
        fallback={
          <div className="flex h-screen w-screen items-center justify-center bg-grey-25">
            <LoadingSpinner size="lg" text="로딩 중..." />
          </div>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>
  )
}

export default App
