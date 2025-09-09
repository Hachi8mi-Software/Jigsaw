/**
 * OPFS图像存储测试
 * 使用Vitest测试框架验证OPFS功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { imageStorage } from '../src/utils/imageStorage'

// Mock DOM APIs for testing
Object.defineProperty(global, 'Image', {
  value: class {
    onload: (() => void) | null = null
    onerror: ((error: any) => void) | null = null
    
    set src(value: string) {
      // Simulate successful image loading
      setTimeout(() => {
        if (this.onload) {
          this.onload()
        }
      }, 10)
    }
    
    width = 100
    height = 100
  }
})

Object.defineProperty(global, 'HTMLCanvasElement', {
  value: class {
    width = 0
    height = 0
    
    getContext() {
      return {
        fillStyle: '',
        fillRect: vi.fn(),
        createLinearGradient: vi.fn(() => ({
          addColorStop: vi.fn()
        }))
      }
    }
    
    toBlob(callback: (blob: Blob) => void, type = 'image/png', quality = 1.0) {
      // Create a mock blob
      const mockBlob = new Blob(['mock image data'], { type })
      setTimeout(() => callback(mockBlob), 10)
    }
    
    toDataURL(type = 'image/png', quality = 1.0) {
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    }
  }
})

// Mock document.createElement
Object.defineProperty(global, 'document', {
  value: {
    createElement: (tagName: string) => {
      if (tagName === 'canvas') {
        return new (global as any).HTMLCanvasElement()
      }
      return {}
    }
  }
})

describe('OPFS图像存储测试', () => {
  beforeEach(() => {
    // 重置任何状态
  })

  afterEach(async () => {
    // 清理测试文件
    try {
      const files = await imageStorage.listImages()
      for (const filename of files) {
        if (filename.includes('test') || filename.includes('opfs_test')) {
          await imageStorage.deleteImage(filename)
        }
      }
    } catch (error) {
      // 忽略清理错误
    }
  })

  describe('存储类型检测', () => {
    it('应该能够检测存储类型', async () => {
      const storageType = await imageStorage.getStorageType()
      
      expect(storageType).toMatch(/^(opfs|memory)$/)
      expect(typeof storageType).toBe('string')
    })
  })

  describe('基本存储功能', () => {
    it('应该能够存储和读取图片', async () => {
      // 创建测试图片文件
      const testFile = await createTestImageFile('test_basic.png')
      
      // 存储测试
      const filename = await imageStorage.storeImage(testFile, 'opfs_basic_test.png')
      
      expect(filename).toBe('opfs_basic_test.png')
      
      // 读取测试
      const imageURL = await imageStorage.getImageURL(filename)
      
      expect(imageURL).toBeDefined()
      expect(typeof imageURL).toBe('string')
      expect(imageURL.length).toBeGreaterThan(0)
      
      // 验证图片存在
      const exists = await imageStorage.imageExists(filename)
      expect(exists).toBe(true)
    })

    it('应该能够删除图片', async () => {
      // 创建并存储测试图片
      const testFile = await createTestImageFile('test_delete.png')
      const filename = await imageStorage.storeImage(testFile, 'opfs_delete_test.png')
      
      // 验证存在
      let exists = await imageStorage.imageExists(filename)
      expect(exists).toBe(true)
      
      // 删除图片
      await imageStorage.deleteImage(filename)
      
      // 验证已删除
      exists = await imageStorage.imageExists(filename)
      expect(exists).toBe(false)
    })

    it('应该能够列出所有图片', async () => {
      // 创建多个测试图片
      const testFiles = [
        await createTestImageFile('test1.png'),
        await createTestImageFile('test2.png')
      ]
      
      const filenames: string[] = []
      
      for (let i = 0; i < testFiles.length; i++) {
        const filename = await imageStorage.storeImage(testFiles[i], `opfs_list_test_${i}.png`)
        filenames.push(filename)
      }
      
      // 获取文件列表
      const allFiles = await imageStorage.listImages()
      
      // 验证我们的测试文件都在列表中
      for (const filename of filenames) {
        expect(allFiles).toContain(filename)
      }
    })
  })

  describe('DataURI迁移功能', () => {
    it('应该能够从DataURI迁移到OPFS', async () => {
      // 创建测试DataURI
      const dataURI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      
      // 执行迁移
      const filename = await imageStorage.migrateFromDataURI(dataURI, 'migrated_test.png')
      
      expect(filename).toBe('migrated_test.png')
      
      // 验证迁移结果
      const exists = await imageStorage.imageExists(filename)
      expect(exists).toBe(true)
      
      const imageURL = await imageStorage.getImageURL(filename)
      expect(imageURL).toBeDefined()
      expect(typeof imageURL).toBe('string')
    })

    it('应该能够处理不同格式的DataURI', async () => {
      const testCases = [
        {
          name: 'PNG格式',
          dataURI: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          filename: 'test_png_migration.png'
        },
        {
          name: 'JPEG格式',
          dataURI: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==',
          filename: 'test_jpeg_migration.jpg'
        }
      ]

      for (const testCase of testCases) {
        const filename = await imageStorage.migrateFromDataURI(testCase.dataURI, testCase.filename)
        
        expect(filename).toBe(testCase.filename)
        
        const exists = await imageStorage.imageExists(filename)
        expect(exists).toBe(true)
      }
    })
  })

  describe('存储统计功能', () => {
    it('应该能够获取存储统计信息', async () => {
      // 创建一些测试文件
      const testFile = await createTestImageFile('stats_test.png')
      await imageStorage.storeImage(testFile, 'opfs_stats_test.png')
      
      const stats = await imageStorage.getStorageStats()
      
      expect(stats).toHaveProperty('totalFiles')
      expect(stats).toHaveProperty('totalSize')
      expect(stats).toHaveProperty('cachedURLs')
      expect(stats).toHaveProperty('storageType')
      
      expect(typeof stats.totalFiles).toBe('number')
      expect(typeof stats.totalSize).toBe('number')
      expect(typeof stats.cachedURLs).toBe('number')
      expect(stats.storageType).toMatch(/^(opfs|memory)$/)
      
      expect(stats.totalFiles).toBeGreaterThanOrEqual(0)
      expect(stats.totalSize).toBeGreaterThanOrEqual(0)
      expect(stats.cachedURLs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('压缩功能', () => {
    it('应该能够压缩存储图片', async () => {
      // 创建较大的测试图片
      const largeTestFile = await createLargeTestImageFile('large_test.jpg')
      
      // 测试压缩存储
      const filename = await imageStorage.storeCompressedImage(largeTestFile, 'compressed_test.jpg', {
        quality: 0.8,
        maxWidth: 400,
        maxHeight: 300
      })
      
      expect(filename).toBe('compressed_test.jpg')
      
      // 验证压缩结果
      const exists = await imageStorage.imageExists(filename)
      expect(exists).toBe(true)
      
      const imageURL = await imageStorage.getImageURL(filename)
      expect(imageURL).toBeDefined()
    })

    it('应该能够使用默认压缩选项', async () => {
      const testFile = await createTestImageFile('default_compression.png')
      
      const filename = await imageStorage.storeCompressedImage(testFile)
      
      expect(filename).toBeDefined()
      expect(typeof filename).toBe('string')
      
      const exists = await imageStorage.imageExists(filename)
      expect(exists).toBe(true)
    })
  })

  describe('错误处理', () => {
    it('应该处理不存在的文件', async () => {
      const nonExistentFile = 'non_existent_file.png'
      
      const exists = await imageStorage.imageExists(nonExistentFile)
      expect(exists).toBe(false)
      
      await expect(imageStorage.getImageURL(nonExistentFile))
        .rejects.toThrow()
    })

    it('应该处理无效的DataURI', async () => {
      const invalidDataURI = 'invalid:data:uri'
      
      await expect(imageStorage.migrateFromDataURI(invalidDataURI))
        .rejects.toThrow()
    })
  })

  describe('并发操作', () => {
    it('应该能够处理并发存储操作', async () => {
      const concurrentOperations = Array.from({ length: 5 }, async (_, index) => {
        const testFile = await createTestImageFile(`concurrent_${index}.png`)
        return imageStorage.storeImage(testFile, `concurrent_test_${index}.png`)
      })
      
      const filenames = await Promise.all(concurrentOperations)
      
      expect(filenames).toHaveLength(5)
      
      // 验证所有文件都存在
      for (const filename of filenames) {
        const exists = await imageStorage.imageExists(filename)
        expect(exists).toBe(true)
      }
    })
  })
})

// 辅助函数

/**
 * 创建测试图片文件
 */
async function createTestImageFile(filename: string): Promise<File> {
  const canvas = document.createElement('canvas') as any
  canvas.width = 100
  canvas.height = 100
  
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(resolve, 'image/png')
  })
  
  return new File([blob], filename, { type: 'image/png' })
}

/**
 * 创建大型测试图片文件
 */
async function createLargeTestImageFile(filename: string): Promise<File> {
  const canvas = document.createElement('canvas') as any
  canvas.width = 800
  canvas.height = 600
  
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 1.0)
  })
  
  return new File([blob], filename, { type: 'image/jpeg' })
}
