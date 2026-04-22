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
