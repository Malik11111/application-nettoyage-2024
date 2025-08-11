import '@testing-library/jest-dom'

// Configuration globale pour les tests
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock du localStorage pour les tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

global.localStorage = localStorageMock as any

// Mock du sessionStorage
global.sessionStorage = localStorageMock as any

// Mock de window.matchMedia pour Material-UI
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Configuration des timeouts pour les tests
vi.setConfig({
  testTimeout: 10000,
})