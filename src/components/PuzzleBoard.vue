<!--
  拼图游戏板组件
-->

<template>
  <div class="puzzle-board">
    <div v-if="puzzleData" class="puzzle-container">
      <!-- 拼图信息 -->
      <div class="puzzle-info">
        <h3>{{ puzzleData.name }}</h3>
        <p>{{ gridRows }}x{{ gridCols }} = {{ totalPieces }} 块</p>
      </div>

      <!-- 游戏区域 -->
      <div class="game-area" :class="{ 'mobile-layout': isMobile }">
        <!-- 移动端布局：上下排列 -->
        <template v-if="isMobile">
          <!-- 目标拼图网格（上方） -->
          <div class="target-area mobile-target">
            <h4>目标区域</h4>
            <div class="puzzle-grid mobile-grid" :style="gridStyle as any">
              <!-- 网格占位符 -->
              <div
                v-for="index in totalPieces"
                :key="`slot-${index}`"
                class="grid-slot"
                :class="{ 'occupied': isSlotOccupied(index - 1) }"
              >
                <span class="slot-number">{{ index }}</span>
              </div>
              
              <!-- 已放置的拼图块 -->
              <PuzzlePieceCanvas
                v-for="(piece, index) in pieces"
                :key="`placed-${index}`"
                v-show="piece.isPlaced"
                :piece="piece"
                :puzzle-data="puzzleData!"
                :grid-cols="gridCols"
                :grid-rows="gridRows"
                :piece-width="viewModel.pieceWidth"
                :piece-height="viewModel.pieceHeight"
                :is-dragging="draggingPieceIndex === index"
                :is-placed="true"
                :show-number="true"
                :number-display-mode="'minimal'"
                @mousedown="(event) => startDrag(index, event)"
                @touchstart="(event) => startDrag(index, event)"
              />
            </div>
          </div>

          <!-- 散乱的拼图块（下方） -->
          <div class="pieces-area mobile-pieces">
            <h4>拼图块</h4>
            <div class="scattered-pieces mobile-scattered">
              <PuzzlePieceCanvas
                v-for="(piece, index) in pieces"
                :key="`piece-${index}`"
                v-show="!piece.isPlaced"
                :piece="piece"
                :puzzle-data="puzzleData!"
                :grid-cols="gridCols"
                :grid-rows="gridRows"
                :piece-width="viewModel.pieceWidth"
                :piece-height="viewModel.pieceHeight"
                :is-dragging="draggingPieceIndex === index"
                :is-placed="false"
                :show-number="true"
                :number-display-mode="'minimal'"
                @mousedown="(event) => startDrag(index, event)"
                @touchstart="(event) => startDrag(index, event)"
              />
            </div>
          </div>
        </template>

        <!-- 桌面端布局：左右排列 -->
        <template v-else>
          <!-- 左侧：散乱的拼图块 -->
          <div class="pieces-area">
            <h4>拼图块</h4>
            <div class="scattered-pieces">
              <PuzzlePieceCanvas
                v-for="(piece, index) in pieces"
                :key="`piece-${index}`"
                v-show="!piece.isPlaced"
                :piece="piece"
                :puzzle-data="puzzleData!"
                :grid-cols="gridCols"
                :grid-rows="gridRows"
                :piece-width="viewModel.pieceWidth"
                :piece-height="viewModel.pieceHeight"
                :is-dragging="draggingPieceIndex === index"
                :is-placed="false"
                :show-number="true"
                :number-display-mode="'minimal'"
                @mousedown="(event) => startDrag(index, event)"
                @touchstart="(event) => startDrag(index, event)"
              />
            </div>
          </div>

          <!-- 右侧：目标拼图网格 -->
          <div class="target-area">
            <h4>目标区域</h4>
            <div class="puzzle-grid" :style="gridStyle as any">
              <!-- 网格占位符 -->
              <div
                v-for="index in totalPieces"
                :key="`slot-${index}`"
                class="grid-slot"
                :class="{ 'occupied': isSlotOccupied(index - 1) }"
              >
                <span class="slot-number">{{ index }}</span>
              </div>
              
              <!-- 已放置的拼图块 -->
              <PuzzlePieceCanvas
                v-for="(piece, index) in pieces"
                :key="`placed-${index}`"
                v-show="piece.isPlaced"
                :piece="piece"
                :puzzle-data="puzzleData!"
                :grid-cols="gridCols"
                :grid-rows="gridRows"
                :piece-width="viewModel.pieceWidth"
                :piece-height="viewModel.pieceHeight"
                :is-dragging="draggingPieceIndex === index"
                :is-placed="true"
                :show-number="true"
                :number-display-mode="'minimal'"
                @mousedown="(event) => startDrag(index, event)"
                @touchstart="(event) => startDrag(index, event)"
              />
            </div>
          </div>
        </template>
      </div>

      <!-- 桌面端控制按钮 -->
      <div v-if="!isMobile" class="controls">
        <button @click="shufflePieces" class="control-btn">
          🔀 打乱
        </button>
        <button @click="resetPuzzle" class="control-btn">
          🔄 重置
        </button>
        <button @click="autoSolve" class="control-btn">
          ✨ 自动完成
        </button>
        <button @click="toggleHint" class="control-btn hint-btn">
          💡 提示
        </button>
      </div>

      <!-- 移动端悬浮控制面板 -->
      <div v-if="isMobile" class="mobile-control-panel">
        <!-- 悬浮按钮 -->
        <button @click="toggleMobileControls" class="mobile-control-toggle">
          <span class="toggle-icon">⚙️</span>
        </button>
        
        <!-- 控制面板 -->
        <div v-if="showMobileControls" class="mobile-controls-overlay" @click="closeMobileControls">
          <div class="mobile-controls-content" @click.stop>
            <div class="mobile-controls-header">
              <h3>游戏控制</h3>
              <button @click="closeMobileControls" class="close-btn">×</button>
            </div>
            <div class="mobile-controls-grid">
              <button @click="handleShufflePieces" class="mobile-control-btn">
                <span class="control-icon">🔀</span>
                <span class="control-text">打乱</span>
              </button>
              <button @click="handleResetPuzzle" class="mobile-control-btn">
                <span class="control-icon">🔄</span>
                <span class="control-text">重置</span>
              </button>
              <button @click="handleAutoSolve" class="mobile-control-btn">
                <span class="control-icon">✨</span>
                <span class="control-text">自动完成</span>
              </button>
              <button @click="handleToggleHint" class="mobile-control-btn hint-btn">
                <span class="control-icon">💡</span>
                <span class="control-text">提示</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 提示原图弹窗 -->
      <div v-if="showHint" class="hint-modal" @click="closeHint">
        <div class="hint-content" @click.stop>
          <div class="hint-header">
            <h3>拼图原图</h3>
            <button @click="closeHint" class="close-btn">×</button>
          </div>
          <div class="hint-image-container">
            <img :src="image?.src" :alt="puzzleData.name" class="hint-image" />
          </div>
          <div class="hint-footer">
            <button @click="closeHint" class="confirm-btn">确认</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="no-puzzle">
      <p>请选择一个拼图开始游戏</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, nextTick, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { PuzzleBoardViewModel } from '../viewModels/game/puzzleBoardViewModel'
