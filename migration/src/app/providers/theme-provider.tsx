/**
 * @legacy src/renderer/src/shared/hooks/use-theme-preference.ts (CSS 클래스 토글 로직)
 */
import { useEffect, type ReactNode } from 'react'
import { useThemeStore } from '@/entities/theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const _hydrate = useThemeStore((s) => s._hydrate)

  useEffect(() => {
    _hydrate()

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const preference = useThemeStore.getState().preference
      if (preference === 'system') {
        useThemeStore.getState().setPreference('system')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [_hydrate])

  return <>{children}</>
}
