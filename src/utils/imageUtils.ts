/**
 * 图片资源工具类
 * 负责处理图片路径和资源管理
 */

import { getImagePath as getImagePathFromConfig } from '../config/app'

/**
 * 获取图片资源的完整路径
 * 支持开发环境和生产环境的不同base路径
 * @param imageName 图片文件名
 * @returns 完整的图片URL路径
 */
export function getImagePath(imageName: string): string {
  return getImagePathFromConfig(imageName)
}

/**
 * 验证图片URL是否有效
 * @param imageUrl 图片URL
 * @returns Promise<boolean> 图片是否有效
 */
export async function validateImageUrl(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

/**
 * 获取图片的尺寸信息
 * @param imageUrl 图片URL
 * @returns Promise<{width: number, height: number} | null> 图片尺寸
 */
export function getImageDimensions(imageUrl: string): Promise<{ width: number, height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      resolve(null)
    }
    img.src = imageUrl
  })
}

export async function compressImage(
  file: File,
  quality: number = 0.8,
  maxWidth?: number,
  maxHeight?: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // 计算新的尺寸
      let { width, height } = img
      const maxW = maxWidth || width
      const maxH = maxHeight || height

      if (width > maxW || height > maxH) {
        const ratio = Math.min(maxW / width, maxH / height)
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