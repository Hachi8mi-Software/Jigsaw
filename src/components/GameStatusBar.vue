<!--
  游戏状态栏组件
  显示游戏进度、时间、步数等信息
-->

<template>
  <div class="game-status-bar">
    <!-- 移动端折叠状态栏 -->
    <div v-if="isMobile" class="mobile-status-bar">
      <div class="mobile-status-header">
        <div class="mobile-game-title-container">
          <h1 class="mobile-game-style-title">PUZZLE</h1>
          <h1 class="mobile-game-style-title">GAME</h1>
          <h1 class="mobile-game-title">{{ puzzleName }}</h1>
          <div class="mobile-game-stats-info">{{ gridRows }}x{{ gridCols }}</div>
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
        <div class="game-title-container">
          <h1 class="game-style-title">PUZZLE</h1>
          <h1 class="game-style-title">GAME</h1>
          <h1 class="game-title">{{ puzzleName }}</h1>
          <div class="game-stats-info">{{ gridRows }}x{{ gridCols }} = {{ totalPieces }} 块</div>
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
  background: linear-gradient(0deg, #00000000, #000000ff), var(--settings-card-bg);
  min-height: 12rem;
  max-height: 30vh;
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

/* 移动端标题样式 */
.mobile-game-title-container {
  --theme-color-primary: #fae925; 
  --theme-color-secondary: #e8d620;
  --font-size: 2rem;

  @apply flex items-baseline space-x-3;
  flex-direction: column;
  position: relative;
  width: 100%;
}

.mobile-game-style-title {
  font-size: var(--font-size);
  line-height: calc(var(--font-size) * 0.9);
  font-weight: 800;
  font-family: 'Gotham Pro', sans-serif;
  background: linear-gradient(45deg,
    var(--theme-color-primary) 0 15%,
    var(--theme-color-secondary) 15% 20%,
    var(--theme-color-primary) 20% 35%,
    var(--theme-color-secondary) 35% 40%,
    var(--theme-color-primary) 40% 55%,
    var(--theme-color-secondary) 55% 60%,
    var(--theme-color-primary) 60% 75%,
    var(--theme-color-secondary) 75% 80%,
    var(--theme-color-primary) 80% 95%,
    var(--theme-color-secondary) 95% 100%);

  background-clip: text;
  color: transparent;
  -webkit-background-clip: text;
  letter-spacing: -0.02em;
}

.mobile-game-title {
  @apply text-base font-bold;
  color: var(--theme-color-primary);
  background-color: #000000;
  padding: 0rem 0.5rem;

  position: absolute;
  top: calc(var(--font-size) * 0.6);
  left: min(calc(var(--font-size) * 2.2), 40vw);
}

.mobile-game-stats-info {
  color: #ffffff;
  background-color: #000000;
  padding: 0.1rem 0.4rem;
  margin: 0.3rem 0;
  font-weight: 600;
  font-size: 0.8rem;
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
  @apply flex flex-col items-center p-3 rounded-xl;
  background: #fae925;
  border: 2px solid #d4c41a;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.mobile-stat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(circle at 20% 20%, rgba(212, 196, 26, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(212, 196, 26, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 40% 60%, rgba(212, 196, 26, 0.25) 0%, transparent 50%);
  background-size: 40px 40px, 50px 50px, 45px 45px;
  background-position: 0 0, 20px 20px, 10px 30px;
  opacity: 0.6;
}

.mobile-stat-item:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(212, 196, 26, 0.3);
  border-color: #b8a817;
  background: #fae925;
}

.mobile-stat-item:hover::before {
  opacity: 0.8;
  background-size: 35px 35px, 45px 45px, 40px 40px;
}

.mobile-stat-item .stat-label {
  @apply text-xs mb-1 font-medium;
  color: #1f2937;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mobile-stat-item .stat-value {
  @apply text-lg font-bold;
  color: #111827;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  font-family: 'Gotham Pro', sans-serif;
}

.mobile-stat-item .stat-detail {
  @apply text-xs mt-1 font-medium;
  color: #374151;
  opacity: 0.8;
}

/* 桌面端标题样式 */
.status-left {
  @apply flex items-center;
}

