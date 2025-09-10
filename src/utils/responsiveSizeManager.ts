/**
 * 响应式尺寸管理器
 * 负责处理窗口大小变化时的拼图尺寸重新计算
 */

import { ref, onMounted, onUnmounted, readonly } from 'vue'

class ResponsiveSizeManager {
  private static instance: ResponsiveSizeManager
  private listeners: Set<() => void> = new Set()
  private resizeHandler: (() => void) | null = null

  static getInstance(): ResponsiveSizeManager {
    if (!ResponsiveSizeManager.instance) {
      ResponsiveSizeManager.instance = new ResponsiveSizeManager()
    }
    return ResponsiveSizeManager.instance
  }

  private constructor() {
    this.setupResizeListener()
  }

  private setupResizeListener() {
    this.resizeHandler = () => {
      // 防抖处理，避免频繁触发
      setTimeout(() => {
        this.notifyListeners()
      }, 100)
    }
    
    window.addEventListener('resize', this.resizeHandler)
  }

  /**
   * 添加尺寸变化监听器
   */
  addListener(callback: () => void): () => void {
    this.listeners.add(callback)
    
    // 返回移除监听器的函数
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('响应式尺寸监听器执行失败:', error)
      }
    })
  }

  /**
   * 销毁管理器
   */
  destroy() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
      this.resizeHandler = null
    }
    this.listeners.clear()
  }
}

/**
 * 响应式尺寸Hook
 * 在组件中使用，自动处理窗口大小变化
 */
export function useResponsiveSize() {
  const sizeManager = ResponsiveSizeManager.getInstance()
  const isResizing = ref(false)

  const handleResize = () => {
    isResizing.value = true
    // 延迟重置，给组件时间完成重新计算
    setTimeout(() => {
      isResizing.value = false
    }, 200)
  }

  onMounted(() => {
    const removeListener = sizeManager.addListener(handleResize)
    
    onUnmounted(() => {
      removeListener()
    })
  })

  return {
    isResizing: readonly(isResizing)
  }
}

export { ResponsiveSizeManager }
