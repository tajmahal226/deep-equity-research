import { vi } from 'vitest';

// Setup global test environment
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});

// Mock localStorage for browser-dependent tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();

global.localStorage = localStorageMock as any;

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = vi.fn();
}

// Suppress console errors in tests unless explicitly needed
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
