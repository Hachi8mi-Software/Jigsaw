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
  private async loadImage(url: string): Promise<HTMLImageElement> {
    // 处理 fs:// 协议
    if (url.startsWith('fs://')) {
      return this.loadFileSystemImage(url)
    }
    
    // 处理普通 URL
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
   * 加载文件系统图片 (fs:// 协议)
   */
  private async loadFileSystemImage(fsUrl: string): Promise<HTMLImageElement> {
    try {
      // 从 fs:// URL 中提取文件路径
      const filePath = fsUrl.replace('fs://', '')
      console.log(`加载文件系统图片: ${filePath}`)
      
      // 动态导入 imageStorage 以获取实际的 blob URL
      const { imageStorage } = await import('./imageStorage')
      
      // 获取实际的 blob URL
      const blobUrl = await imageStorage.getImageURL(filePath)
      
      // 使用 blob URL 加载图片
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        img.onload = () => {
          console.log(`文件系统图片加载成功: ${fsUrl} -> ${blobUrl}`)
          resolve(img)
        }
        
        img.onerror = (error) => {
          console.error(`文件系统图片加载失败: ${fsUrl}`, error)
          reject(new Error(`Failed to load filesystem image: ${fsUrl}`))
        }
        
        img.src = blobUrl
      })
    } catch (error) {
      console.error(`处理文件系统URL失败: ${fsUrl}`, error)
      throw new Error(`Failed to process filesystem URL: ${fsUrl}`)
    }
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

  /**
   * 检查URL是否为文件系统协议
   */
  static isFileSystemUrl(url: string): boolean {
    return url.startsWith('fs://')
  }

  /**
   * 创建文件系统URL
   */
  static createFileSystemUrl(filename: string): string {
    return `fs://${filename}`
  }

  /**
   * 从文件系统URL提取文件名
   */
  static extractFilenameFromFsUrl(fsUrl: string): string {
    if (!this.isFileSystemUrl(fsUrl)) {
      throw new Error(`Invalid filesystem URL: ${fsUrl}`)
    }
    return fsUrl.replace('fs://', '')
  }

  /**
   * 预加载文件系统图片
   */
  async preloadFileSystemImage(filename: string): Promise<void> {
    const fsUrl = ImageCacheManager.createFileSystemUrl(filename)
    return this.preloadImage(fsUrl)
  }

  /**
   * 批量预加载文件系统图片
   */
  async preloadFileSystemImages(filenames: string[]): Promise<void> {
    const fsUrls = filenames.map(filename => ImageCacheManager.createFileSystemUrl(filename))
    return this.preloadImages(fsUrls)
  }
}

// 导出单例实例
export const imageCache = ImageCacheManager.getInstance()
