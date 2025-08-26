import { beforeEach, vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  get length() { return 0 },
  key: vi.fn(() => null)
}
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Mock DOMRect
const DOMRectMock = class DOMRect {
  bottom: number = 0
  left: number = 0
  right: number = 0
  top: number = 0
  width: number = 0
  height: number = 0
  x: number = 0
  y: number = 0

  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.left = x
    this.top = y
    this.right = x + width
    this.bottom = y + height
  }

  static fromRect(other?: DOMRectInit): DOMRect {
    return new DOMRect(other?.x, other?.y, other?.width, other?.height)
  }

  toJSON() {
    return JSON.stringify(this)
  }
}

Object.defineProperty(global, 'DOMRect', { value: DOMRectMock })

// Clear all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
})
