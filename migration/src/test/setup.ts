import '@testing-library/jest-dom/vitest'
import '@/shared/lib/i18n'
import { beforeAll } from 'vitest'
import { i18n } from '@/shared/lib/i18n'

beforeAll(async () => {
  await i18n.changeLanguage('ko')
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

Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: () => Promise.resolve(),
})

Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: () => {},
})

const createStorageMock = (): Storage => {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key)
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value))
    },
  }
}

if (typeof globalThis.localStorage?.clear !== 'function') {
  const storage = createStorageMock()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storage,
  })
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  })
}
