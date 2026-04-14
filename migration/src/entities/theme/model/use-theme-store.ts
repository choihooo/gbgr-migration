/**
 * @legacy src/renderer/src/shared/hooks/use-theme-preference.ts
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ThemePreference = 'light' | 'dark' | 'system'

interface ThemeStore {
  preference: ThemePreference
  resolvedTheme: 'light' | 'dark'
  isDark: boolean
  setPreference: (pref: ThemePreference) => void
  _hydrate: () => void
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') return getSystemTheme()
  return preference
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    set => ({
      preference: 'system' as ThemePreference,
      resolvedTheme: getSystemTheme(),
      isDark: false,

      setPreference: (pref: ThemePreference) => {
        const resolved = resolveTheme(pref)
        set({
          preference: pref,
          resolvedTheme: resolved,
          isDark: resolved === 'dark',
        })

        if (typeof document !== 'undefined') {
          if (resolved === 'dark') {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      },

      _hydrate: () => {
        const state = useThemeStore.getState()
        const resolved = resolveTheme(state.preference)
        set({ resolvedTheme: resolved, isDark: resolved === 'dark' })

        if (typeof document !== 'undefined') {
          if (resolved === 'dark') {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      },
    }),
    {
      name: 'theme',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ preference: state.preference }),
    },
  ),
)
