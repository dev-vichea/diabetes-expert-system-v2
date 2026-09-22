// Minimal browser-ish globals so the dashboard module can be evaluated in Node.
const store = new Map()

globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => { store.set(key, String(value)) },
  removeItem: (key) => { store.delete(key) },
  clear: () => store.clear(),
  key: (index) => [...store.keys()][index] ?? null,
  get length() { return store.size },
}

// Force the English locale so label assertions are deterministic.
globalThis.localStorage.setItem('app-language', 'en')
