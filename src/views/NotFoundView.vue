<!--
  404 页面未找到视图
-->

<template>
  <div class="not-found-view">
    <div class="not-found-content">
      <div class="not-found-icon">🧩</div>
      <h1 class="not-found-title">404</h1>
      <h2 class="not-found-subtitle">页面走丢了</h2>
      <p class="not-found-description">
        抱歉，您访问的页面不存在。<br>
        可能是链接错误或页面已被移动。
      </p>
      <div class="not-found-actions">
        <button @click="goHome" class="action-btn primary">
          🏠 返回首页
        </button>
        <button @click="goBack" class="action-btn">
          ← 返回上页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.not-found-view {
  @apply min-h-screen bg-gray-50 flex items-center justify-center px-4;
}

/* 移动端适配：为固定头部栏预留空间 */
@media (max-width: 767px) {
  .not-found-view {
    min-height: calc(100vh - 60px);
  }
}

.not-found-content {
  @apply text-center max-w-md;
}

.not-found-icon {
  @apply text-8xl mb-6;
}

.not-found-title {
  @apply text-6xl font-bold text-gray-800 mb-4;
}

.not-found-subtitle {
  @apply text-2xl font-semibold text-gray-600 mb-4;
}

.not-found-description {
  @apply text-gray-500 mb-8 leading-relaxed;
}

.not-found-actions {
  @apply flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4;
}

.action-btn {
  @apply px-6 py-3 text-sm font-medium rounded-lg transition-colors duration-200;
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.action-btn.primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}
</style>
