/**
 * 统一图像存储接口
 * 自动选择OPFS或内存存储作为回退方案
 */

import { opfsImageManager, memoryImageStorage, OPFSImageManager, MemoryImageStorage } from './opfsImageManager'

export interface ImageStorageInterface {
  storeImage(file: File, filename?: string): Promise<string>
  getImageURL(filename: string): Promise<string>
  deleteImage(filename: string): Promise<void>
  imageExists(filename: string): Promise<boolean>
  listImages(): Promise<string[]>
  clearURLCache(): void
  getStorageStats(): Promise<{
    totalFiles: number
    totalSize: number
    cachedURLs: number
  }>
}

export class UnifiedImageStorage implements ImageStorageInterface {
  private storage: OPFSImageManager | MemoryImageStorage
  private isUsingOPFS: boolean = false
  private initialized: boolean = false

  constructor() {
    // 先使用内存存储，异步初始化OPFS
    this.storage = memoryImageStorage
    this.initializeStorage()
  }

  /**
   * 异步初始化存储
   */
  private async initializeStorage(): Promise<void> {
    try {
      this.isUsingOPFS = await opfsImageManager.isOPFSAvailable()
      this.storage = this.isUsingOPFS ? opfsImageManager : memoryImageStorage
      
      console.log(`图像存储使用: ${this.isUsingOPFS ? 'OPFS' : '内存存储'}`)
    } catch (error) {
      console.error('存储初始化失败:', error)
      this.isUsingOPFS = false
      this.storage = memoryImageStorage
    }
    this.initialized = true
  }

  /**
   * 等待初始化完成
   */
  private async waitForInitialization(): Promise<void> {
    while (!this.initialized) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }

  /**
   * 检查当前使用的存储方式
   */
  async getStorageType(): Promise<'opfs' | 'memory'> {
    await this.waitForInitialization()
    return this.isUsingOPFS ? 'opfs' : 'memory'
  }

  /**
   * 存储图像文件
   */
  async storeImage(file: File, filename?: string): Promise<string> {
    await this.waitForInitialization()
    
    try {
      return await this.storage.storeImage(file, filename)
    } catch (error) {
      console.error('图像存储失败:', error)
      
      // 如果使用OPFS失败，尝试回退到内存存储
      if (this.isUsingOPFS) {
        console.log('回退到内存存储')
        this.storage = memoryImageStorage
        this.isUsingOPFS = false
        return await this.storage.storeImage(file, filename)
      }
      
      throw error
    }
  }

  /**
   * 获取图像URL
   */
  async getImageURL(filename: string): Promise<string> {
    await this.waitForInitialization()
    return await this.storage.getImageURL(filename)
  }

  /**
   * 删除图像
   */
  async deleteImage(filename: string): Promise<void> {
    await this.waitForInitialization()
    return await this.storage.deleteImage(filename)
  }

  /**
   * 检查图像是否存在
   */
  async imageExists(filename: string): Promise<boolean> {
    await this.waitForInitialization()
    return await this.storage.imageExists(filename)
  }

  /**
   * 获取所有图像文件名
   */
  async listImages(): Promise<string[]> {
    await this.waitForInitialization()
    return await this.storage.listImages()
  }

  /**
   * 清理URL缓存
   */
  clearURLCache(): void {
    // 这个方法不需要等待初始化，因为它是同步的
    this.storage.clearURLCache()
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<{
    totalFiles: number
    totalSize: number
    cachedURLs: number
    storageType: 'opfs' | 'memory'
  }> {
    await this.waitForInitialization()
    const stats = await this.storage.getStorageStats()
    return {
      ...stats,
      storageType: await this.getStorageType()
    }
  }

  /**
   * 从DataURI迁移到OPFS存储
   * @param dataUri - DataURI字符串
   * @param filename - 可选的文件名
   * @returns 存储的文件标识符
   */
  async migrateFromDataURI(dataUri: string, filename?: string): Promise<string> {
    try {
      // 将DataURI转换为File对象
      const file = this.dataURItoFile(dataUri, filename || 'migrated_image.jpg')
      
      // 存储到OPFS
      return await this.storeImage(file, filename)
    } catch (error) {
      console.error('从DataURI迁移失败:', error)
      throw error
    }
  }

  /**
   * 批量迁移图像从DataURI到OPFS
   * @param migrations - 迁移映射 {dataUri: filename}
   * @returns 成功迁移的文件名数组
   */
  async batchMigrateFromDataURI(migrations: Array<{dataUri: string, filename: string}>): Promise<string[]> {
    const results: string[] = []
    
    for (const {dataUri, filename} of migrations) {
      try {
        const storedFilename = await this.migrateFromDataURI(dataUri, filename)
        results.push(storedFilename)
        console.log(`迁移成功: ${filename}`)
      } catch (error) {
        console.error(`迁移失败: ${filename}`, error)
      }
    }
    
    return results
  }

  /**
   * 将DataURI转换为File对象
   */
  private dataURItoFile(dataURI: string, filename: string): File {
    // 解析DataURI
    const [header, data] = dataURI.split(',')
    const mimeMatch = header.match(/data:([^;]+)/)
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
    
    // 解码base64数据
    const binary = atob(data)
    const array = new Uint8Array(binary.length)
    
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i)
    }
    
    // 创建File对象
    return new File([array], filename, { type: mime })
  }

  /**
   * 压缩图像文件
   * @param file - 原始文件
   * @param quality - 压缩质量 (0-1)
   * @param maxWidth - 最大宽度
   * @param maxHeight - 最大高度
   * @returns 压缩后的文件
   */
  async compressImage(
    file: File, 
    quality: number = 0.8, 
    maxWidth: number = 1920, 
    maxHeight: number = 1080
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // 计算新的尺寸
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        // 设置画布尺寸
        canvas.width = width
        canvas.height = height

        // 绘制图像
        ctx?.drawImage(img, 0, 0, width, height)

        // 转换为Blob
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: blob.type,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            reject(new Error('图像压缩失败'))
          }
        }, file.type, quality)
      }

      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * 存储压缩后的图像
   * @param file - 原始文件
   * @param filename - 文件名
   * @param compressionOptions - 压缩选项
   * @returns 存储的文件标识符
   */
  async storeCompressedImage(
    file: File, 
    filename?: string, 
    compressionOptions?: {
      quality?: number
      maxWidth?: number
      maxHeight?: number
    }
  ): Promise<string> {
    const options = {
      quality: 0.85,
      maxWidth: 1920,
      maxHeight: 1080,
      ...compressionOptions
    }

    try {
      const compressedFile = await this.compressImage(
        file, 
        options.quality, 
        options.maxWidth, 
        options.maxHeight
      )
      
      console.log(`图像压缩: ${file.size} -> ${compressedFile.size} bytes (${(compressedFile.size/file.size*100).toFixed(1)}%)`)
      
      return await this.storeImage(compressedFile, filename)
    } catch (error) {
      console.warn('图像压缩失败，使用原始文件:', error)
      return await this.storeImage(file, filename)
    }
  }
}

// 导出单例实例
export const imageStorage = new UnifiedImageStorage()
