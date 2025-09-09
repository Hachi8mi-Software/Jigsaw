/**
 * OPFS（Origin Private File System）图像存储管理器
 * 使用浏览器的私有文件系统来存储图像数据，替代DataURI方式
 */

export class OPFSImageManager {
  private static instance: OPFSImageManager
  private opfsRoot: FileSystemDirectoryHandle | null = null
  private imagesDir: FileSystemDirectoryHandle | null = null
  private urlCache = new Map<string, string>() // 文件名 -> blob URL 的缓存

  private constructor() {
    this.initializeOPFS()
  }

  static getInstance(): OPFSImageManager {
    if (!OPFSImageManager.instance) {
      OPFSImageManager.instance = new OPFSImageManager()
    }
    return OPFSImageManager.instance
  }

  initialized: boolean = false

  /**
   * 初始化OPFS
   */
  private async initializeOPFS(): Promise<void> {
    try {
      if ('navigator' in globalThis && 'storage' in navigator && 'getDirectory' in navigator.storage) {
        this.opfsRoot = await navigator.storage.getDirectory()
        
        // 创建images目录
        this.imagesDir = await this.opfsRoot.getDirectoryHandle('images', { create: true })
        console.log('OPFS图像存储初始化成功')
      } else {
        console.warn('当前浏览器不支持OPFS，将回退到内存存储')
      }
    } catch (error) {
      console.error('OPFS初始化失败:', error)
    }
    this.initialized = true
  }

  /**
   * 检查OPFS是否可用
   */
  async isOPFSAvailable(): Promise<boolean> {
    // 等待初始化完成
    while (!this.initialized) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    return this.opfsRoot !== null && this.imagesDir !== null
  }

  /**
   * 存储图像文件到OPFS
   * @param file - 要存储的图像文件
   * @param filename - 文件名（如果不提供，将生成唯一文件名）
   * @returns 存储的文件标识符
   */
  async storeImage(file: File, filename?: string): Promise<string> {
    if (!(await this.isOPFSAvailable())) {
      throw new Error('OPFS不可用')
    }

    try {
      // 生成文件名
      if (!filename) {
        const timestamp = Date.now()
        const extension = this.getFileExtension(file.name) || 'jpg'
        filename = `image_${timestamp}.${extension}`
      }

      // 创建文件句柄
      const fileHandle = await this.imagesDir!.getFileHandle(filename, { create: true })
      
      // 创建可写流并写入数据
      const writable = await fileHandle.createWritable()
      await writable.write(file)
      await writable.close()

      console.log(`图像已存储到OPFS: ${filename}`)
      return filename
    } catch (error) {
      console.error('存储图像到OPFS失败:', error)
      throw error
    }
  }

  /**
   * 从OPFS读取图像并创建Blob URL
   * @param filename - 文件名
   * @returns Blob URL
   */
  async getImageURL(filename: string): Promise<string> {
    // 检查缓存
    if (this.urlCache.has(filename)) {
      return this.urlCache.get(filename)!
    }

    if (!(await this.isOPFSAvailable())) {
      throw new Error('OPFS不可用')
    }

    try {
      // 获取文件句柄
      const fileHandle = await this.imagesDir!.getFileHandle(filename)
      
      // 读取文件
      const file = await fileHandle.getFile()
      
      // 创建Blob URL
      const blobURL = URL.createObjectURL(file)
      
      // 缓存URL
      this.urlCache.set(filename, blobURL)
      
      console.log(`从OPFS读取图像: ${filename}`)
      return blobURL
    } catch (error) {
      console.error(`从OPFS读取图像失败: ${filename}`, error)
      throw error
    }
  }

  /**
   * 删除OPFS中的图像文件
   * @param filename - 文件名
   */
  async deleteImage(filename: string): Promise<void> {
    if (!(await this.isOPFSAvailable())) {
      throw new Error('OPFS不可用')
    }

    try {
      // 清理URL缓存
      if (this.urlCache.has(filename)) {
        URL.revokeObjectURL(this.urlCache.get(filename)!)
        this.urlCache.delete(filename)
      }

      // 删除文件
      await this.imagesDir!.removeEntry(filename)
      console.log(`已删除OPFS图像: ${filename}`)
    } catch (error) {
      console.error(`删除OPFS图像失败: ${filename}`, error)
      throw error
    }
  }

  /**
   * 检查图像文件是否存在
   * @param filename - 文件名
   * @returns 是否存在
   */
  async imageExists(filename: string): Promise<boolean> {
    if (!(await this.isOPFSAvailable())) {
      return false
    }

    try {
      await this.imagesDir!.getFileHandle(filename)
      return true
    } catch {
      return false
    }
  }

