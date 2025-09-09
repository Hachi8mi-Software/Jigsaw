/**
 * ImageCache fs:// 协议支持测试
 * 使用Vitest测试框架验证fs://协议功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { imageCache, ImageCacheManager } from '../src/utils/imageCache'
import { imageStorage } from '../src/utils/imageStorage'

describe('ImageCache fs:// 协议支持测试', () => {
  beforeEach(() => {
    // 清理缓存
    imageCache.clearCache()
  })

  afterEach(async () => {
    // 清理测试文件和缓存
    imageCache.clearCache()
    try {
      const files = await imageStorage.listImages()
      for (const filename of files) {
        if (filename.includes('test') || filename.includes('cache')) {
          await imageStorage.deleteImage(filename)
        }
      }
    } catch (error) {
      // 忽略清理错误
    }
  })

  describe('URL工具方法', () => {
    it('应该能够创建fs://URL', () => {
      const filename = 'test_image.jpg'
      const fsUrl = ImageCacheManager.createFileSystemUrl(filename)
      
      expect(fsUrl).toBe('fs://test_image.jpg')
      expect(fsUrl.startsWith('fs://')).toBe(true)
    })

    it('应该能够检查fs://URL', () => {
      const fsUrl = 'fs://test_image.jpg'
      const normalUrl = 'https://example.com/image.jpg'
      const blobUrl = 'blob:https://example.com/abc123'
      
      expect(ImageCacheManager.isFileSystemUrl(fsUrl)).toBe(true)
      expect(ImageCacheManager.isFileSystemUrl(normalUrl)).toBe(false)
      expect(ImageCacheManager.isFileSystemUrl(blobUrl)).toBe(false)
    })

    it('应该能够从fs://URL提取文件名', () => {
      const fsUrl = 'fs://test_image.jpg'
      const filename = ImageCacheManager.extractFilenameFromFsUrl(fsUrl)
      
      expect(filename).toBe('test_image.jpg')
    })

    it('应该在无效fs://URL时抛出错误', () => {
      const invalidUrl = 'https://example.com/image.jpg'
      
      expect(() => {
        ImageCacheManager.extractFilenameFromFsUrl(invalidUrl)
      }).toThrow('Invalid filesystem URL')
    })
  })

  describe('fs://协议图片加载', () => {
    it('应该能够通过fs://URL加载图片', async () => {
      // 创建并存储测试图片
      const testFile = await createTestImageFile('fs_cache_test.png')
      const filename = await imageStorage.storeImage(testFile, 'fs_cache_test.png')
      
      // 创建fs://URL
      const fsUrl = ImageCacheManager.createFileSystemUrl(filename)
      
      // 通过缓存加载图片
      const image = await imageCache.getImage(fsUrl)
      
      expect(image).toBeDefined()
      expect(image.width).toBeGreaterThan(0)
      expect(image.height).toBeGreaterThan(0)
      
      // 验证图片已缓存
      const isCached = imageCache.isImageCached(fsUrl)
      expect(isCached).toBe(true)
    })

    it('应该能够缓存fs://URL图片', async () => {
      // 创建并存储测试图片
      const testFile = await createTestImageFile('fs_cache_multiple.png')
      const filename = await imageStorage.storeImage(testFile, 'fs_cache_multiple.png')
      const fsUrl = ImageCacheManager.createFileSystemUrl(filename)
      
      // 第一次加载
      const image1 = await imageCache.getImage(fsUrl)
      
      // 第二次加载应该来自缓存
      const image2 = await imageCache.getImage(fsUrl)
      
      expect(image1).toBe(image2) // 应该是同一个对象引用
      
      // 验证缓存状态
      const stats = imageCache.getCacheStats()
      expect(stats.cachedImages).toBeGreaterThan(0)
    })

    it('应该能够处理不存在的fs://文件', async () => {
      const nonExistentFsUrl = ImageCacheManager.createFileSystemUrl('non_existent.png')
      
      await expect(imageCache.getImage(nonExistentFsUrl))
        .rejects.toThrow()
    })
  })

  describe('预加载功能', () => {
    it('应该能够预加载单个fs://图片', async () => {
      // 创建并存储测试图片
      const testFile = await createTestImageFile('fs_preload_single.png')
      const filename = await imageStorage.storeImage(testFile, 'fs_preload_single.png')
      
      // 预加载
      await imageCache.preloadFileSystemImage(filename)
      
      // 验证已缓存
      const fsUrl = ImageCacheManager.createFileSystemUrl(filename)
      const isCached = imageCache.isImageCached(fsUrl)
      expect(isCached).toBe(true)
    })

    it('应该能够批量预加载fs://图片', async () => {
      // 创建多个测试图片
      const filenames: string[] = []
      
      for (let i = 0; i < 3; i++) {
        const testFile = await createTestImageFile(`fs_preload_batch_${i}.png`)
        const filename = await imageStorage.storeImage(testFile, `fs_preload_batch_${i}.png`)
        filenames.push(filename)
      }
      
      // 批量预加载
      await imageCache.preloadFileSystemImages(filenames)
      
      // 验证所有图片都已缓存
      for (const filename of filenames) {
        const fsUrl = ImageCacheManager.createFileSystemUrl(filename)
        const isCached = imageCache.isImageCached(fsUrl)
        expect(isCached).toBe(true)
      }
    })

    it('应该能够处理预加载失败的情况', async () => {
      const nonExistentFilenames = ['non_existent_1.png', 'non_existent_2.png']
      
      // 预加载不存在的文件不应该抛出错误
      await expect(imageCache.preloadFileSystemImages(nonExistentFilenames))
        .resolves.toBeUndefined()
      
      // 验证没有被缓存
      for (const filename of nonExistentFilenames) {
        const fsUrl = ImageCacheManager.createFileSystemUrl(filename)
        const isCached = imageCache.isImageCached(fsUrl)
        expect(isCached).toBe(false)
      }
    })
  })

  describe('缓存管理', () => {
    it('应该能够获取缓存统计信息', async () => {
      // 添加一些图片到缓存
      const testFile = await createTestImageFile('fs_stats_test.png')
      const filename = await imageStorage.storeImage(testFile, 'fs_stats_test.png')
      const fsUrl = ImageCacheManager.createFileSystemUrl(filename)
      
      await imageCache.getImage(fsUrl)
      
      const stats = imageCache.getCacheStats()
      
      expect(stats).toHaveProperty('cachedImages')
      expect(stats).toHaveProperty('loadingImages')
      expect(stats).toHaveProperty('totalMemoryUsage')
      
      expect(stats.cachedImages).toBeGreaterThan(0)
      expect(typeof stats.loadingImages).toBe('number')
      expect(typeof stats.totalMemoryUsage).toBe('string')
    })

    it('应该能够从缓存中移除fs://图片', async () => {
      // 添加图片到缓存
      const testFile = await createTestImageFile('fs_remove_test.png')
      const filename = await imageStorage.storeImage(testFile, 'fs_remove_test.png')
      const fsUrl = ImageCacheManager.createFileSystemUrl(filename)
      
      await imageCache.getImage(fsUrl)
      
      // 验证已缓存
      let isCached = imageCache.isImageCached(fsUrl)
      expect(isCached).toBe(true)
      
      // 从缓存中移除
      imageCache.removeFromCache(fsUrl)
      
      // 验证已移除
      isCached = imageCache.isImageCached(fsUrl)
      expect(isCached).toBe(false)
    })

    it('应该能够清理所有缓存', async () => {
      // 添加多个图片到缓存
      const filenames: string[] = []
      
      for (let i = 0; i < 2; i++) {
        const testFile = await createTestImageFile(`fs_clear_test_${i}.png`)
        const filename = await imageStorage.storeImage(testFile, `fs_clear_test_${i}.png`)
        filenames.push(filename)
        
        const fsUrl = ImageCacheManager.createFileSystemUrl(filename)
        await imageCache.getImage(fsUrl)
      }
      
      // 验证有缓存内容
      let stats = imageCache.getCacheStats()
      expect(stats.cachedImages).toBeGreaterThan(0)
      
      // 清理所有缓存
      imageCache.clearCache()
      
      // 验证缓存已清空
      stats = imageCache.getCacheStats()
      expect(stats.cachedImages).toBe(0)
      expect(stats.loadingImages).toBe(0)
    })
  })

  describe('混合URL支持', () => {
    it('应该能够同时处理fs://和普通URL', async () => {
      // 创建fs://图片
      const testFile = await createTestImageFile('fs_mixed_test.png')
      const filename = await imageStorage.storeImage(testFile, 'fs_mixed_test.png')
      const fsUrl = ImageCacheManager.createFileSystemUrl(filename)
      
      // Mock一个普通的blob URL
      const normalUrl = 'blob:https://example.com/mock-blob-url'
      
      // 加载两种类型的图片
      const fsImage = await imageCache.getImage(fsUrl)
      const normalImage = await imageCache.getImage(normalUrl)
      
      expect(fsImage).toBeDefined()
      expect(normalImage).toBeDefined()
      
      // 验证两者都被缓存
      expect(imageCache.isImageCached(fsUrl)).toBe(true)
      expect(imageCache.isImageCached(normalUrl)).toBe(true)
      
      // 验证缓存统计
      const stats = imageCache.getCacheStats()
      expect(stats.cachedImages).toBeGreaterThanOrEqual(2)
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