.game-title-container {
  --theme-color-primary: #fae925; 
  --theme-color-secondary: #e8d620;
  --font-size: 3.5rem;

  @apply flex items-baseline space-x-3;
  flex-direction: column;
  position: relative;
  width: 100%;
}

.game-style-title {
  font-size: var(--font-size);
  line-height: calc(var(--font-size) * 0.9);
  font-weight: 800;
  font-family: 'Gotham Pro', sans-serif;
  background: linear-gradient(45deg,
    var(--theme-color-primary) 0 15%,
    var(--theme-color-secondary) 15% 20%,
    var(--theme-color-primary) 20% 35%,
    var(--theme-color-secondary) 35% 40%,
    var(--theme-color-primary) 40% 55%,
    var(--theme-color-secondary) 55% 60%,
    var(--theme-color-primary) 60% 75%,
    var(--theme-color-secondary) 75% 80%,
    var(--theme-color-primary) 80% 95%,
    var(--theme-color-secondary) 95% 100%);

  background-clip: text;
  color: transparent;
  -webkit-background-clip: text;
  letter-spacing: -0.02em;
}

.game-title {
  @apply text-xl font-bold;
  color: var(--theme-color-primary);
  background-color: #000000;
  padding: 0rem 0.5rem;

  position: absolute;
  top: calc(var(--font-size) * 0.6);
  left: min(calc(var(--font-size) * 2.6), 50vw);
}

.game-stats-info {
  color: #ffffff;
  background-color: #000000;
  padding: 0.2rem 0.5rem;
  margin: 0.5rem 0;
  font-weight: 600;
  font-size: 0.9rem;
}

.status-center {
  @apply flex-1 flex justify-center;
}

.game-stats {
  @apply flex items-center space-x-4;
}

.stat-item {
  @apply flex flex-col items-center px-4 py-3 rounded-xl;
  background: #fae925;
  min-width: 100px;
  height: 80px;
  justify-content: center;
  border: 2px solid #d4c41a;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(circle at 20% 20%, rgba(212, 196, 26, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(212, 196, 26, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 40% 60%, rgba(212, 196, 26, 0.25) 0%, transparent 50%);
  background-size: 60px 60px, 80px 80px, 70px 70px;
  background-position: 0 0, 30px 30px, 15px 45px;
  opacity: 0.6;
}

.stat-item:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 25px rgba(212, 196, 26, 0.4);
  border-color: #b8a817;
  background: #fae925;
}

.stat-item:hover::before {
  opacity: 0.8;
  background-size: 50px 50px, 70px 70px, 60px 60px;
}

.stat-label {
  @apply text-xs mb-1 font-medium;
  color: #1f2937;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  @apply text-xl font-bold;
  color: #111827;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  font-family: 'Gotham Pro', sans-serif;
}

.stat-detail {
  @apply text-xs mt-1 font-medium;
  color: #374151;
  opacity: 0.8;
}

.status-right {
  @apply flex items-center;
}

.desktop-pause-btn {
  @apply px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm;
  background: #fae925;
  color: #111827;
  min-width: 100px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 2px solid #d4c41a;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.desktop-pause-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(circle at 20% 20%, rgba(212, 196, 26, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(212, 196, 26, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 40% 60%, rgba(212, 196, 26, 0.25) 0%, transparent 50%);
  background-size: 60px 60px, 80px 80px, 70px 70px;
  background-position: 0 0, 30px 30px, 15px 45px;
  opacity: 0.6;
}

.desktop-pause-btn:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 25px rgba(212, 196, 26, 0.4);
  border-color: #b8a817;
  background: #fae925;
}

.desktop-pause-btn:hover::before {
  opacity: 0.8;
  background-size: 50px 50px, 70px 70px, 60px 60px;
}

.desktop-pause-btn.paused {
  background: #d4c41a;
  color: #111827;
  border-color: #b8a817;
  box-shadow: 0 4px 15px rgba(212, 196, 26, 0.3);
}

.desktop-pause-btn.paused:hover {
  background: #b8a817;
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 25px rgba(212, 196, 26, 0.4);
}

.control-icon {
  @apply text-lg;
}

.control-text {
  @apply text-xs;
}


</style>
