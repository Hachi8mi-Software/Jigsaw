<!--
  拼图游戏视图
  主要游戏界面，包含游戏板和控制面板
-->

<template>
  <div class="game-view">
    <!-- 游戏状态栏 -->
    <GameStatusBar
      v-if="currentPuzzle"
      :puzzle-name="currentPuzzle.name"
      :grid-rows="currentPuzzle.gridConfig.rows"
      :grid-cols="currentPuzzle.gridConfig.cols"
      :total-pieces="totalPieces"
      :completion-percentage="completionPercentage"
      :placed-pieces="placedPieces"
      :elapsed-time="elapsedTime"
      :move-count="moveCount"
      :difficulty="currentDifficulty"
      :is-paused="isPaused"
      @toggle-pause="handleTogglePause"
    />

    <!-- 游戏主内容 -->
    <div class="game-content" v-if="currentPuzzle && !showDifficultySelection">
      <PuzzleBoard
        :controller="gameViewModel.gameController"
        :puzzle-data="currentPuzzle"
      />
      
      <!-- 暂停遮罩 -->
      <div v-if="isPaused" class="pause-overlay">
        <div class="pause-message">
          <div class="pause-icon">⏸️</div>
          <h2>{{ isAutoPaused ? '游戏已自动暂停' : '游戏已暂停' }}</h2>
          <p v-if="isAutoPaused" class="pause-subtitle">离开游戏页面时自动暂停</p>
          <button @click="resumeGame" class="resume-btn">
            继续游戏
          </button>
        </div>
      </div>
    </div>

    <!-- 难度选择状态 -->
    <div v-else-if="showDifficultySelection" class="difficulty-selection-state">
      <div class="difficulty-selection-message">
        <div class="difficulty-selection-icon">🎯</div>
        <h2>选择游戏难度</h2>
        <p>请选择适合您的难度等级开始游戏</p>
        
        <!-- 难度选择 -->
        <div class="difficulty-selection">
          <div class="difficulty-options">
            <div 
              v-for="(config, difficulty) in difficultyConfigs" 
              :key="difficulty"
              class="difficulty-option"
              :class="{ active: selectedDifficulty === difficulty }"
              @click="selectDifficulty(difficulty)"
            >
              <div class="difficulty-icon">
                {{ getDifficultyIcon(difficulty) }}
              </div>
              <div class="difficulty-info">
                <h4>{{ config.name }}</h4>
                <p>{{ config.description }}</p>
                <div class="difficulty-features">
                  <span v-if="config.showNumbers" class="feature">📝 数字提示</span>
                  <span v-if="config.enableRotation" class="feature">🔄 旋转</span>
                  <span v-if="config.enableFlip" class="feature">🔀 翻转</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="difficulty-actions">
          <button @click="startGameWithDifficulty" class="action-btn primary" :disabled="!selectedDifficulty">
            开始游戏
          </button>
          <button @click="goToLibrary" class="action-btn">
            返回素材库
          </button>
        </div>
      </div>
    </div>

    <!-- 无游戏状态 -->
    <div v-else class="no-game-state">
      <div class="no-game-message">
        <div class="no-game-icon">🧩</div>
        <h2>选择一个拼图开始游戏</h2>
        <p>从素材库中选择一个拼图，或者使用编辑器创建自定义拼图</p>
        
        <!-- 难度选择 -->
        <div class="difficulty-selection">
          <h3>选择游戏难度</h3>
          <div class="difficulty-options">
            <div 
              v-for="(config, difficulty) in difficultyConfigs" 
              :key="difficulty"
              class="difficulty-option"
              :class="{ active: selectedDifficulty === difficulty }"
              @click="selectDifficulty(difficulty)"
            >
              <div class="difficulty-icon">
                {{ getDifficultyIcon(difficulty) }}
              </div>
              <div class="difficulty-info">
                <h4>{{ config.name }}</h4>
                <p>{{ config.description }}</p>
                <div class="difficulty-features">
                  <span v-if="config.showNumbers" class="feature">📝 数字提示</span>
                  <span v-if="config.enableRotation" class="feature">🔄 旋转</span>
                  <span v-if="config.enableFlip" class="feature">🔀 翻转</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, onUnmounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNotificationStore } from '../stores/notification'
