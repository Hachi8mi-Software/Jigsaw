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
      <div class="game-area">
        <!-- 左侧：散乱的拼图块 -->
        <div class="pieces-area">
          <h4>拼图块</h4>
          <div class="scattered-pieces">
            <!-- 使用Canvas渲染的拼图块 -->
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
            <!-- 使用Canvas渲染的已放置拼图块 -->
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
      </div>

      <!-- 控制按钮 -->
      <div class="controls">
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
      
      <!-- 提示原图弹窗 -->
      <div v-if="showHint" class="hint-modal" @click="closeHint">
        <div class="hint-content" @click.stop>
          <div class="hint-header">
            <h3>拼图原图</h3>
            <button @click="closeHint" class="close-btn">×</button>
          </div>
          <div class="hint-image-container">
            <img :src="puzzleData.imageUrl" :alt="puzzleData.name" class="hint-image" />
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

interface Props {
  controller: GameController,
  puzzleData: PuzzleData | null
}

const props = defineProps<Props>()

// 获取store实例
const gameStore = useGameStore()

// 创建ViewModel实例
// 视图状态
const viewModel = ref<PuzzleBoardViewModel>(new PuzzleBoardViewModel(props.puzzleData))
const isInitializing = ref(false) // 防护标记，避免初始化时触发循环
const showHint = ref(false) // 控制提示原图显示状态

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

// 拖拽处理方法
const startDrag = (index: number, event: MouseEvent | TouchEvent) => {
  event.preventDefault()
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  viewModel.value.startDrag(index, clientX, clientY)
  
  document.addEventListener('mousemove', handleDrag, { passive: false })
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', handleDrag, { passive: false })
  document.addEventListener('touchend', stopDrag)
}

const handleDrag = (event: MouseEvent | TouchEvent) => {
  if (draggingPieceIndex.value === -1) return
  
  event.preventDefault()
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  viewModel.value.handleDrag(clientX, clientY)
}

const stopDrag = (event: MouseEvent | TouchEvent) => {
  if (draggingPieceIndex.value === -1) return
  
  event.preventDefault()
  
  const clientX = 'touches' in event ? (event.changedTouches?.[0]?.clientX ?? 0) : event.clientX
  const clientY = 'touches' in event ? (event.changedTouches?.[0]?.clientY ?? 0) : event.clientY
  
  const gridRect = document.querySelector('.puzzle-grid')?.getBoundingClientRect()
  
  viewModel.value.stopDrag(clientX, clientY, gridRect || null)
  
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', stopDrag)
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
}

// 生命周期管理
onMounted(async () => {
  console.log('PuzzleBoard onMounted, puzzleData:', props.puzzleData)
  await initializePuzzle(props.puzzleData)
})

// 监听拼图数据变化
watch(() => props.puzzleData, async (newPuzzleData) => {
  // 重新创建 ViewModel 实例以更新 puzzleData
  viewModel.value = new PuzzleBoardViewModel(newPuzzleData)
  
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
  @apply flex flex-col items-center p-6 min-h-screen;
  background-color: var(--settings-bg);
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
