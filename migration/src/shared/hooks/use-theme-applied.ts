import { useEffect, useState } from 'react'

/**
 * 테마가 실제로 DOM에 적용되었는지 확인하는 hook
 * useThemeStore의 isDark와 달리 MutationObserver로
 * 실제 DOM 상태를 감지하여 Recharts 색상 재계산을 트리거한다.
 * @legacy src/renderer/src/shared/hooks/use-theme-applied.ts
 */
export function useThemeApplied(): boolean {
  const [isDarkApplied, setIsDarkApplied] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkApplied(isDark)
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return isDarkApplied
}
