<!--
  拼图乐 - 主应用组件
  采用现代化设计，集成导航和路由系统
-->

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLibraryStore } from './stores/library'
import { useSettingsStore } from './stores/settings'

const router = useRouter()
const route = useRoute()

// Store
const libraryStore = useLibraryStore()
const settingsStore = useSettingsStore()

// 计算当前路由名称
const currentRouteName = computed(() => route.name as string)

// 当前主题计算属性
const currentTheme = computed(() => {
  const theme = settingsStore.settings.ui.theme
  if (theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
})

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

// 主题切换方法
const toggleTheme = () => {
  const currentTheme = settingsStore.settings.ui.theme
  if (currentTheme === 'auto') {
    settingsStore.settings.ui.theme = 'light'
  } else if (currentTheme === 'light') {
    settingsStore.settings.ui.theme = 'dark'
  } else {
    settingsStore.settings.ui.theme = 'auto'
  }
  settingsStore.saveSettings()
}

// 获取主题图标
const getThemeIcon = () => {
  const theme = settingsStore.settings.ui.theme
  if (theme === 'auto') return '🖥️'
  if (theme === 'light') return '☀️'
  return '🌙'
}

// 获取主题文本
const getThemeText = () => {
  const theme = settingsStore.settings.ui.theme
  if (theme === 'auto') return '自动'
  if (theme === 'light') return '浅色'
  return '深色'
}

// 获取主题提示
const getThemeTooltip = () => {
  const theme = settingsStore.settings.ui.theme
  if (theme === 'auto') return '当前：跟随系统 (点击切换到浅色)'
  if (theme === 'light') return '当前：浅色主题 (点击切换到深色)'
  return '当前：深色主题 (点击切换到自动)'
}

// 应用主题
const applyTheme = () => {
  const theme = currentTheme.value
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('app-theme', theme)
  console.log('主题已切换到:', theme, '| DOM data-theme:', document.documentElement.getAttribute('data-theme'))
}

// 监听系统主题变化
const watchSystemTheme = () => {
  if (settingsStore.settings.ui.theme === 'auto') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', applyTheme)
  }
}

// 生命周期
onMounted(() => {
  // 应用初始化
  console.log('拼图乐应用已启动')
  
  // 确保素材库在应用启动时就被初始化
  libraryStore.initializeLibrary()
  
  // 应用主题
  applyTheme()
  
  // 监听系统主题变化
  watchSystemTheme()
})

// 监听主题变化
watch(currentTheme, applyTheme, { immediate: true })

// 也监听store的直接变化
watch(() => settingsStore.settings.ui.theme, (newTheme) => {
  console.log('Store主题变化:', newTheme)
  applyTheme()
}, { immediate: true })
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
        <!-- 主题切换按钮 -->
        <div class="theme-toggle-container">
          <button 
            @click="toggleTheme"
            class="theme-toggle-btn"
            :title="getThemeTooltip()"
          >
            <span class="theme-icon">{{ getThemeIcon() }}</span>
            <span class="theme-text">{{ getThemeText() }}</span>
          </button>
        </div>
        
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
  @apply flex h-screen;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.sidebar {
  @apply w-64 shadow-lg flex flex-col;
  background-color: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
}

.sidebar-header {
  @apply p-6 text-center;
  border-bottom: 1px solid var(--border-color);
}

.app-logo {
  @apply text-4xl mb-2;
}

.app-title {
  @apply text-xl font-bold mb-1;
  color: var(--text-primary);
}

.app-subtitle {
  @apply text-sm;
  color: var(--text-secondary);
}

.nav-menu {
  @apply flex-1 py-4;
}

.nav-item {
  @apply mb-1;
}

.nav-link {
  @apply w-full flex items-center px-6 py-3 text-left;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.nav-link:hover {
  background-color: var(--bg-secondary);
}

.nav-link.active {
  background-color: var(--bg-secondary);
  color: var(--text-accent);
  border-right: 2px solid var(--text-accent);
}

.nav-icon {
  @apply text-xl mr-3;
}

.nav-label {
  @apply font-medium;
}

.sidebar-footer {
  @apply p-4;
  border-top: 1px solid var(--border-color);
}

/* 主题切换按钮样式 */
.theme-toggle-container {
  @apply mb-4;
}

.theme-toggle-btn {
  @apply w-full flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-200;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.theme-toggle-btn:hover {
  background-color: var(--text-accent);
  color: #ffffff;
  border-color: var(--text-accent);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.theme-toggle-btn:active {
  transform: translateY(0);
}

.theme-icon {
  @apply text-lg mr-2;
}

.theme-text {
  @apply font-medium text-sm;
}

.version-info {
  @apply text-center;
}

.version-text {
  @apply text-xs;
  color: var(--text-secondary);
}

.main-content {
  @apply flex-1 overflow-hidden;
  background-color: var(--bg-primary);
}
</style>

