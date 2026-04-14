import '@testing-library/jest-dom/vitest'

// zustand persist 미들웨어가 createJSONStorage(() => window.localStorage)로
// localStorage를 참조하므로, 테스트 시작 전에 window.localStorage를
// 실제 Storage 인터페이스를 구현한 mock으로 교체합니다.
// jsdom의 기본 localStorage는 비동기적이지 않지만,
// vitest 환경에서는 때때로 setItem이 undefined가 되는 이슈가 있습니다.
const memoryStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  }
})()

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  writable: true,
  value: memoryStorage,
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

window.alert = vi.fn()