import type { PuzzleData, Achievement, DifficultyConfig } from '../types'
import { GameDifficulty } from '../types'
import PuzzleBoard from '../components/PuzzleBoard.vue'
import GameStatusBar from '../components/GameStatusBar.vue'
import { GameViewModel } from '../viewModels/game/gameViewModel'

// 路由和通知
const router = useRouter()
const route = useRoute()
const notificationStore = useNotificationStore()

// 业务逻辑管理器
const gameViewModel = GameViewModel.getInstance()

// 从管理器获取响应式状态
const showCompletionModal = gameViewModel.showCompletionModal
const showSettingsModal = gameViewModel.showSettingsModal
const newAchievements = gameViewModel.newAchievements
const gameSettings = gameViewModel.gameSettings

// 计算属性 - 通过GameViewModel访问
const currentPuzzle = computed(() => gameViewModel.currentPuzzle)
const isGameActive = computed(() => gameViewModel.isGameActive)
const isCompleted = computed(() => gameViewModel.isCompleted)
const isPaused = computed(() => gameViewModel.isPaused)
const isAutoPaused = computed(() => gameViewModel.isAutoPaused)
const completionPercentage = computed(() => gameViewModel.completionPercentage)
const elapsedTime = computed(() => gameViewModel.elapsedTime)
const moveCount = computed(() => gameViewModel.moveCount)
const currentDifficulty = computed(() => gameViewModel.currentDifficulty)

// 难度选择相关
const selectedDifficulty = ref<GameDifficulty>(GameDifficulty.EASY)
const showDifficultySelection = ref(false)
const pendingPuzzleId = ref<string | null>(null)

// 难度配置
const difficultyConfigs: Record<GameDifficulty, DifficultyConfig> = {
  [GameDifficulty.EASY]: {
    showNumbers: true,
    enableRotation: false,
    enableFlip: false,
    name: '简单',
    description: '显示数字提示，适合新手'
  },
  [GameDifficulty.MEDIUM]: {
    showNumbers: false,
    enableRotation: false,
    enableFlip: false,
    name: '中等',
    description: '不显示数字提示，需要更多观察'
  },
  [GameDifficulty.HARD]: {
    showNumbers: false,
    enableRotation: true,
    enableFlip: true,
    name: '困难',
    description: '开启旋转和翻转，极具挑战性'
  }
}

// 拼图相关计算属性
const totalPieces = computed(() => {
  if (!currentPuzzle.value) return 0
  return currentPuzzle.value.gridConfig.rows * currentPuzzle.value.gridConfig.cols
})

const placedPieces = computed(() => {
  return gameViewModel.pieces.filter(p => p.isPlaced).length
})

// 方法
const formatTime = (seconds: number): string => {
  return gameViewModel.formatTime(seconds)
}

const handlePieceMoved = (pieceId: string, x: number, y: number) => {
  // 拼图块移动处理
  console.log(`拼图块 ${pieceId} 移动到 (${x}, ${y})`)
}

const handlePiecePlaced = (pieceId: string, row: number, col: number) => {
  gameViewModel.handlePiecePlaced(pieceId, row, col)
}

const handleGameCompleted = () => {
  gameViewModel.handleGameCompleted()
}

const handleTogglePause = () => {
  if (isPaused.value) {
    resumeGame()
  } else {
    pauseGame()
  }
}

const handleReturnToLibrary = () => {
  router.push('/library')
}

const handleResetGame = async () => {
  const confirmed = await notificationStore.showConfirm({
    title: '重置游戏',
    message: '确定要重置当前游戏吗？所有进度将被清除。',
    type: 'warning',
    confirmText: '重置',
    cancelText: '取消'
  })
  
  if (confirmed) {
    gameViewModel.resetGame()
  }
}

