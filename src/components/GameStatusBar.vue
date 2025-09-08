<!--
  游戏状态栏组件
  显示游戏进度、时间、步数等信息
-->

<template>
  <div class="game-status-bar">
    <!-- 移动端折叠状态栏 -->
    <div v-if="isMobile" class="mobile-status-bar">
      <div class="mobile-status-header">
        <div class="puzzle-title-mobile">
          <h2>{{ puzzleName }}</h2>
          <span class="puzzle-dimensions">{{ gridRows }}x{{ gridCols }}</span>
        </div>
        <div class="mobile-header-controls">
          <button 
            @click="togglePause"
            class="mobile-pause-btn"
            :class="{ 'paused': isPaused }"
          >
            <span class="control-icon">{{ isPaused ? '▶️' : '⏸️' }}</span>
          </button>
          <button @click="toggleMobileStats" class="mobile-stats-toggle">
            <span class="toggle-icon">{{ showMobileStats ? '▼' : '▲' }}</span>
          </button>
        </div>
      </div>
      
      <!-- 可折叠的统计信息 -->
      <div v-if="showMobileStats" class="mobile-stats-content">
        <div class="mobile-stats-grid">
          <div class="mobile-stat-item">
            <span class="stat-label">进度</span>
            <span class="stat-value">{{ completionPercentage }}%</span>
            <small class="stat-detail">({{ placedPieces }}/{{ totalPieces }})</small>
          </div>
          <div class="mobile-stat-item">
            <span class="stat-label">时间</span>
            <span class="stat-value">{{ formatTime(elapsedTime) }}</span>
          </div>
          <div class="mobile-stat-item">
            <span class="stat-label">步数</span>
            <span class="stat-value">{{ moveCount }}</span>
          </div>
          <div class="mobile-stat-item">
            <span class="stat-label">难度</span>
            <span class="stat-value">{{ difficulty }}/5</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 桌面端状态栏 -->
    <div v-else class="desktop-status-bar">
      <div class="status-left">
        <div class="puzzle-title">
          <h2>{{ puzzleName }}</h2>
          <span class="puzzle-dimensions">{{ gridRows }}x{{ gridCols }} = {{ totalPieces }} 块</span>
        </div>
      </div>
      
      <div class="status-center">
        <div class="game-stats">
          <div class="stat-item">
            <span class="stat-label">进度</span>
            <span class="stat-value">{{ completionPercentage }}%</span>
            <small class="stat-detail">({{ placedPieces }}/{{ totalPieces }})</small>
          </div>
          <div class="stat-item">
            <span class="stat-label">时间</span>
            <span class="stat-value">{{ formatTime(elapsedTime) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">步数</span>
            <span class="stat-value">{{ moveCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">难度</span>
            <span class="stat-value">{{ difficulty }}/5</span>
          </div>
        </div>
      </div>
      
      <div class="status-right">
        <button 
          @click="togglePause"
          class="desktop-pause-btn"
          :class="{ 'paused': isPaused }"
        >
          <span class="control-icon">{{ isPaused ? '▶️' : '⏸️' }}</span>
          <span class="control-text">{{ isPaused ? '继续' : '暂停' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'

interface Props {
  puzzleName?: string
  gridRows?: number
  gridCols?: number
  totalPieces?: number
  completionPercentage?: number
  placedPieces?: number
  elapsedTime?: number
  moveCount?: number
  difficulty?: number
  isPaused?: boolean
}

interface Emits {
  (e: 'show-settings'): void
  (e: 'toggle-pause'): void
  (e: 'return-to-library'): void
  (e: 'reset-game'): void
}

const props = withDefaults(defineProps<Props>(), {
  puzzleName: '拼图游戏',
  gridRows: 0,
  gridCols: 0,
  totalPieces: 0,
  completionPercentage: 0,
  placedPieces: 0,
  elapsedTime: 0,
  moveCount: 0,
  difficulty: 1,
  isPaused: false
})

const router = useRouter()
const gameStore = useGameStore()

// 移动端状态
const isMobile = ref(false)
const showMobileStats = ref(false)

// 检测移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// 切换移动端统计显示
const toggleMobileStats = () => {
  showMobileStats.value = !showMobileStats.value
}

// 计算属性
const isGameActive = computed(() => gameStore.isGameActive)
const isCompleted = computed(() => gameStore.isCompleted)

// 方法
const formatTime = (seconds: number): string => {
  // 取整数秒数，去掉小数
  const totalSeconds = Math.floor(seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const togglePause = () => {
  emit('toggle-pause')
}

// 定义事件
const emit = defineEmits<{
  'toggle-pause': []
}>()

// 生命周期
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.game-status-bar {
  @apply shadow-sm border-b relative;
  background-color: var(--settings-card-bg);
  border-bottom-color: var(--settings-border);
}

/* 桌面端状态栏 */
.desktop-status-bar {
  @apply flex items-center justify-between px-6 py-4;
}

/* 移动端状态栏 */
.mobile-status-bar {
  @apply px-4 py-3;
}

.mobile-status-header {
  @apply flex items-center justify-between;
}

.mobile-header-controls {
  @apply flex items-center space-x-2;
}

.mobile-pause-btn {
  @apply p-2 rounded-lg transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-pause-btn:hover {
  background-color: var(--settings-border);
}

.mobile-pause-btn.paused {
  background-color: var(--settings-accent);
  color: #ffffff;
}

.mobile-pause-btn.paused:hover {
  background-color: var(--settings-accent-hover);
}

.mobile-pause-btn .control-icon {
  @apply text-lg;
}

.puzzle-title-mobile h2 {
  @apply text-lg font-bold mb-1;
  color: var(--settings-text-primary);
}

.puzzle-title-mobile .puzzle-dimensions {
  @apply text-sm;
  color: var(--settings-text-secondary);
}

.mobile-stats-toggle {
  @apply p-2 rounded-lg transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
}

.mobile-stats-toggle:hover {
  background-color: var(--settings-border);
}

.toggle-icon {
  @apply text-lg;
}

.mobile-stats-content {
  @apply mt-4 space-y-4;
  /* 限制最大高度，避免占用太多空间 */
  max-height: 60vh;
  overflow-y: auto;
}

.mobile-stats-grid {
  @apply grid grid-cols-2 gap-3;
}

.mobile-stat-item {
  @apply flex flex-col items-center p-3 rounded-lg;
  background-color: var(--settings-hover);
}

.mobile-stat-item .stat-label {
  @apply text-xs mb-1;
  color: var(--settings-text-secondary);
}

.mobile-stat-item .stat-value {
  @apply text-lg font-semibold;
  color: var(--settings-text-primary);
}

.mobile-stat-item .stat-detail {
  @apply text-xs mt-1;
  color: var(--settings-text-secondary);
}

/* 桌面端原有样式 */
.status-left {
  @apply flex items-center;
}

.puzzle-title h2 {
  @apply text-2xl font-bold mb-1;
  color: var(--settings-text-primary);
}

.puzzle-dimensions {
  @apply text-sm;
  color: var(--settings-text-secondary);
}

.status-center {
  @apply flex-1 flex justify-center;
}

.game-stats {
  @apply flex items-center space-x-4;
}

.stat-item {
  @apply flex flex-col items-center px-4 py-3 rounded-lg;
  background-color: var(--settings-hover);
  min-width: 100px;
  height: 80px;
  justify-content: center;
}

.stat-label {
  @apply text-xs mb-1;
  color: var(--settings-text-secondary);
}

.stat-value {
  @apply text-lg font-semibold;
  color: var(--settings-text-primary);
}

.stat-detail {
  @apply text-xs mt-1;
  color: var(--settings-text-secondary);
}

.status-right {
  @apply flex items-center;
}

.desktop-pause-btn {
  @apply px-4 py-3 rounded-lg transition-colors duration-200 font-medium text-sm;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
  min-width: 100px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.desktop-pause-btn:hover {
  background-color: var(--settings-border);
}

.desktop-pause-btn.paused {
  background-color: var(--settings-accent);
  color: #ffffff;
}

.desktop-pause-btn.paused:hover {
  background-color: var(--settings-accent-hover);
}

.control-icon {
  @apply text-lg;
}

.control-text {
  @apply text-xs;
}


</style>
