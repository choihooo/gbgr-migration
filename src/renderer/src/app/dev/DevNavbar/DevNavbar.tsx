import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const DevNavbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isDev = import.meta.env.DEV
  const [isWidgetOpen, setIsWidgetOpen] = useState(false)

  // 개발 모드가 아니면 렌더링하지 않음
  if (!isDev) return null

  const navItems = [
    { path: '/', label: '메인' },
    { path: '/auth/login', label: '로그인' },
    { path: '/auth/signup', label: '회원가입' },
    { path: '/onboarding', label: '온보딩' },
    { path: '/onboarding/calibration', label: '캘리브레이션' },
  ]

  // 위젯 토글
  const handleToggleWidget = async () => {
    try {
      if (window.electronAPI?.widget) {
        if (isWidgetOpen) {
          await window.electronAPI.widget.close()
          setIsWidgetOpen(false)
        } else {
          await window.electronAPI.widget.open()
          setIsWidgetOpen(true)
        }
      }
    } catch (error) {
      console.error('위젯 토글 실패:', error)
    }
  }

  return (
    <div className="fixed top-0 right-0 left-0 z-[9999] h-10 border-b-2 border-yellow-400 bg-yellow-100">
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-yellow-800">
            🚧 개발 모드 네비게이션
          </div>
          <nav className="flex gap-2">
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-500 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* 위젯 토글 버튼 */}
            <button
              onClick={handleToggleWidget}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                isWidgetOpen
                  ? 'bg-purple-500 text-white hover:bg-purple-600'
                  : 'border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              {isWidgetOpen ? '위젯 닫기' : '위젯 열기'}
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}

export default DevNavbar
