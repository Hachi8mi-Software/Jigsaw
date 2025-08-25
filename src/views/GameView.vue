<!--
  拼图游戏视图
  主要游戏界面，包含游戏板和控制面板
-->

<template>
  <div class="game-view">
    <!-- 游戏顶部栏 -->
    <div class="game-header">
      <div class="game-info">
        <h1 class="game-title">{{ currentPuzzle?.name || '拼图游戏' }}</h1>
        <div class="game-stats">
          <div class="stat-item">
            <span class="stat-label">进度</span>
            <span class="stat-value">{{ completionPercentage }}%</span>
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
            <span class="stat-value">{{ currentDifficulty }}/5</span>
          </div>
        </div>
      </div>
      
      <div class="game-controls">
        <button 
          @click="pauseGame"
          v-if="isGameActive"
          class="control-btn"
        >
          ⏸️ 暂停
        </button>
        <button 
          @click="resumeGame"
          v-else-if="currentPuzzle && !isCompleted"
          class="control-btn"
        >
          ▶️ 继续
        </button>
        <button @click="showSettingsModal = true" class="control-btn">
          ⚙️ 设置
        </button>
        <button @click="returnToLibrary" class="control-btn">
          📚 返回素材库
        </button>
      </div>
    </div>

    <!-- 游戏主内容 -->
    <div class="game-content" v-if="currentPuzzle">
      <PuzzleBoard
        :puzzle-data="currentPuzzle"
      />
    </div>

    <!-- 无游戏状态 -->
    <div v-else class="no-game-state">
      <div class="no-game-message">
        <div class="no-game-icon">🧩</div>
        <h2>选择一个拼图开始游戏</h2>
        <p>从素材库中选择一个拼图，或者使用编辑器创建自定义拼图</p>
        <div class="no-game-actions">
          <button @click="goToLibrary" class="action-btn primary">
            浏览素材库
          </button>
          <button @click="goToEditor" class="action-btn">
            创建拼图
          </button>
        </div>
      </div>
    </div>

    <!-- 游戏完成对话框 -->
    <div v-if="showCompletionModal" class="modal-overlay" @click="closeCompletionModal">
      <div class="modal-dialog completion-modal" @click.stop>
        <div class="completion-content">
          <div class="completion-icon">🎉</div>
          <h2>恭喜完成拼图！</h2>
          <div class="completion-stats">
            <div class="completion-stat">
              <span class="stat-label">完成时间</span>
              <span class="stat-value">{{ formatTime(elapsedTime) }}</span>
            </div>
            <div class="completion-stat">
              <span class="stat-label">移动步数</span>
              <span class="stat-value">{{ moveCount }}</span>
            </div>
            <div class="completion-stat">
              <span class="stat-label">拼图难度</span>
              <span class="stat-value">{{ currentDifficulty }}/5</span>
            </div>
          </div>
          
          <!-- 新解锁成就 -->
          <div v-if="newAchievements.length > 0" class="new-achievements">
            <h3>🏆 新解锁成就</h3>
            <div class="achievement-list">
              <div 
                v-for="achievement in newAchievements"
                :key="achievement.id"
                class="achievement-item"
              >
                <span class="achievement-icon">{{ achievement.icon }}</span>
                <div class="achievement-info">
                  <div class="achievement-name">{{ achievement.name }}</div>
                  <div class="achievement-desc">{{ achievement.description }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="completion-actions">
            <button @click="playAgain" class="completion-btn">
              🔄 再玩一次
            </button>
            <button @click="goToLibrary" class="completion-btn primary">
              🧩 选择新拼图
            </button>
            <button @click="goToEditor" class="completion-btn">
              ✏️ 创建拼图
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置对话框 -->
    <div v-if="showSettingsModal" class="modal-overlay" @click="closeSettingsModal">
      <div class="modal-dialog settings-modal" @click.stop>
        <div class="modal-header">
          <h3>游戏设置</h3>
          <button @click="closeSettingsModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="setting-group">
            <label class="setting-label">
              <input 
                v-model="gameSettings.showBackground"
                type="checkbox"
                class="setting-checkbox"
              />
              显示背景参考图
            </label>
          </div>
          <div class="setting-group">
            <label class="setting-label">
              <input 
                v-model="gameSettings.showGrid"
                type="checkbox"
                class="setting-checkbox"
              />
              显示网格辅助线
            </label>
          </div>
          <div class="setting-group">
            <label class="setting-label">
              <input 
                v-model="gameSettings.autoSnap"
                type="checkbox"
                class="setting-checkbox"
              />
              自动吸附
            </label>
          </div>
          <div class="setting-group">
            <label class="setting-label">
              <input 
                v-model="gameSettings.showTimer"
                type="checkbox"
                class="setting-checkbox"
              />
              显示计时器
            </label>
          </div>
          <div class="setting-group">
            <label class="setting-label">
              音效音量
              <input 
                v-model.number="gameSettings.soundVolume"
                type="range"
                min="0"
                max="100"
                class="setting-range"
              />
              <span class="volume-value">{{ gameSettings.soundVolume }}%</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="resetSettings" class="modal-btn">
            重置默认
          </button>
          <button @click="saveSettings" class="modal-btn primary">
            保存设置
          </button>
        </div>
      </div>
    </div>

    <!-- 暂停遮罩 -->
    <div v-if="!isGameActive && currentPuzzle && !isCompleted" class="pause-overlay">
      <div class="pause-message">
        <h2>游戏已暂停</h2>
        <button @click="resumeGame" class="resume-btn">
          继续游戏
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '../stores/game'
import { useLibraryStore } from '../stores/library'
import type { PuzzleData, Achievement, Boundary } from '../types'
import PuzzleBoard from '../components/PuzzleBoard.vue'

// Store和路由
const gameStore = useGameStore()
const libraryStore = useLibraryStore()
const router = useRouter()
const route = useRoute()

// 响应式状态
const showCompletionModal = ref(false)
const showSettingsModal = ref(false)
const newAchievements = ref<Achievement[]>([])

// 游戏设置
const gameSettings = reactive({
  showBackground: true,
  showGrid: true,
  autoSnap: true,
  showTimer: true,
  soundVolume: 70
})

// 计算属性
const currentPuzzle = computed(() => gameStore.currentPuzzle)
const isGameActive = computed(() => gameStore.isGameActive)
const isCompleted = computed(() => gameStore.isCompleted)
const completionPercentage = computed(() => gameStore.completionPercentage)
const elapsedTime = computed(() => gameStore.elapsedTime)
const moveCount = computed(() => gameStore.moveCount)
const currentDifficulty = computed(() => gameStore.currentDifficulty)

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

const handlePieceMoved = (pieceId: string, x: number, y: number) => {
  // 拼图块移动处理
  console.log(`拼图块 ${pieceId} 移动到 (${x}, ${y})`)
}

const handlePiecePlaced = (pieceId: string, row: number, col: number) => {
  // 拼图块放置处理
  console.log(`拼图块 ${pieceId} 放置到 (${row}, ${col})`)
  
  // 播放放置音效
  if (gameSettings.soundVolume > 0) {
    playSound('place')
  }
}

const handleGameCompleted = () => {
  showCompletionModal.value = true
  
  // 检查新解锁的成就
  const hasNewAchievements = libraryStore.checkAchievements(gameStore.userStats)
  if (hasNewAchievements) {
    newAchievements.value = libraryStore.unlockedAchievements.filter(
      achievement => achievement.unlockedAt && 
      new Date().getTime() - achievement.unlockedAt.getTime() < 1000
    )
  }
  
  // 播放完成音效
  if (gameSettings.soundVolume > 0) {
    playSound('complete')
  }
}

const pauseGame = () => {
  gameStore.pauseGame()
}

const resumeGame = () => {
  gameStore.resumeGame()
}

const playAgain = () => {
  if (currentPuzzle.value) {
    gameStore.resetGame()
    closeCompletionModal()
  }
}

const returnToLibrary = () => {
  router.push('/library')
}

const goToLibrary = () => {
  router.push('/library')
}

const goToEditor = () => {
  router.push('/editor')
}

const closeCompletionModal = () => {
  showCompletionModal.value = false
  newAchievements.value = []
}

const closeSettingsModal = () => {
  showSettingsModal.value = false
}

const saveSettings = () => {
  // 保存设置到本地存储
  localStorage.setItem('game_settings', JSON.stringify(gameSettings))
  closeSettingsModal()
}

const resetSettings = () => {
  Object.assign(gameSettings, {
    showBackground: true,
    showGrid: true,
    autoSnap: true,
    showTimer: true,
    soundVolume: 70
  })
}

const loadSettings = () => {
  try {
    const saved = localStorage.getItem('game_settings')
    if (saved) {
      Object.assign(gameSettings, JSON.parse(saved))
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

const playSound = (type: 'place' | 'complete') => {
  // 简单的音效实现
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  const volume = gameSettings.soundVolume / 100 * 0.1
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
  
  if (type === 'place') {
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1)
  } else if (type === 'complete') {
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1)
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2)
  }
  
  oscillator.start()
  oscillator.stop(audioContext.currentTime + 0.3)
}

const loadPuzzleFromRoute = async () => {
  const puzzleId = route.params.puzzleId as string
  if (puzzleId) {
    // 从素材库查找拼图
    const libraryItem = libraryStore.items.find(item => item.id === puzzleId)
    if (libraryItem) {
      // 生成简单的边界数据（平直边界用于演示）
      const boundaries: Boundary[] = []
      const rows = 3, cols = 4
      
      // 创建拼图数据
      const puzzleData: PuzzleData = {
        id: libraryItem.id,
        name: libraryItem.name,
        imageUrl: libraryItem.imageUrl,
        gridConfig: {
          rows,
          cols,
          pieceWidth: 150,
          pieceHeight: 100
        },
        boundaries,
        createdAt: new Date(),
        difficulty: libraryItem.difficulty
      }
      
      gameStore.startNewGame(puzzleData)
    }
  }
}

// 生命周期
onMounted(() => {
  loadSettings()
  
  // 如果路由中有拼图ID，加载对应拼图
  if (route.params.puzzleId) {
    loadPuzzleFromRoute()
  }
})

// 监听路由变化
watch(() => route.params.puzzleId, (newId) => {
  if (newId) {
    loadPuzzleFromRoute()
  }
})
</script>

<style scoped>
.game-view {
  @apply h-screen flex flex-col bg-gray-100;
}

.game-header {
  @apply flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b;
}

.game-info {
  @apply flex items-center space-x-6;
}

.game-title {
  @apply text-2xl font-bold text-gray-800;
}

.game-stats {
  @apply flex items-center space-x-4;
}

.stat-item {
  @apply flex flex-col items-center px-3 py-2 bg-gray-50 rounded-lg;
}

.stat-label {
  @apply text-xs text-gray-600 mb-1;
}

.stat-value {
  @apply text-lg font-semibold text-gray-800;
}

.game-controls {
  @apply flex items-center space-x-3;
}

.control-btn {
  @apply px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200;
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.game-content {
  @apply flex-1 overflow-hidden;
}

.no-game-state {
  @apply flex-1 flex items-center justify-center;
}

.no-game-message {
  @apply text-center max-w-md;
}

.no-game-icon {
  @apply text-8xl mb-6;
}

.no-game-message h2 {
  @apply text-2xl font-bold text-gray-800 mb-4;
}

.no-game-message p {
  @apply text-gray-600 mb-8;
}

.no-game-actions {
  @apply flex justify-center space-x-4;
}

.action-btn {
  @apply px-6 py-3 text-sm font-medium rounded-lg transition-colors duration-200;
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.action-btn.primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-dialog {
  @apply bg-white rounded-lg shadow-xl mx-4;
}

.completion-modal {
  @apply w-full max-w-lg;
}

.completion-content {
  @apply p-8 text-center;
}

.completion-icon {
  @apply text-8xl mb-4;
}

.completion-content h2 {
  @apply text-2xl font-bold text-gray-800 mb-6;
}

.completion-stats {
  @apply grid grid-cols-3 gap-4 mb-6;
}

.completion-stat {
  @apply flex flex-col items-center p-4 bg-gray-50 rounded-lg;
}

.new-achievements {
  @apply mb-6 p-4 bg-yellow-50 rounded-lg;
}

.new-achievements h3 {
  @apply text-lg font-semibold text-yellow-800 mb-3;
}

.achievement-list {
  @apply space-y-2;
}

.achievement-item {
  @apply flex items-center p-2 bg-white rounded;
}

.achievement-icon {
  @apply text-2xl mr-3;
}

.achievement-info {
  @apply text-left;
}

.achievement-name {
  @apply font-medium text-gray-800;
}

.achievement-desc {
  @apply text-sm text-gray-600;
}

.completion-actions {
  @apply flex justify-center space-x-3;
}

.completion-btn {
  @apply px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200;
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.completion-btn.primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.settings-modal {
  @apply w-full max-w-md;
}

.modal-header {
  @apply flex items-center justify-between p-4 border-b;
}

.modal-header h3 {
  @apply text-lg font-semibold;
}

.close-btn {
  @apply text-2xl text-gray-400 hover:text-gray-600 cursor-pointer;
}

.modal-body {
  @apply p-4 space-y-4;
}

.setting-group {
  @apply flex items-center justify-between;
}

.setting-label {
  @apply flex items-center cursor-pointer;
}

.setting-checkbox {
  @apply mr-2;
}

.setting-range {
  @apply flex-1 mx-3;
}

.volume-value {
  @apply text-sm text-gray-600 min-w-12;
}

.modal-footer {
  @apply flex justify-end space-x-2 p-4 border-t;
}

.modal-btn {
  @apply px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200;
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.modal-btn.primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.pause-overlay {
  @apply fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40;
}

.pause-message {
  @apply text-center text-white;
}

.pause-message h2 {
  @apply text-3xl font-bold mb-6;
}

.resume-btn {
  @apply px-8 py-4 text-lg font-medium bg-blue-500 text-white rounded-lg;
  @apply hover:bg-blue-600 transition-colors duration-200;
}
</style>