const pauseGame = () => {
  gameViewModel.pauseGame()
}

const resumeGame = () => {
  gameViewModel.resumeGame()
}

const playAgain = () => {
  gameViewModel.playAgain()
}

const goToLibrary = () => {
  // 清除当前游戏状态
  gameViewModel.clearCurrentGame()
  router.push('/library')
}

const goToEditor = () => {
  router.push('/editor')
}

const closeCompletionModal = () => {
  gameViewModel.closeCompletionModal()
}

// 难度选择相关方法
const selectDifficulty = (difficulty: GameDifficulty) => {
  selectedDifficulty.value = difficulty
  // 应用难度设置到游戏设置中
  const config = difficultyConfigs[difficulty]
  gameViewModel.applyDifficultySettings(config)
}

const getDifficultyIcon = (difficulty: GameDifficulty): string => {
  switch (difficulty) {
    case GameDifficulty.EASY:
      return '🟢'
    case GameDifficulty.MEDIUM:
      return '🟡'
    case GameDifficulty.HARD:
      return '🔴'
    default:
      return '⚪'
  }
}

const startGameWithDifficulty = async () => {
  if (!pendingPuzzleId.value || !selectedDifficulty.value) return
  
  // 应用选择的难度设置
  const config = difficultyConfigs[selectedDifficulty.value]
  gameViewModel.applyDifficultySettings(config)
  
  // 加载拼图并开始游戏
  await gameViewModel.loadPuzzleFromRoute(pendingPuzzleId.value)
  
  // 隐藏难度选择界面
  showDifficultySelection.value = false
  pendingPuzzleId.value = null
}

const closeSettingsModal = () => {
  gameViewModel.closeSettingsModal()
}

const saveSettings = () => {
  gameViewModel.saveSettings()
}

const resetSettings = () => {
  gameViewModel.resetSettings()
}

const openSettingsModal = () => {
  gameViewModel.openSettingsModal()
}

const loadPuzzleFromRoute = async () => {
  const puzzleId = route.params.puzzleId as string
  if (puzzleId) {
    await gameViewModel.loadPuzzleFromRoute(puzzleId)
  }
}

// 生命周期
onMounted(() => {
  // 如果路由中有拼图ID，显示难度选择界面
  if (route.params.puzzleId) {
    pendingPuzzleId.value = route.params.puzzleId as string
    showDifficultySelection.value = true
  }
  
  // 监听游戏完成事件
  watch(() => gameViewModel.isCompleted, (completed) => {
    if (completed) {
      handleGameCompleted()
    }
  })
  
  // 监听游戏状态变化
  watch(() => gameViewModel.isGameActive, (active) => {
    if (!active && gameViewModel.currentPuzzle && !gameViewModel.isCompleted) {
      console.log('游戏已暂停')
    }
  })

  // 监听暂停状态变化
  watch(() => gameViewModel.isPaused, (paused) => {
    if (paused) {
      console.log('游戏已暂停，可以显示暂停提示')
    }
  })
})

// 监听路由变化
watch(() => route.params.puzzleId, (newId) => {
  if (newId) {
    loadPuzzleFromRoute()
  }
})

// 监听路由路径变化，离开游戏页面时自动暂停
watch(() => route.path, (newPath, oldPath) => {
  gameViewModel.handleRouteChange(newPath, oldPath)
})

// 组件卸载时清理
onUnmounted(() => {
  gameViewModel.handleComponentUnmount()
})
</script>

<style scoped>
.game-view {
  @apply h-screen flex flex-col;
  background-color: var(--settings-bg);
  /* 移动端高度优化 */
  height: 100vh;
  height: 100dvh; /* 动态视口高度，考虑移动端浏览器UI */
}

/* 移动端适配：为固定头部栏预留空间 */
@media (max-width: 767px) {
  .game-view {
    height: calc(100vh - 60px);
  }
}

.game-header {
  @apply flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b;
}