import type { PieceStatus, PuzzleData } from '../types'
import { GameController } from '@/viewModels/game/gameController'
import PuzzlePieceCanvas from './PuzzlePieceCanvas.vue'
import { imageCache as imageCacheManager } from '../utils/imageCache'

interface Props {
  controller: GameController,
  puzzleData: PuzzleData | null
}

const props = defineProps<Props>()

// 获取store实例
const gameStore = useGameStore()

// 移动端状态
const isMobile = ref(false)
const showMobileControls = ref(false)

// 检测移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// 切换移动端控制面板
const toggleMobileControls = () => {
  showMobileControls.value = !showMobileControls.value
}

// 关闭移动端控制面板
const closeMobileControls = () => {
  showMobileControls.value = false
}

// 移动端控制按钮处理方法
const handleShufflePieces = () => {
  shufflePieces()
  closeMobileControls()
}

const handleResetPuzzle = () => {
  resetPuzzle()
  closeMobileControls()
}

const handleAutoSolve = () => {
  autoSolve()
  closeMobileControls()
}

const handleToggleHint = () => {
  toggleHint()
  closeMobileControls()
}

// 创建ViewModel实例
// 视图状态
const viewModel = ref<PuzzleBoardViewModel>(new PuzzleBoardViewModel(props.puzzleData))
const isInitializing = ref(false) // 防护标记，避免初始化时触发循环
const showHint = ref(false) // 控制提示原图显示状态

// 设置游戏完成回调
const handleGameCompleted = () => {
  console.log('PuzzleBoard: 游戏完成回调被触发')
  if (props.controller) {
    console.log('PuzzleBoard: 调用controller.handleGameCompleted()')
    props.controller.handleGameCompleted()
  } else {
    console.log('PuzzleBoard: controller不存在')
  }
}

