import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type RenderOptions, render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AppI18nProvider } from '@/app/providers/i18n-provider'

interface RenderWithRouterOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export function renderWithRouter(
  ui: ReactElement,
  { route = '/', ...options }: RenderWithRouterOptions = {},
) {
  const queryClient = createTestQueryClient()

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AppI18nProvider>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </AppI18nProvider>
      </QueryClientProvider>
    )
  }

  return render(ui, {
    wrapper: Wrapper,
    ...options,
  })
}
