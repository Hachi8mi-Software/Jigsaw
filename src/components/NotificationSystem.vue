<template>
  <Teleport to="body">
    <!-- 通知系统 -->
    <div class="notification-container fixed top-4 right-4 z-50 space-y-2 mobile-notification-container">
      <TransitionGroup name="notification" tag="div">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="[
            'notification-item',
            'max-w-sm',
            'p-4',
            'rounded-lg',
            'shadow-lg',
            'border',
            'cursor-pointer',
            'transform',
            'transition-all',
            'duration-300',
            'hover:scale-105',
            getNotificationClasses(notification.type)
          ]"
          @click="removeNotification(notification.id)"
        >
          <div class="flex items-start">
            <div class="flex-shrink-0 mr-3">
              <svg v-if="notification.type === 'success'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <svg v-else-if="notification.type === 'error'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <svg v-else-if="notification.type === 'warning'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-semibold">{{ notification.title }}</h4>
              <p v-if="notification.message" class="text-sm mt-1 opacity-90">
                {{ notification.message }}
              </p>
            </div>
            <button
              @click.stop="removeNotification(notification.id)"
              class="flex-shrink-0 ml-2 text-current opacity-60 hover:opacity-100 transition-opacity"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- 确认对话框 -->
    <TransitionGroup name="dialog" tag="div">
      <div
        v-for="dialog in confirmDialogs"
        :key="dialog.id"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <!-- 背景遮罩 -->
        <div 
          class="absolute inset-0 bg-black bg-opacity-50"
          @click="dialog.onCancel?.()"
        ></div>
        
        <!-- 对话框 -->
        <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <!-- 图标 -->
          <div class="flex items-center mb-4">
            <div class="flex-shrink-0 mr-3">
              <svg v-if="dialog.type === 'warning'" class="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <svg v-else-if="dialog.type === 'danger'" class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <svg v-else class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ dialog.title }}
            </h3>
          </div>
          
          <!-- 消息内容 -->
          <div class="mb-6">
            <p class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {{ dialog.message }}
            </p>
          </div>
          
          <!-- 按钮 -->
          <div class="flex justify-end space-x-3">
            <button
              @click="dialog.onCancel?.()"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {{ dialog.cancelText }}
            </button>
            <button
              @click="dialog.onConfirm()"
              :class="[
                'px-4 py-2 text-sm font-medium text-white rounded-md transition-colors',
                dialog.type === 'danger' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : dialog.type === 'warning'
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              ]"
            >
              {{ dialog.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNotificationStore } from '../stores/notification'

const notificationStore = useNotificationStore()

const notifications = computed(() => notificationStore.notifications)
const confirmDialogs = computed(() => notificationStore.confirmDialogs)

const removeNotification = (id: string) => {
  notificationStore.removeNotification(id)
}

const getNotificationClasses = (type: string) => {
  const baseClasses = 'bg-white dark:bg-gray-800'
  
  switch (type) {
    case 'success':
      return `${baseClasses} border-green-200 dark:border-green-700 text-green-800 dark:text-green-200`
    case 'error':
      return `${baseClasses} border-red-200 dark:border-red-700 text-red-800 dark:text-red-200`
    case 'warning':
      return `${baseClasses} border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200`
    case 'info':
      return `${baseClasses} border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200`
    default:
      return `${baseClasses} border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200`
  }
}
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}

/* 对话框动画 */
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.3s ease;
}

.dialog-enter-from {
  opacity: 0;
}

.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .relative {
  transform: scale(0.9) translateY(-20px);
}

.dialog-leave-to .relative {
  transform: scale(0.9) translateY(-20px);
}

.dialog-enter-active .relative,
.dialog-leave-active .relative {
  transition: transform 0.3s ease;
}

/* 移动端通知位置调整 */
@media (max-width: 767px) {
  .mobile-notification-container {
    top: 5rem; /* 为移动端header预留空间 */
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
  
  .mobile-notification-container .notification-item {
    max-width: none;
  }
}

/* 移动端横屏时的通知位置 */
@media (max-width: 767px) and (orientation: landscape) {
  .mobile-notification-container {
    top: 4rem; /* 横屏时header较矮 */
  }
}
</style>
