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
            <div
              v-for="(piece, index) in pieces"
              :key="`piece-${index}`"
              v-show="!piece.isPlaced"
              class="puzzle-piece"
              :class="{ 'dragging': draggingPieceIndex === index }"
              :style="getPieceStyle(piece)"
              @mousedown="startDrag(index, $event)"
              @touchstart="startDrag(index, $event)"
            >
              <div 
                class="piece-image"
                :style="getPieceImageStyle(piece)"
              >
                <span class="piece-number">{{ piece.originalIndex + 1 }}</span>
              </div>
            </div>
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
            <div
              v-for="(piece, index) in pieces"
              :key="`placed-${index}`"
              v-show="piece.isPlaced"
              class="puzzle-piece placed"
              :class="{ 
                'correct': piece.isCorrect,
                'incorrect': piece.isCorrect === false,
                'dragging': draggingPieceIndex === index
              }"
              :style="getPlacedPieceStyle(piece)"
              @mousedown="startDrag(index, $event)"
              @touchstart="startDrag(index, $event)"
            >
              <div 
                class="piece-image"
                :style="getPieceImageStyle(piece)"
              >
                <span class="piece-number">{{ piece.originalIndex + 1 }}</span>
              </div>
            </div>
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
import { PuzzleBoardViewModel } from '../viewModels/puzzleBoardViewModel'
import type { PuzzleData } from '../types'
import { GameController } from '@/viewModels/gameController'

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

// 计算属性 - 从ViewModel获取
const totalPieces = computed(() => viewModel.value.totalPieces)
const gridRows = computed(() => viewModel.value.gridRows)
const gridCols = computed(() => viewModel.value.gridCols)
const pieces = computed(() => viewModel.value.pieces)
const draggingPieceIndex = computed(() => viewModel.value.draggingPieceIndex)
const gridStyle = computed(() => viewModel.value.getGridStyle())

// 视图方法 - 委托给ViewModel
const getPieceImageStyle = (piece: any) => viewModel.value.getPieceImageStyle(piece)
const getPieceStyle = (piece: any) => viewModel.value.getPieceStyle(piece)
const getPlacedPieceStyle = (piece: any) => viewModel.value.getPlacedPieceStyle(piece)
const isSlotOccupied = (slotIndex: number) => viewModel.value.isSlotOccupied(slotIndex)

// 业务操作方法 - 委托给ViewModel
const shufflePieces = () => viewModel.value.shufflePieces()
const resetPuzzle = () => {
  viewModel.value.resetPuzzle()
  props.controller.restartGame()
}
const autoSolve = () => viewModel.value.autoSolve()

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

// 生命周期管理
onMounted(async () => {
  console.log('PuzzleBoard onMounted, puzzleData:', props.puzzleData)
  
  if (props.puzzleData) {
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    try {
      isInitializing.value = true // 开始初始化
      
      // 尝试从localStorage恢复状态
      const restored = viewModel.value.restoreFromLocalStorage()
      if (restored) {
        console.log('成功恢复拼图块位置')
      } else {
        console.log('初始化新游戏')
        viewModel.value.initializePieces()
      }
      
      isInitializing.value = false // 初始化完成
      
    } catch (error) {
      console.error('初始化拼图块时出错:', error)
      if (props.puzzleData) {
        viewModel.value.initializePieces()
      }
      isInitializing.value = false
    }
  } else {
    gameStore.clearPuzzleBoardPieces()
  }
})

// 监听拼图数据变化
watch(() => props.puzzleData, async (newPuzzleData) => {
  if (newPuzzleData) {
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    try {
      isInitializing.value = true
      
      const restored = viewModel.value.restoreFromLocalStorage()
      if (restored) {
        console.log('成功恢复拼图块位置')
      } else {
        console.log('初始化新拼图')
        viewModel.value.initializePieces()
      }
      
      isInitializing.value = false
      
    } catch (error) {
      console.error('处理拼图数据变化时出错:', error)
      if (newPuzzleData) {
        viewModel.value.initializePieces()
      }
      isInitializing.value = false
    }
  } else {
    gameStore.clearPuzzleBoardPieces()
  }
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
  @apply flex flex-col items-center p-6 bg-gray-50 min-h-screen;
}

.puzzle-container {
  @apply flex flex-col items-center space-y-6;
}

.puzzle-info {
  @apply text-center;
}

.puzzle-info h3 {
  @apply text-2xl font-bold text-gray-800 mb-2;
}

.puzzle-info p {
  @apply text-gray-600;
}

.game-area {
  @apply flex space-x-8;
}

.pieces-area {
  @apply flex flex-col;
}

.pieces-area h4 {
  @apply text-lg font-semibold text-gray-700 mb-4 text-center;
}

.scattered-pieces {
  @apply relative bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg;
  width: 320px;
  height: 420px;
  overflow: visible;
}

.target-area {
  @apply flex flex-col;
}

.target-area h4 {
  @apply text-lg font-semibold text-gray-700 mb-4 text-center;
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
}

.grid-slot:hover {
  @apply bg-blue-50 border-blue-300;
}

.grid-slot.occupied {
  @apply bg-transparent border-transparent;
}

.slot-number {
  @apply text-xs text-gray-400 font-mono;
}

.controls {
  @apply flex space-x-4;
}

.control-btn {
  @apply px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600;
  @apply transition-colors duration-200 font-medium;
}

.no-puzzle {
  @apply text-center text-gray-500 text-lg;
}
</style>
