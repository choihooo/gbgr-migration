type StorageSeed = Record<string, string>

class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  get length() {
    return this.store.size
  }

  clear() {
    this.store.clear()
  }

  getItem(key: string) {
    return this.store.get(key) ?? null
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.store.delete(key)
  }

  setItem(key: string, value: string) {
    this.store.set(key, value)
  }
}

export function installMockStorage(seed: StorageSeed = {}) {
  const storage = new MemoryStorage()

  for (const [key, value] of Object.entries(seed)) {
    storage.setItem(key, value)
  }

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    writable: true,
    value: storage,
  })

  return storage
}

export function seedStorage(seed: StorageSeed) {
  window.localStorage.clear()

  for (const [key, value] of Object.entries(seed)) {
    window.localStorage.setItem(key, value)
  }
}

export function resetStorage() {
  window.localStorage.clear()
}
