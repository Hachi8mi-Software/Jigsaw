<!--
  拼图乐 - 主应用组件
  采用现代化设计，集成导航和路由系统
-->

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 计算当前路由名称
const currentRouteName = computed(() => route.name as string)

// 导航菜单项
const navItems = [
  { name: 'Library', label: '素材库', icon: '📚', path: '/library' },
  { name: 'Editor', label: '编辑器', icon: '✏️', path: '/editor' },
  { name: 'Game', label: '游戏', icon: '🎮', path: '/game' },
  { name: 'Achievements', label: '成就', icon: '🏆', path: '/achievements' },
  { name: 'Settings', label: '设置', icon: '⚙️', path: '/settings' }
]

// 方法
const navigateTo = (path: string) => {
  router.push(path)
}

// 生命周期
onMounted(() => {
  // 应用初始化
  console.log('拼图乐应用已启动')
})
</script>

<template>
  <div class="app">
    <!-- 侧边导航栏 -->
    <nav class="sidebar">
      <div class="sidebar-header">
        <div class="app-logo">🧩</div>
        <h1 class="app-title">拼图乐</h1>
        <p class="app-subtitle">Puzzle Fun</p>
      </div>
      
      <ul class="nav-menu">
        <li
          v-for="item in navItems"
          :key="item.name"
          class="nav-item"
        >
          <button
            @click="navigateTo(item.path)"
            class="nav-link"
            :class="{ 'active': currentRouteName === item.name }"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </button>
        </li>
      </ul>
      
      <div class="sidebar-footer">
        <div class="version-info">
          <span class="version-text">v1.0.0</span>
        </div>
      </div>
    </nav>

    <!-- 主内容区域 -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app {
  @apply flex h-screen bg-gray-100;
}

.sidebar {
  @apply w-64 bg-white shadow-lg flex flex-col;
}

.sidebar-header {
  @apply p-6 text-center border-b border-gray-200;
}

.app-logo {
  @apply text-4xl mb-2;
}

.app-title {
  @apply text-xl font-bold text-gray-800 mb-1;
}

.app-subtitle {
  @apply text-sm text-gray-500;
}

.nav-menu {
  @apply flex-1 py-4;
}

.nav-item {
  @apply mb-1;
}

.nav-link {
  @apply w-full flex items-center px-6 py-3 text-left;
  @apply text-gray-700 hover:bg-gray-100 transition-colors duration-200;
}

.nav-link.active {
  @apply bg-blue-50 text-blue-600 border-r-2 border-blue-600;
}

.nav-icon {
  @apply text-xl mr-3;
}

.nav-label {
  @apply font-medium;
}

.sidebar-footer {
  @apply p-4 border-t border-gray-200;
}

.version-info {
  @apply text-center;
}

.version-text {
  @apply text-xs text-gray-400;
}

.main-content {
  @apply flex-1 overflow-hidden;
}
</style>

