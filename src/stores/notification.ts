import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export interface ConfirmDialog {
  id: string
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'danger' | 'info'
  onConfirm: () => void
  onCancel?: () => void
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])
  const confirmDialogs = ref<ConfirmDialog[]>([])

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      id,
      duration: 4000, // 默认4秒
      ...notification
    }
    
    notifications.value.push(newNotification)
    
    // 自动移除通知
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
    
    return id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearAll = () => {
    notifications.value = []
  }

  // 确认对话框方法
  const showConfirm = (options: Omit<ConfirmDialog, 'id' | 'onConfirm' | 'onCancel'>): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      
      const dialog: ConfirmDialog = {
        id,
        confirmText: '确定',
        cancelText: '取消',
        type: 'warning',
        ...options,
        onConfirm: () => {
          removeConfirmDialog(id)
          resolve(true)
        },
        onCancel: () => {
          removeConfirmDialog(id)
          resolve(false)
        }
      }
      
      confirmDialogs.value.push(dialog)
    })
  }

  const removeConfirmDialog = (id: string) => {
    const index = confirmDialogs.value.findIndex(d => d.id === id)
    if (index > -1) {
      confirmDialogs.value.splice(index, 1)
    }
  }

  // 便捷方法
  const success = (title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'success', title, message, duration })
  }

  const error = (title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'error', title, message, duration })
  }

  const warning = (title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'warning', title, message, duration })
  }

  const info = (title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'info', title, message, duration })
  }

  return {
    notifications,
    confirmDialogs,
    addNotification,
    removeNotification,
    clearAll,
    showConfirm,
    removeConfirmDialog,
    success,
    error,
    warning,
    info
  }
})
