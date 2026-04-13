import { useEffect, useRef, useState } from 'react'

type UseThemePreferenceReturn = [boolean, (value: boolean) => void]

const THEME_STORAGE_KEY = 'theme'

export function useThemePreference(): UseThemePreferenceReturn {
  const isApplyingSystemTheme = useRef(false)

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }

    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme === 'dark'
    }

    return false
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

    if (!savedTheme && window.electronAPI?.getSystemTheme) {
      isApplyingSystemTheme.current = true
      window.electronAPI
        .getSystemTheme()
        .then((systemTheme: 'dark' | 'light') => {
          const shouldBeDark = systemTheme === 'dark'
          setIsDark(shouldBeDark)

          if (shouldBeDark) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }

          setTimeout(() => {
            isApplyingSystemTheme.current = false
          }, 0)
        })
        .catch((error: unknown) => {
          console.error('시스템 테마 조회 실패:', error)
          isApplyingSystemTheme.current = false
        })
    } else if (savedTheme) {
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [])

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    if (!isApplyingSystemTheme.current) {
      window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light')
    }
  }, [isDark])

  return [isDark, setIsDark]
}
