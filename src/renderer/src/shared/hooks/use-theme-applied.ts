import { useEffect, useState } from 'react'

/**
 * 테마가 실제로 DOM에 적용되었는지 확인하는 hook
 * useThemePreference의 isDark와 달리 실제 DOM 상태를 확인합니다.
 */
export function useThemeApplied(): boolean {
  const [isDarkApplied, setIsDarkApplied] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    // MutationObserver로 dark 클래스 변경 감지
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