viewModel.value.setOnGameCompletedCallback(handleGameCompleted)

// 计算属性 - 从ViewModel获取
const totalPieces = computed(() => viewModel.value.totalPieces)
const gridRows = computed(() => viewModel.value.gridRows)
const gridCols = computed(() => viewModel.value.gridCols)
const pieces = computed(() => viewModel.value.pieces)
const draggingPieceIndex = computed(() => viewModel.value.draggingPieceIndex)
const gridStyle = computed(() => viewModel.value.getGridStyle())

// 视图方法 - 委托给ViewModel
const getPieceImageStyle = (piece: PieceStatus) => viewModel.value.getPieceImageStyle(piece)
const getPieceStyle = (piece: PieceStatus) => viewModel.value.getPieceStyle(piece)
const getPlacedPieceStyle = (piece: PieceStatus) => viewModel.value.getPlacedPieceStyle(piece)
const isSlotOccupied = (slotIndex: number) => viewModel.value.isSlotOccupied(slotIndex)

// 业务操作方法 - 委托给ViewModel
const shufflePieces = () => viewModel.value.shufflePieces()
const resetPuzzle = () => {
  viewModel.value.resetPuzzle()
  props.controller.restartGame()
}
const autoSolve = () => viewModel.value.autoSolve()

// 提示功能相关方法
const toggleHint = () => {
  showHint.value = !showHint.value
}

const closeHint = () => {
  showHint.value = false
}

// 缓存网格矩形，避免频繁DOM查询
let cachedGridRect: DOMRect | null = null
let gridRectCacheTime = 0
const GRID_RECT_CACHE_DURATION = 1000 // 1秒缓存

const getCachedGridRect = (): DOMRect | null => {
  const now = Date.now()
  if (!cachedGridRect || now - gridRectCacheTime > GRID_RECT_CACHE_DURATION) {
    const gridElement = document.querySelector('.puzzle-grid')
    if (gridElement) {
      cachedGridRect = gridElement.getBoundingClientRect()
      gridRectCacheTime = now
    }
  }
  return cachedGridRect
}

// 拖拽处理方法
const startDrag = (index: number, event: MouseEvent | TouchEvent) => {
  event.preventDefault()
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  viewModel.value.startDrag(index, clientX, clientY)
  
  // 预缓存网格矩形
  getCachedGridRect()
  
  document.addEventListener('mousemove', handleDrag, { passive: true })
  document.addEventListener('mouseup', stopDrag, { passive: true })
  document.addEventListener('touchmove', handleDrag, { passive: true })
  document.addEventListener('touchend', stopDrag, { passive: true })
}

// 节流处理，提升拖拽性能
let lastDragTime = 0
const DRAG_THROTTLE_MS = 16 // 约60fps

const handleDrag = (event: MouseEvent | TouchEvent) => {
  if (draggingPieceIndex.value === -1) return
  
  const now = Date.now()
  if (now - lastDragTime < DRAG_THROTTLE_MS) return
  lastDragTime = now
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  viewModel.value.handleDrag(clientX, clientY)
}

const stopDrag = (event: MouseEvent | TouchEvent) => {
  if (draggingPieceIndex.value === -1) return
  
  const clientX = 'touches' in event ? (event.changedTouches?.[0]?.clientX ?? 0) : event.clientX
  const clientY = 'touches' in event ? (event.changedTouches?.[0]?.clientY ?? 0) : event.clientY
  
  const gridRect = getCachedGridRect()
  
  viewModel.value.stopDrag(clientX, clientY, gridRect)
  
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', stopDrag)
  
  // 清除缓存，下次拖拽时重新获取
  cachedGridRect = null
}

// 完整图片提示
const image = ref<HTMLImageElement | null>(null)
const loadImage = async (url: string) => {
  image.value = await imageCacheManager.getImage(url)
}

const initializePuzzle = async (puzzleData: PuzzleData | null) => {
  if (puzzleData) {
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    try {
      isInitializing.value = true

      const restored = viewModel.value.pieces.length == viewModel.value.totalPieces
      if (restored) {
        console.log('成功恢复拼图块位置')
      } else {
        console.log('初始化新拼图')
        viewModel.value.initializePieces()
      }
      
      isInitializing.value = false
      
    } catch (error) {
      console.error('初始化拼图块时出错:', error)
      if (puzzleData) {
        viewModel.value.initializePieces()
      }
      isInitializing.value = false
    }
  } else {
    gameStore.clearPuzzleBoardPieces()
  }
  loadImage(puzzleData?.imageUrl || '')
  await nextTick()
  shufflePieces()
}