.game-info {
  @apply flex items-center space-x-6;
}

.game-title {
  @apply text-2xl font-bold;
  color: var(--settings-text-primary);
}

.game-stats {
  @apply flex items-center space-x-4;
}

.stat-item {
  @apply flex flex-col items-center px-3 py-2 rounded-lg;
  background-color: var(--settings-hover);
}

.stat-label {
  @apply text-xs mb-1;
  color: var(--settings-text-secondary);
}

.stat-value {
  @apply text-lg font-semibold;
  color: var(--settings-text-primary);
}

.debug-info {
  @apply text-xs mt-1 block;
  color: var(--settings-text-secondary);
}

.game-controls {
  @apply flex items-center space-x-3;
}

.control-btn {
  @apply px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
}

.control-btn:hover {
  background-color: var(--settings-border);
}

.game-content {
  @apply flex-1 overflow-hidden relative;
  /* 移动端优化：确保内容区域正确计算高度 */
  min-height: 0;
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
  @apply text-2xl font-bold mb-4;
  color: var(--settings-text-primary);
}

.no-game-message p {
  @apply mb-8;
  color: var(--settings-text-secondary);
}

.no-game-actions {
  @apply flex justify-center space-x-4;
}

.action-btn {
  @apply px-6 py-3 text-sm font-medium rounded-lg transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
}

.action-btn:hover {
  background-color: var(--settings-border);
}

.action-btn.primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-dialog {
  @apply bg-white rounded-lg shadow-xl mx-4;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
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
  @apply text-2xl font-bold mb-6;
  color: var(--settings-text-primary);
}

.completion-stats {
  @apply grid grid-cols-3 gap-4 mb-6;
}

.completion-stat {
  @apply flex flex-col items-center p-4 rounded-lg;
  background-color: var(--settings-hover);
}

.completion-stat .stat-label {
  @apply text-xs mb-1;
  color: var(--settings-text-secondary);
}

.completion-stat .stat-value {
  @apply text-lg font-semibold;
  color: var(--settings-text-primary);
}

.new-achievements {
  @apply mb-6 p-4 bg-yellow-50 rounded-lg;
  background-color: rgb(57, 121, 211); /* 浅绿色背景，浅色主题 */
  border: 0px solid rgb(17, 123, 56);
}

[data-theme="dark"] .new-achievements {
  background-color: rgb(11, 52, 97); /* 深色主题下稍微深一点的绿色 */
  border: 0px solid rgb(1, 23, 9);
}

.new-achievements h3 {
  @apply text-lg font-semibold text-yellow-800 mb-3;
  color: var(--settings-text-primary);
}

.achievement-list {
  @apply space-y-2;
}

.achievement-item {
  @apply flex items-center p-2 bg-white rounded;
  background-color: rgba(156, 205, 250, 0.507);
  border: 0px solid rgba(34, 197, 94, 0.15);
  color: var(--settings-text-primary);
}

[data-theme="dark"] .achievement-item {
  background-color: rgb(4, 32, 65);
  border: 0px solid rgb(1, 24, 9);
}

.achievement-icon {
  @apply text-2xl mr-3;
}

.achievement-info {
  @apply text-left;
}

.achievement-name {
  @apply font-medium;
  color: var(--settings-text-primary);
}

.achievement-desc {
  @apply text-sm;
  color: var(--settings-text-secondary);
}

.completion-actions {
  @apply flex justify-center space-x-3;
}

.completion-btn {
  @apply px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
}

.completion-btn:hover {
  background-color: var(--settings-border);
}

.completion-btn:hover {
  background-color: var(--settings-border);
}

.completion-btn.primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
  background-color: var(--settings-accent);
  color: white;
}

