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

// Mock OPFS API
const mockFileHandle = {
  getFile: vi.fn(() => Promise.resolve(new File(['mock content'], 'test.png', { type: 'image/png' }))),
  createWritable: vi.fn(() => Promise.resolve({
    write: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve())
  }))
}

const mockDirectoryHandle = {
  getFileHandle: vi.fn(() => Promise.resolve(mockFileHandle)),
  getDirectoryHandle: vi.fn(() => Promise.resolve(mockDirectoryHandle)),
  removeEntry: vi.fn(() => Promise.resolve()),
  entries: vi.fn(function* () {
    yield ['test.png', mockFileHandle]
  })
}

// Mock navigator.storage for OPFS
Object.defineProperty(global, 'navigator', {
  value: {
    ...global.navigator,
    storage: {
      getDirectory: vi.fn(() => Promise.resolve(mockDirectoryHandle))
    }
  }
})

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn((blob) => `blob:${Math.random()}`),
    revokeObjectURL: vi.fn()
  }
})

// Mock Blob
Object.defineProperty(global, 'Blob', {
  value: class MockBlob {
    size: number
    type: string
    constructor(parts: any[], options: any = {}) {
      this.size = parts.reduce((acc, part) => acc + (part.length || 0), 0)
      this.type = options.type || ''
    }
  }
})

// Mock File extends Blob
Object.defineProperty(global, 'File', {
  value: class MockFile extends (global as any).Blob {
    name: string
    lastModified: number
    constructor(parts: any[], name: string, options: any = {}) {
      super(parts, options)
      this.name = name
      this.lastModified = options.lastModified || Date.now()
    }
  }
})

// Clear all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
})
