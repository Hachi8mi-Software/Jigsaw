<!--
  游戏状态栏组件
  显示游戏进度、时间、步数等信息
-->

<template>
  <div class="game-status-bar">
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
      <div class="game-controls">
        <button 
          @click="togglePause"
          class="control-btn"
          :class="{ 'paused': isPaused }"
        >
          <span class="control-icon">{{ isPaused ? '▶️' : '⏸️' }}</span>
          <span class="control-text">{{ isPaused ? '继续' : '暂停' }}</span>
        </button>
        
        <button @click="resetGame" class="control-btn">
          <span class="control-icon">🔄</span>
          <span class="control-text">重置</span>
        </button>
        
        <button @click="showSettings" class="control-btn">
          <span class="control-icon">⚙️</span>
          <span class="control-text">设置</span>
        </button>
        
        <button @click="returnToLibrary" class="control-btn">
          <span class="control-icon">📚</span>
          <span class="control-text">返回素材库</span>
        </button>
      </div>
    </div>
    

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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

const showSettings = () => {
  // 触发显示设置对话框的事件
  emit('show-settings')
}

const returnToLibrary = () => {
  emit('return-to-library')
}

const resetGame = () => {
  emit('reset-game')
}

// 定义事件
const emit = defineEmits<{
  'show-settings': []
  'toggle-pause': []
  'return-to-library': []
  'reset-game': []
}>()
</script>

<style scoped>
.game-status-bar {
  @apply flex items-center justify-between px-6 py-4 shadow-sm border-b relative;
  background-color: var(--settings-card-bg);
  border-bottom-color: var(--settings-border);
}

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

.game-controls {
  @apply flex items-center space-x-3;
}

.control-btn {
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

.control-btn:hover {
  background-color: var(--settings-border);
}

.control-btn.paused {
  background-color: var(--settings-accent);
  color: #ffffff;
}

.control-btn.paused:hover {
  background-color: var(--settings-accent-hover);
}

.control-icon {
  @apply text-lg;
}

.control-text {
  @apply text-xs;
}


</style>
