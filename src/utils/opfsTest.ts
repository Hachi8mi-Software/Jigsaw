/**
 * OPFS图像存储测试
 * 用于验证OPFS功能是否正常工作
 */

import { imageStorage } from '../utils/imageStorage'

export class OPFSTestManager {
  /**
   * 运行OPFS功能测试
   */
  public static async runTests(): Promise<void> {
    console.log('🧪 开始OPFS图像存储测试...')
    
    try {
      // 测试存储类型
      await this.testStorageType()
      
      // 测试基本存储功能
      await this.testBasicStorage()
      
      // 测试DataURI迁移
      await this.testDataURIMigration()
      
      // 测试存储统计
      await this.testStorageStats()
      
      console.log('✅ 所有OPFS测试通过！')
    } catch (error) {
      console.error('❌ OPFS测试失败:', error)
    }
  }

  /**
   * 测试存储类型
   */
  private static async testStorageType(): Promise<void> {
    console.log('📋 测试存储类型...')
    
    const storageType = await imageStorage.getStorageType()
    console.log(`存储类型: ${storageType}`)
    
    if (storageType === 'opfs') {
      console.log('✅ 使用OPFS存储')
    } else {
      console.log('⚠️ 回退到内存存储')
    }
  }

  /**
   * 测试基本存储功能
   */
  private static async testBasicStorage(): Promise<void> {
    console.log('💾 测试基本存储功能...')
    
    // 创建一个测试图片文件
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      ctx.fillStyle = '#ff0000'
      ctx.fillRect(0, 0, 50, 50)
      ctx.fillStyle = '#00ff00'
      ctx.fillRect(50, 0, 50, 50)
      ctx.fillStyle = '#0000ff'
      ctx.fillRect(0, 50, 50, 50)
      ctx.fillStyle = '#ffff00'
      ctx.fillRect(50, 50, 50, 50)
    }
    
    // 转换为Blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(resolve as any, 'image/png')
    })
    
    if (!blob) {
      throw new Error('无法创建测试图片')
    }
    
    const testFile = new File([blob], 'test_image.png', { type: 'image/png' })
    
    // 存储测试
    console.log('存储测试图片...')
    const filename = await imageStorage.storeImage(testFile, 'opfs_test.png')
    console.log(`存储成功，文件名: ${filename}`)
    
    // 读取测试
    console.log('读取测试图片...')
    const imageURL = await imageStorage.getImageURL(filename)
    console.log(`读取成功，URL: ${imageURL.substring(0, 50)}...`)
    
    // 验证图片可以加载
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = imageURL
    })
    console.log(`图片验证成功，尺寸: ${img.width}x${img.height}`)
    
    // 清理测试
    await imageStorage.deleteImage(filename)
    console.log('清理测试文件完成')
  }

  /**
   * 测试DataURI迁移
   */
  private static async testDataURIMigration(): Promise<void> {
    console.log('🔄 测试DataURI迁移...')
    
    // 创建一个测试DataURI
    const canvas = document.createElement('canvas')
    canvas.width = 50
    canvas.height = 50
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      ctx.fillStyle = '#ff00ff'
      ctx.fillRect(0, 0, 50, 50)
    }
    
    const dataURI = canvas.toDataURL('image/png')
    console.log(`测试DataURI长度: ${dataURI.length}`)
    
    // 迁移测试
    console.log('执行DataURI迁移...')
    const filename = await imageStorage.migrateFromDataURI(dataURI, 'migrated_test.png')
    console.log(`迁移成功，文件名: ${filename}`)
    
    // 验证迁移结果
    const imageURL = await imageStorage.getImageURL(filename)
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = imageURL
    })
    console.log(`迁移验证成功，尺寸: ${img.width}x${img.height}`)
    
    // 清理测试
    await imageStorage.deleteImage(filename)
    console.log('清理迁移测试文件完成')
  }

  /**
   * 测试存储统计
   */
  private static async testStorageStats(): Promise<void> {
    console.log('📊 测试存储统计...')
    
    const stats = await imageStorage.getStorageStats()
    console.log('存储统计信息:', {
      总文件数: stats.totalFiles,
      总大小: `${(stats.totalSize / 1024).toFixed(2)} KB`,
      缓存URL数: stats.cachedURLs,
      存储类型: stats.storageType
    })
  }

  /**
   * 测试压缩功能
   */
  public static async testCompression(): Promise<void> {
    console.log('🗜️ 测试图片压缩功能...')
    
    // 创建一个较大的测试图片
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // 创建渐变背景
      const gradient = ctx.createLinearGradient(0, 0, 800, 600)
      gradient.addColorStop(0, '#ff0000')
      gradient.addColorStop(0.5, '#00ff00')
      gradient.addColorStop(1, '#0000ff')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 800, 600)
    }
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(resolve as any, 'image/jpeg', 1.0)
    })
    
    if (!blob) {
      throw new Error('无法创建测试图片')
    }
    
    const originalFile = new File([blob], 'large_test.jpg', { type: 'image/jpeg' })
    console.log(`原始文件大小: ${(originalFile.size / 1024).toFixed(2)} KB`)
    
    // 测试压缩存储
    console.log('执行压缩存储...')
    const filename = await imageStorage.storeCompressedImage(originalFile, 'compressed_test.jpg', {
      quality: 0.8,
      maxWidth: 400,
      maxHeight: 300
    })
    
    // 获取压缩后的统计信息
    const stats = await imageStorage.getStorageStats()
    console.log(`压缩存储完成，文件名: ${filename}`)
    
    // 验证压缩结果
    const imageURL = await imageStorage.getImageURL(filename)
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = imageURL
    })
    console.log(`压缩结果验证成功，尺寸: ${img.width}x${img.height}`)
    
    // 清理测试
    await imageStorage.deleteImage(filename)
    console.log('清理压缩测试文件完成')
  }
}

// 在开发环境中自动运行测试
if (process.env.NODE_ENV === 'development') {
  // 延迟执行，确保DOM已加载
  setTimeout(() => {
    OPFSTestManager.runTests()
  }, 1000)
}
