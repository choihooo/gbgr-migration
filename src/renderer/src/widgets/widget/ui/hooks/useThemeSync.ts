import { useEffect } from 'react'

/* 메인 창의 테마 위젯 창에 동시에 반영 */
export function useThemeSync() {
  useEffect(() => {
    const applyTheme = () => {
      const isDark = localStorage.getItem('theme') === 'dark'
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    // 초기 테마 적용
    applyTheme()

    /*메인 창에서 테마 변경 시 자동 반영 */
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        applyTheme()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])
}
