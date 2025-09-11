<!--
  拼图乐 - 主应用组件
  采用现代化设计，集成导航和路由系统
-->

<script setup lang="ts">
import { computed, onMounted, watch, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLibraryStore } from './stores/library'
import { useSettingsStore } from './stores/settings'
import { GameViewModel } from './viewModels/game/gameViewModel'
import NotificationSystem from './components/NotificationSystem.vue'
import "@/assets/ark.css"

const router = useRouter()
const route = useRoute()

// Store
const libraryStore = useLibraryStore()
const settingsStore = useSettingsStore()

// 游戏视图管理器
const gameViewModel = GameViewModel.getInstance()

// 移动端侧栏状态
const isMobileSidebarOpen = ref(false)
const isMobile = ref(false)

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
  { name: 'Home', label: '主页', icon: '🏠', path: '/' },
  { name: 'Library', label: '素材库', icon: '📚', path: '/library' },
  { name: 'Editor', label: '编辑器', icon: '✏️', path: '/editor' },
  { name: 'Game', label: '游戏', icon: '🎮', path: '/game' },
  { name: 'Leaderboard', label: '排行榜', icon: '🏆', path: '/leaderboard' },
  { name: 'Achievements', label: '成就', icon: '🎖️', path: '/achievements' },
  { name: 'Settings', label: '设置', icon: '⚙️', path: '/settings' }
]

// 检测移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// 检测安卓设备
const isAndroid = ref(false)

// 检测设备类型
const detectDevice = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  isAndroid.value = userAgent.includes('android')
  console.log('设备检测:', { isAndroid: isAndroid.value, userAgent })
}

// 方法
const navigateTo = (path: string) => {
  router.push(path)
  // 移动端导航后关闭侧栏
  if (isMobile.value) {
    isMobileSidebarOpen.value = false
  }
}

// 切换移动端侧栏
const toggleMobileSidebar = () => {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value
}

// 关闭移动端侧栏
const closeMobileSidebar = () => {
  isMobileSidebarOpen.value = false
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
  
  // 检测设备类型
  detectDevice()
  
  // 确保素材库在应用启动时就被初始化
  libraryStore.initializeLibrary()
  
  // 应用主题
  applyTheme()
  
  // 监听系统主题变化
  watchSystemTheme()
  
  // 检测移动端
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

// 监听主题变化
watch(currentTheme, applyTheme, { immediate: true })

// 也监听store的直接变化
watch(() => settingsStore.settings.ui.theme, (newTheme) => {
  console.log('Store主题变化:', newTheme)
  applyTheme()
}, { immediate: true })

// 全局路由监听 - 处理游戏暂停逻辑
watch(() => route.path, (newPath, oldPath) => {
  console.log('路由变化:', { from: oldPath, to: newPath })
  gameViewModel.handleRouteChange(newPath, oldPath)
})
</script>

<template>
  <div class="app" :class="{ 'android-device': isAndroid }">
    <!-- 移动端顶部栏 -->
    <div v-if="isMobile" class="mobile-header">
      <button @click="toggleMobileSidebar" class="mobile-menu-btn">
        <span class="menu-icon">☰</span>
      </button>
      <div class="mobile-title">
        <img src="/logo.png" alt="拼图乐" class="app-logo-img" />
        <span class="app-name">拼图乐</span>
      </div>
      <div class="mobile-spacer"></div>
    </div>

    <!-- 移动端遮罩层 -->
    <div 
      v-if="isMobile && isMobileSidebarOpen" 
      class="mobile-overlay"
      @click="closeMobileSidebar"
    ></div>

    <!-- 侧边导航栏 -->
    <nav 
      class="sidebar"
      :class="{ 
        'mobile-sidebar': isMobile,
        'mobile-sidebar-open': isMobile && isMobileSidebarOpen 
      }"
    >
      <div class="sidebar-header">
        <img src="/logo.png" alt="拼图乐" class="app-logo-img" />
        <h1 class="app-title">拼图乐</h1>
        <p class="app-subtitle">Puzzle Fun</p>
      </div>
      
      <ul class="nav-menu">
        <li
          v-for="item in navItems"
          :key="item.name"
        >
          <button
            @click="navigateTo(item.path)"
            class="ark button borderless"
            :class="{ 'primary': currentRouteName === item.name }"
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
    <main class="main-content" :class="{ 'mobile-main': isMobile }">
      <router-view />
    </main>
    
    <!-- 通知系统 -->
    <NotificationSystem />
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