// 生命周期管理
onMounted(async () => {
  console.log('PuzzleBoard onMounted, puzzleData:', props.puzzleData)
  checkMobile()
  window.addEventListener('resize', checkMobile)
  await initializePuzzle(props.puzzleData)
})

// 监听拼图数据变化
watch(() => props.puzzleData, async (newPuzzleData) => {
  // 重新创建 ViewModel 实例以更新 puzzleData
  viewModel.value = new PuzzleBoardViewModel(newPuzzleData)
  // 重新设置游戏完成回调
  viewModel.value.setOnGameCompletedCallback(handleGameCompleted)
  
  await initializePuzzle(newPuzzleData)
})

// 监听GameStore pieces变化
watch(() => gameStore.pieces, (newPieces, oldPieces) => {
  // 如果正在初始化，跳过处理避免循环
  if (isInitializing.value) {
    return
  }
  
  if (!props.puzzleData || gameStore.currentPuzzle?.id !== props.puzzleData.id) {
    return
  }
  
  try {
    // 只有当从有数据变为无数据时才重新初始化，避免无限循环
    if (newPieces.length === 0 && oldPieces && oldPieces.length > 0) {
      console.log('GameStore pieces被清空，重新初始化')
      isInitializing.value = true
      viewModel.value.initializePieces()
      isInitializing.value = false
    }
    // 移除了对有数据情况的处理，避免循环调用
  } catch (error) {
    console.error('处理GameStore pieces变化时出错:', error)
    isInitializing.value = false
  }
}, { deep: true })
</script>

<style scoped>
.puzzle-board {
  @apply flex flex-col items-center p-6;
  background-color: var(--settings-bg);
  overflow-y: auto;
  height: 100%;
}

.puzzle-container {
  @apply flex flex-col items-center space-y-6;
}

.puzzle-info {
  @apply text-center;
}

.puzzle-info h3 {
  @apply text-2xl font-bold mb-2;
  color: var(--settings-text-primary);
}

.puzzle-info p {
  @apply text-gray-600;
  color: var(--settings-text-secondary);
}

.game-area {
  @apply flex space-x-8;
}

/* 移动端布局 */
.game-area.mobile-layout {
  @apply flex-col space-x-0 space-y-6;
}

.pieces-area {
  @apply flex flex-col;
}

.puzzle-grid {
  @apply inline-block p-4 rounded-lg;
  background-color: var(--settings-card-bg);
  border: 2px dashed var(--settings-border);
  box-sizing: border-box; /* 确保border和padding包含在尺寸内 */
}

.pieces-area h4 {
  @apply text-lg font-semibold mb-4 text-center;
  color: var(--settings-text-primary);
}

.scattered-pieces {
  @apply relative bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg;
  width: 320px;
  height: 420px;
  overflow: visible;
  background-color: var(--settings-card-bg);
  border-color: var(--settings-border);
}

/* 移动端散乱拼图块区域 */
.mobile-scattered {
  width: 100%;
  max-width: 400px;
  height: 250px; /* 减少高度，为控制按钮留出空间 */
  margin: 0 auto;
  /* 确保内容可以滚动 */
  overflow-y: visible;
  overflow-x: visible;
}

.target-area {
  @apply flex flex-col;
}

.target-area h4 {
  @apply text-lg font-semibold text-gray-700 mb-4 text-center;
  color: var(--settings-text-primary);
}

.puzzle-piece {
  @apply transition-all duration-200;
  user-select: none;
}

.puzzle-piece:hover {
  transform: scale(1.02);
}

.puzzle-piece.dragging {
  @apply shadow-2xl;
  transform: scale(1.05) !important;
  cursor: grabbing !important;
}

.puzzle-piece.placed.correct {
  @apply shadow-md;
  animation: correctPlacement 0.5s ease-out;
}

.puzzle-piece.placed.incorrect {
  animation: incorrectPlacement 0.4s ease-out;
}

@keyframes correctPlacement {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(39, 174, 96, 0.6); }
  100% { transform: scale(1); }
}

@keyframes incorrectPlacement {
  0% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
  75% { transform: translateX(-4px); }
  100% { transform: translateX(0); }
}

.piece-image {
  @apply relative w-full h-full;
}

