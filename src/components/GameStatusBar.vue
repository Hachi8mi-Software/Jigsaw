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
          <span v-if="isPaused">▶️</span>
          <span v-else>⏸️</span>
          {{ isPaused ? '继续' : '暂停' }}
        </button>
        
        <button @click="showSettings" class="control-btn">
          ⚙️ 设置
        </button>
        
        <button @click="returnToLibrary" class="control-btn">
          📚 返回素材库
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
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
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

// 定义事件
const emit = defineEmits<{
  'show-settings': []
  'toggle-pause': []
  'return-to-library': []
}>()
</script>

<style scoped>
.game-status-bar {
  @apply flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b relative;
}

.status-left {
  @apply flex items-center;
}

.puzzle-title h2 {
  @apply text-2xl font-bold text-gray-800 mb-1;
}

.puzzle-dimensions {
  @apply text-sm text-gray-600;
}

.status-center {
  @apply flex-1 flex justify-center;
}

.game-stats {
  @apply flex items-center space-x-4;
}

.stat-item {
  @apply flex flex-col items-center px-3 py-2 bg-gray-50 rounded-lg min-w-[80px];
}

.stat-label {
  @apply text-xs text-gray-600 mb-1;
}

.stat-value {
  @apply text-lg font-semibold text-gray-800;
}

.stat-detail {
  @apply text-xs text-gray-500 mt-1;
}

.status-right {
  @apply flex items-center;
}

.game-controls {
  @apply flex items-center space-x-3;
}

.control-btn {
  @apply px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200;
  @apply transition-colors duration-200 font-medium text-sm;
}

.control-btn.paused {
  @apply bg-blue-100 text-blue-700 hover:bg-blue-200;
}


</style>