.app-logo-img {
  @apply w-12 h-12 mb-2 mx-auto;
  object-fit: contain;
}

.app-title {
  @apply text-xl font-bold mb-1;
  color: var(--text-primary);
}

.app-subtitle {
  @apply text-sm;
  color: var(--text-secondary);
}

.nav-icon {
  @apply text-xl mr-3;
}

.sidebar-footer {
  @apply p-4;
  border-top: 1px solid var(--border-color);
}

.nav-menu > li,
.nav-menu > li > button {
  width: 100%;
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
  color: #1f2937;
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
  @apply flex-1 overflow-auto;
  background-color: var(--bg-primary);
}

/* 移动端样式 */
.mobile-header {
  @apply flex items-center justify-between px-4 py-3 shadow-sm border-b;
  background-color: var(--bg-sidebar);
  border-bottom-color: var(--border-color);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 60px;
  /* 安卓端适配：确保header不会被状态栏遮挡 */
  padding-top: env(safe-area-inset-top, 0);
}

.mobile-menu-btn {
  @apply p-2 rounded-lg transition-colors duration-200;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.mobile-menu-btn:hover {
  background-color: var(--bg-secondary);
  opacity: 0.8;
}

.menu-icon {
  @apply text-xl;
}

.mobile-title {
  @apply flex items-center space-x-2;
}

.mobile-title .app-logo-img {
  @apply w-8 h-8;
}

.app-name {
  @apply text-lg font-bold;
  color: var(--text-primary);
}

.mobile-spacer {
  @apply w-10;
}

.mobile-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 z-40;
}

.sidebar.mobile-sidebar {
  @apply fixed top-0 left-0 h-full z-50 transform -translate-x-full transition-transform duration-300 ease-in-out;
  width: 280px;
  /* 安卓端适配：确保侧栏不会被header遮挡 */
  padding-top: calc(60px + env(safe-area-inset-top, 0));
}

.sidebar.mobile-sidebar-open {
  @apply translate-x-0;
}

.main-content.mobile-main {
  @apply pt-16;
  /* 安卓端适配：考虑状态栏高度 */
  padding-top: calc(4rem + env(safe-area-inset-top, 0));
}

/* 安卓端特殊适配 */
.android-device .mobile-header {
  /* 安卓端：增加额外的顶部padding */
  padding-top: calc(12px + env(safe-area-inset-top, 0));
  min-height: calc(60px + env(safe-area-inset-top, 0));
}

.android-device .sidebar.mobile-sidebar {
  /* 安卓端：确保侧栏不会被header遮挡 */
  padding-top: calc(72px + env(safe-area-inset-top, 0));
}

.android-device .main-content.mobile-main {
  /* 安卓端：确保主内容不会被header遮挡 */
  padding-top: calc(4.5rem + env(safe-area-inset-top, 0));
}

/* 使用CSS特性检测的备用方案 */
@supports (padding: max(0px)) {
  .mobile-header {
    /* 安卓端：使用max()确保最小padding */
    padding-top: max(env(safe-area-inset-top, 0), 12px);
  }
  
  .sidebar.mobile-sidebar {
    /* 安卓端：动态计算侧栏顶部padding */
    padding-top: max(calc(60px + env(safe-area-inset-top, 0)), 72px);
  }
  
  .main-content.mobile-main {
    /* 安卓端：动态计算主内容顶部padding */
    padding-top: max(calc(4rem + env(safe-area-inset-top, 0)), 4.5rem);
  }
}

/* 响应式断点 */
@media (max-width: 767px) {
  .app {
    @apply flex-col;
  }
  
  .sidebar:not(.mobile-sidebar) {
    @apply hidden;
  }
}

@media (min-width: 768px) {
  .mobile-header {
    @apply hidden;
  }
  
  .mobile-overlay {
    @apply hidden;
  }
  
  .sidebar.mobile-sidebar {
    @apply static transform-none;
    width: auto;
  }
  
  .main-content.mobile-main {
    @apply pt-0;
  }
}
</style>