.piece-number {
  @apply absolute top-1 left-1 text-xs bg-black bg-opacity-70 text-white px-1 rounded;
}

.grid-slot {
  @apply border border-gray-300 bg-gray-50 flex items-center justify-center;
  @apply transition-colors duration-200;
  background-color: var(--settings-card-bg);
  border-color: var(--settings-border);
  box-sizing: border-box; /* 确保border包含在尺寸内 */
}

.grid-slot:hover {
  @apply bg-blue-50 border-blue-300;
  background-color: var(--settings-hover);
  border-color: var(--settings-accent);
}

.grid-slot.occupied {
  @apply bg-transparent border-transparent;
}

.slot-number {
  @apply text-xs text-gray-400 font-mono;
  color: var(--settings-text-secondary);
}

.controls {
  @apply flex space-x-4;
}

/* 移动端悬浮控制面板 */
.mobile-control-panel {
  @apply fixed bottom-4 right-4 z-50;
}

.mobile-control-toggle {
  @apply w-14 h-14 rounded-full shadow-lg transition-all duration-300;
  background-color: var(--settings-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  border: none;
  cursor: pointer;
}

.mobile-control-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.mobile-control-toggle:active {
  transform: scale(0.95);
}

.mobile-controls-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center;
  z-index: 60;
}

.mobile-controls-content {
  @apply bg-white rounded-lg shadow-xl mx-4 max-w-sm w-full;
  background-color: var(--settings-card-bg);
  border: 1px solid var(--settings-border);
  max-height: 80vh;
  overflow-y: auto;
}

.mobile-controls-header {
  @apply flex justify-between items-center p-4 border-b;
  border-color: var(--settings-border);
}

.mobile-controls-header h3 {
  @apply text-lg font-semibold;
  color: var(--settings-text-primary);
}

.mobile-controls-grid {
  @apply grid grid-cols-2 gap-3 p-4;
}

.mobile-control-btn {
  @apply flex flex-col items-center justify-center p-4 rounded-lg transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
  min-height: 80px;
  border: none;
  cursor: pointer;
}

.mobile-control-btn:hover {
  background-color: var(--settings-border);
}

.mobile-control-btn.hint-btn {
  background-color: var(--settings-accent);
  color: white;
}

.mobile-control-btn.hint-btn:hover {
  background-color: var(--settings-accent-hover);
}

.mobile-control-btn .control-icon {
  @apply text-2xl mb-2;
}

.mobile-control-btn .control-text {
  @apply text-sm font-medium;
}

.control-btn {
  @apply px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600;
  @apply transition-colors duration-200 font-medium;
  background-color: var(--settings-accent);
  color: white;
}

.control-btn:hover {
  background-color: var(--settings-accent-hover, #2563eb);
}

.hint-btn {
  background-color: var(--settings-accent, #3b82f6);
}

.hint-btn:hover {
  background-color: var(--settings-accent-hover, #2563eb);
}

.hint-modal {
  @apply fixed inset-0 flex items-center justify-center z-50;
  background-color: rgba(0, 0, 0, 0.75);
}

.hint-content {
  @apply bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col;
  background-color: var(--settings-card-bg);
  border: 1px solid var(--settings-border);
}

/* 移动端提示弹窗 */
@media (max-width: 767px) {
  .hint-content {
    @apply max-w-[95vw] mx-2;
  }
  
  .hint-image {
    @apply max-h-[60vh];
  }
}

.hint-header {
  @apply flex justify-between items-center p-4 border-b;
  border-color: var(--settings-border);
}

.hint-header h3 {
  @apply text-xl font-bold;
  color: var(--settings-text-primary);
}

.close-btn {
  @apply text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full;
  color: var(--settings-text-secondary);
  background-color: transparent;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: var(--settings-hover-bg);
}

.hint-image-container {
  @apply p-4 overflow-auto flex-grow;
}

.hint-image {
  @apply max-w-full max-h-[70vh] object-contain mx-auto;
}

.hint-footer {
  @apply p-4 border-t flex justify-center;
  border-color: var(--settings-border);
}

.confirm-btn {
  @apply px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600;
  @apply transition-colors duration-200 font-medium;
  background-color: var(--settings-accent, #3b82f6);
  color: white;
}

.confirm-btn:hover {
  background-color: var(--settings-accent-hover, #2563eb);
}

.no-puzzle {
  @apply text-center text-gray-500 text-lg;
  color: var(--settings-text-secondary);
}
</style>