  /**
   * 获取所有存储的图像文件名
   * @returns 文件名数组
   */
  async listImages(): Promise<string[]> {
    if (!(await this.isOPFSAvailable())) {
      return []
    }

    try {
      const filenames: string[] = []
      
      // @ts-ignore - OPFS API可能还在实验阶段
      for await (const [name, handle] of this.imagesDir!.entries()) {
        if (handle.kind === 'file') {
          filenames.push(name)
        }
      }
      
      return filenames
    } catch (error) {
      console.error('获取OPFS图像列表失败:', error)
      return []
    }
  }

  /**
   * 清理所有缓存的URL
   */
  clearURLCache(): void {
    for (const url of this.urlCache.values()) {
      URL.revokeObjectURL(url)
    }
    this.urlCache.clear()
    console.log('OPFS URL缓存已清理')
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<{
    totalFiles: number
    totalSize: number
    cachedURLs: number
  }> {
    if (!(await this.isOPFSAvailable())) {
      return { totalFiles: 0, totalSize: 0, cachedURLs: 0 }
    }

    try {
      const filenames = await this.listImages()
      let totalSize = 0

      for (const filename of filenames) {
        try {
          const fileHandle = await this.imagesDir!.getFileHandle(filename)
          const file = await fileHandle.getFile()
          totalSize += file.size
        } catch (error) {
          console.warn(`无法获取文件大小: ${filename}`, error)
        }
      }

      return {
        totalFiles: filenames.length,
        totalSize,
        cachedURLs: this.urlCache.size
      }
    } catch (error) {
      console.error('获取存储统计信息失败:', error)
      return { totalFiles: 0, totalSize: 0, cachedURLs: 0 }
    }
  }

  /**
   * 清理过期的图像文件（可选：基于创建时间）
   * @param maxAgeMs - 最大年龄（毫秒）
   */
  async cleanupOldImages(maxAgeMs: number): Promise<void> {
    if (!(await this.isOPFSAvailable())) {
      return
    }

    try {
      const filenames = await this.listImages()
      const now = Date.now()

      for (const filename of filenames) {
        try {
          const fileHandle = await this.imagesDir!.getFileHandle(filename)
          const file = await fileHandle.getFile()
          
          if (now - file.lastModified > maxAgeMs) {
            await this.deleteImage(filename)
            console.log(`已清理过期图像: ${filename}`)
          }
        } catch (error) {
          console.warn(`清理图像时出错: ${filename}`, error)
        }
      }
    } catch (error) {
      console.error('清理过期图像失败:', error)
    }
  }

  /**
   * 从File对象中获取文件扩展名
   */
  private getFileExtension(filename: string): string | null {
    const lastDot = filename.lastIndexOf('.')
    if (lastDot === -1) return null
    return filename.slice(lastDot + 1).toLowerCase()
  }

  /**
   * 生成唯一的文件名
   */
  generateUniqueFilename(originalName?: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    
    if (originalName) {
      const extension = this.getFileExtension(originalName) || 'jpg'
      return `${timestamp}_${random}.${extension}`
    }
    
    return `image_${timestamp}_${random}.jpg`
  }

  /**
   * 销毁实例并清理资源
   */
  destroy(): void {
    this.clearURLCache()
    this.opfsRoot = null
    this.imagesDir = null
  }
}

// 导出单例实例
export const opfsImageManager = OPFSImageManager.getInstance()

/**
 * OPFS回退策略：如果OPFS不可用，使用内存存储
 */
export class MemoryImageStorage {
  private imageStore = new Map<string, File>()
  private urlCache = new Map<string, string>()

  async storeImage(file: File, filename?: string): Promise<string> {
    if (!filename) {
      filename = `memory_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    }
    
    this.imageStore.set(filename, file)
    return filename
  }

  async getImageURL(filename: string): Promise<string> {
    if (this.urlCache.has(filename)) {
      return this.urlCache.get(filename)!
    }

    const file = this.imageStore.get(filename)
    if (!file) {
      throw new Error(`图像文件不存在: ${filename}`)
    }

    const blobURL = URL.createObjectURL(file)
    this.urlCache.set(filename, blobURL)
    return blobURL
  }

  async deleteImage(filename: string): Promise<void> {
    if (this.urlCache.has(filename)) {
      URL.revokeObjectURL(this.urlCache.get(filename)!)
      this.urlCache.delete(filename)
    }
    this.imageStore.delete(filename)
  }

  async imageExists(filename: string): Promise<boolean> {
    return this.imageStore.has(filename)
  }

  async listImages(): Promise<string[]> {
    return Array.from(this.imageStore.keys())
  }

  clearURLCache(): void {
    for (const url of this.urlCache.values()) {
      URL.revokeObjectURL(url)
    }
    this.urlCache.clear()
  }

  async getStorageStats(): Promise<{
    totalFiles: number
    totalSize: number
    cachedURLs: number
  }> {
    let totalSize = 0
    for (const file of this.imageStore.values()) {
      totalSize += file.size
    }

    return {
      totalFiles: this.imageStore.size,
      totalSize,
      cachedURLs: this.urlCache.size
    }
  }
}

// 导出内存存储实例
export const memoryImageStorage = new MemoryImageStorage()
