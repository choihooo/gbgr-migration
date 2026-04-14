import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MainContent } from '../MainContent'

describe('MainContent', () => {
  it('2열 레이아웃과 좌우 패널 영역을 렌더링한다', () => {
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <MainContent />
      </QueryClientProvider>,
    )

    expect(screen.getByTestId('main-content')).toBeInTheDocument()
    expect(screen.getByTestId('left-panel-area')).toBeInTheDocument()
    expect(screen.getByTestId('right-panel-area')).toBeInTheDocument()
    expect(
      screen.getByText('마지막 갱신일: 2025.10.22(수) 17:52'),
    ).toBeInTheDocument()
  })
})