.completion-btn.primary:hover {
  background-color: var(--settings-accent-hover, #2563eb);
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
  @apply text-2xl cursor-pointer;
  color: var(--settings-text-secondary);
}

.close-btn:hover {
  color: var(--settings-text-primary);
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
  @apply text-sm min-w-12;
  color: var(--settings-text-secondary);
}

.modal-footer {
  @apply flex justify-end space-x-2 p-4 border-t;
}

.modal-btn {
  @apply px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
}

.modal-btn:hover {
  background-color: var(--settings-border);
}

.modal-btn.primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

/* 暂停遮罩样式 */
.pause-overlay {
  @apply absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.pause-message {
  @apply bg-white rounded-lg p-8 text-center shadow-xl;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
}

.pause-icon {
  @apply text-6xl mb-4;
}

.pause-message h2 {
  @apply text-2xl font-bold mb-2;
  color: var(--settings-text-primary);
}

.pause-subtitle {
  @apply text-sm mb-6;
  color: var(--settings-text-secondary);
}

.resume-btn {
  @apply px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600;
  @apply transition-colors duration-200 font-medium;
  background-color: var(--settings-accent);
  color: white;
}

.resume-btn:hover {
  background-color: var(--settings-accent-hover, #2563eb);
}



.pause-message {
  @apply text-center text-white;
}

.pause-message h2 {
  @apply text-3xl font-bold mb-6;
  color: var(--settings-text-primary);
}

.resume-btn {
  @apply px-8 py-4 text-lg font-medium bg-blue-500 text-white rounded-lg;
  @apply hover:bg-blue-600 transition-colors duration-200;
  background-color: var(--settings-accent);
  color: white;
}

.resume-btn:hover {
  background-color: var(--settings-accent-hover, #2563eb);
}

/* 难度选择样式 */
.difficulty-selection {
  @apply mt-8 mb-6;
}

.difficulty-selection h3 {
  @apply text-xl font-semibold mb-4 text-center;
  color: var(--settings-text-primary);
}

.difficulty-options {
  @apply space-y-3;
}

.difficulty-option {
  @apply flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200;
  border-color: var(--settings-border);
  background-color: var(--settings-card-bg);
}

.difficulty-option:hover {
  border-color: var(--settings-accent);
  background-color: var(--settings-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.difficulty-option.active {
  border-color: var(--settings-accent);
  background-color: var(--settings-accent-light, rgba(59, 130, 246, 0.1));
}

.difficulty-icon {
  @apply text-3xl mr-4;
}

.difficulty-info {
  @apply flex-1;
}

.difficulty-info h4 {
  @apply text-lg font-semibold mb-1;
  color: var(--settings-text-primary);
}

.difficulty-info p {
  @apply text-sm mb-2;
  color: var(--settings-text-secondary);
}

.difficulty-features {
  @apply flex flex-wrap gap-2;
}

.feature {
  @apply text-xs px-2 py-1 rounded-full;
  background-color: var(--settings-hover);
  color: var(--settings-text-secondary);
}

.difficulty-option.active .feature {
  background-color: var(--settings-accent);
  color: white;
}

/* 难度选择状态样式 */
.difficulty-selection-state {
  @apply h-full flex items-center justify-center;
  background-color: var(--settings-bg);
}

.difficulty-selection-message {
  @apply max-w-2xl mx-auto p-8 text-center;
  background-color: var(--settings-card-bg);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.difficulty-selection-icon {
  @apply text-6xl mb-4;
}

.difficulty-selection-message h2 {
  @apply text-3xl font-bold mb-2;
  color: var(--settings-text-primary);
}

.difficulty-selection-message p {
  @apply text-lg mb-8;
  color: var(--settings-text-secondary);
}

.difficulty-actions {
  @apply flex justify-center space-x-4 mt-8;
}

.difficulty-actions .action-btn {
  @apply px-8 py-3 text-lg font-medium rounded-lg transition-all duration-200;
}

.difficulty-actions .action-btn.primary {
  @apply bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed;
}

.difficulty-actions .action-btn:not(.primary) {
  @apply border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50;
  background-color: var(--settings-card-bg);
  border-color: var(--settings-border);
  color: var(--settings-text-primary);
}

</style>
