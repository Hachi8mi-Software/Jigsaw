/**
 * 图片缓存管理器
 * 统一管理拼图图片的加载和缓存，避免重复加载
 */

export class ImageCacheManager {
  private static instance: ImageCacheManager
  private cache = new Map<string, HTMLImageElement>()
  private loadingPromises = new Map<string, Promise<HTMLImageElement>>()

  private constructor() {}

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager()
    }
    return ImageCacheManager.instance
  }

  /**
   * 获取缓存的图片，如果不存在则加载
   */
  async getImage(url: string): Promise<HTMLImageElement> {
    // 检查缓存
    const cachedImage = this.cache.get(url)
    if (cachedImage) {
      return cachedImage
    }

    // 检查是否正在加载
    const loadingPromise = this.loadingPromises.get(url)
    if (loadingPromise) {
      return loadingPromise
    }

    // 开始加载图片
    const promise = this.loadImage(url)
    this.loadingPromises.set(url, promise)

    try {
      const image = await promise
      this.cache.set(url, image)
      this.loadingPromises.delete(url)
      return image
    } catch (error) {
      this.loadingPromises.delete(url)
      throw error
    }
  }

  /**
   * 加载单个图片
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        console.log(`图片加载成功: ${url}`)
        resolve(img)
      }
      
      img.onerror = (error) => {
        console.error(`图片加载失败: ${url}`, error)
        reject(new Error(`Failed to load image: ${url}`))
      }
      
      img.src = url
    })
  }

  /**
   * 预加载图片
   */
  async preloadImage(url: string): Promise<void> {
    try {
      await this.getImage(url)
      console.log(`图片预加载完成: ${url}`)
    } catch (error) {
      console.error(`图片预加载失败: ${url}`, error)
    }
  }

  /**
   * 批量预加载图片
   */
  async preloadImages(urls: string[]): Promise<void> {
    const promises = urls.map(url => this.preloadImage(url))
    await Promise.allSettled(promises)
  }

  /**
   * 检查图片是否已缓存
   */
  isImageCached(url: string): boolean {
    return this.cache.has(url)
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
    this.loadingPromises.clear()
    console.log('图片缓存已清除')
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return {
      cachedImages: this.cache.size,
      loadingImages: this.loadingPromises.size,
      totalMemoryUsage: this.estimateMemoryUsage()
    }
  }

  /**
   * 估算内存使用量（简单估算）
   */
  private estimateMemoryUsage(): string {
    let totalBytes = 0
    
    for (const img of this.cache.values()) {
      // 简单估算：宽度 * 高度 * 4 (RGBA)
      totalBytes += img.naturalWidth * img.naturalHeight * 4
    }
    
    const mb = totalBytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  /**
   * 从缓存中移除指定图片
   */
  removeFromCache(url: string): void {
    this.cache.delete(url)
    this.loadingPromises.delete(url)
  }
}

// 导出单例实例
export const imageCache = ImageCacheManager.getInstance()
