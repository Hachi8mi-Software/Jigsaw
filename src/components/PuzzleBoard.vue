<!--
  重构后的拼图游戏板组件
  参考SimplePuzzleGame的简洁实现
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
import { computed, ref, onMounted, watch } from 'vue'
import { useGameStore } from '../stores/game'
import type { PuzzleData } from '../types'

interface Props {
  puzzleData: PuzzleData | null
}

const props = defineProps<Props>()

// 获取游戏store
const gameStore = useGameStore()

// 拼图块状态 - 简化后的数据结构
interface Piece {
  originalIndex: number      // 原始索引（正确位置）
  currentX: number          // 当前X坐标
  currentY: number          // 当前Y坐标
  isPlaced: boolean         // 是否已放置
  isCorrect?: boolean       // 是否放在正确位置
  gridPosition?: number     // 网格位置索引
}

const pieces = ref<Piece[]>([])
const draggingPieceIndex = ref(-1)
const dragOffset = ref({ x: 0, y: 0 })

// 计算属性
const totalPieces = computed(() => {
  return props.puzzleData ? 
    props.puzzleData.gridConfig.rows * props.puzzleData.gridConfig.cols : 0
})

const gridRows = computed(() => {
  return props.puzzleData?.gridConfig.rows || 0
})

const gridCols = computed(() => {
  return props.puzzleData?.gridConfig.cols || 0
})

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${gridCols.value}, 1fr)`,
  gridTemplateRows: `repeat(${gridRows.value}, 1fr)`,
  gap: '2px',
  width: '400px',
  height: '300px',
  border: '2px solid #ccc',
  borderRadius: '8px',
  padding: '8px',
  backgroundColor: '#f9f9f9',
  position: 'relative'
}))

const pieceSize = computed(() => {
  // 计算每个网格单元的实际尺寸
  const availableWidth = 400 - 16 - (gridCols.value - 1) * 2
  const availableHeight = 300 - 16 - (gridRows.value - 1) * 2
  
  return {
    width: Math.floor(availableWidth / gridCols.value),
    height: Math.floor(availableHeight / gridRows.value)
  }
})

// 方法
const getPieceImageStyle = (piece: Piece) => {
  if (!props.puzzleData) return {}
  
  const correctRow = Math.floor(piece.originalIndex / gridCols.value)
  const correctCol = piece.originalIndex % gridCols.value
  
  return {
    backgroundImage: `url(${props.puzzleData.imageUrl})`,
    backgroundSize: `${gridCols.value * 100}% ${gridRows.value * 100}%`,
    backgroundPosition: `-${correctCol * 100}% -${correctRow * 100}%`,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: 'bold',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
  }
}

const getPieceStyle = (piece: Piece) => {
  return {
    position: 'absolute' as const,
    left: `${piece.currentX}px`,
    top: `${piece.currentY}px`,
    width: `${pieceSize.value.width}px`,
    height: `${pieceSize.value.height}px`,
    border: '2px solid #666',
    borderRadius: '4px',
    cursor: 'grab',
    overflow: 'hidden',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    zIndex: draggingPieceIndex.value === piece.originalIndex ? 1000 : 10,
    transform: draggingPieceIndex.value === piece.originalIndex ? 'scale(1.05)' : 'scale(1)',
    transition: draggingPieceIndex.value === piece.originalIndex ? 'none' : 'transform 0.2s ease'
  }
}

const getPlacedPieceStyle = (piece: Piece) => {
  const gridIndex = piece.gridPosition || 0
  const row = Math.floor(gridIndex / gridCols.value)
  const col = gridIndex % gridCols.value
  
  // 如果正在拖拽，使用拖拽位置
  if (draggingPieceIndex.value === piece.originalIndex) {
    return {
      position: 'absolute' as const,
      left: `${piece.currentX}px`,
      top: `${piece.currentY}px`,
      width: `${pieceSize.value.width}px`,
      height: `${pieceSize.value.height}px`,
      border: piece.isCorrect ? '2px solid #27ae60' : '2px solid #e74c3c',
      borderRadius: '4px',
      overflow: 'hidden',
      backgroundColor: 'white',
      zIndex: 1000,
      transform: 'scale(1.05)',
      transition: 'none',
      cursor: 'grabbing'
    }
  }
  
  // 正常放置位置
  return {
    position: 'absolute' as const,
    left: `${8 + col * (pieceSize.value.width + 2)}px`,
    top: `${8 + row * (pieceSize.value.height + 2)}px`,
    width: `${pieceSize.value.width}px`,
    height: `${pieceSize.value.height}px`,
    border: piece.isCorrect ? '2px solid #27ae60' : '2px solid #e74c3c',
    borderRadius: '4px',
    overflow: 'hidden',
    backgroundColor: 'white',
    zIndex: 5,
    cursor: 'grab'
  }
}

const initializePieces = () => {
  if (!props.puzzleData) return
  
  const total = totalPieces.value
  const piecesAreaWidth = 300
  const piecesAreaHeight = 400
  
  // 初始化所有拼图块
  pieces.value = Array.from({ length: total }, (_, i) => ({
    originalIndex: i,
    currentX: Math.random() * (piecesAreaWidth - pieceSize.value.width),
    currentY: Math.random() * (piecesAreaHeight - pieceSize.value.height),
    isPlaced: false
  }))
  
  // 同步状态到GameStore
  syncPiecesToStore()
}

const shufflePieces = () => {
  if (!props.puzzleData) return
  
  const piecesAreaWidth = 300
  const piecesAreaHeight = 400
  
  // 重新随机散布所有未放置的拼图块
  pieces.value.forEach(piece => {
    if (!piece.isPlaced) {
      piece.currentX = Math.random() * (piecesAreaWidth - pieceSize.value.width)
      piece.currentY = Math.random() * (piecesAreaHeight - pieceSize.value.height)
    }
  })
  
  // 通知GameStore更新步数
  gameStore.moveCount++
  
  // 同步状态到GameStore
  syncPiecesToStore()
}

const resetPuzzle = () => {
  // 重置所有拼图块
  pieces.value.forEach(piece => {
    piece.isPlaced = false
    piece.isCorrect = undefined
    piece.gridPosition = undefined
  })
  
  initializePieces()
  
  // 通知GameStore重置游戏
  gameStore.resetGame()
  
  // 同步状态到GameStore
  syncPiecesToStore()
}

const autoSolve = () => {
  if (!props.puzzleData) return
  
  // 将所有拼图块放到正确位置
  pieces.value.forEach((piece, index) => {
    piece.isPlaced = true
    piece.isCorrect = true
    piece.gridPosition = piece.originalIndex
  })
  
  // 同步状态到GameStore
  syncPiecesToStore()
  
  // 检查游戏是否完成
  checkGameCompletion()
}

const isSlotOccupied = (slotIndex: number): boolean => {
  return pieces.value.some(piece => piece.isPlaced && piece.gridPosition === slotIndex)
}

// 检查游戏完成状态
const checkGameCompletion = () => {
  const allPlaced = pieces.value.every(p => p.isPlaced)
  const allCorrect = pieces.value.every(p => p.isCorrect)
  
  if (allPlaced && allCorrect) {
    console.log('拼图完成！')
    // 通知GameStore游戏完成
    gameStore.completeGame()
  }
}

// 简化的拖拽逻辑
const startDrag = (index: number, event: MouseEvent | TouchEvent) => {
  event.preventDefault()
  
  const piece = pieces.value[index]
  if (!piece) return
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  // 计算偏移量
  if (piece.isPlaced) {
    // 已放置的拼图块，计算相对于网格的偏移
    const gridIndex = piece.gridPosition || 0
    const row = Math.floor(gridIndex / gridCols.value)
    const col = gridIndex % gridCols.value
    const pieceXInGrid = col * (pieceSize.value.width + 2) + 8
    const pieceYInGrid = row * (pieceSize.value.height + 2) + 8
    
    // 临时设置拖拽位置
    piece.currentX = pieceXInGrid
    piece.currentY = pieceYInGrid
  }
  
  dragOffset.value = {
    x: clientX - piece.currentX,
    y: clientY - piece.currentY
  }
  
  draggingPieceIndex.value = index
  
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
  
  const piece = pieces.value[draggingPieceIndex.value]
  if (!piece) return
  
  // 更新拼图块位置
  piece.currentX = clientX - dragOffset.value.x
  piece.currentY = clientY - dragOffset.value.y
}

const stopDrag = (event: MouseEvent | TouchEvent) => {
  if (draggingPieceIndex.value === -1) return
  
  event.preventDefault()
  
  const piece = pieces.value[draggingPieceIndex.value]
  if (!piece) return
  
  const clientX = 'touches' in event ? (event.changedTouches?.[0]?.clientX ?? 0) : event.clientX
  const clientY = 'touches' in event ? (event.changedTouches?.[0]?.clientY ?? 0) : event.clientY
  
  // 检查是否在目标网格区域内
  const gridRect = document.querySelector('.puzzle-grid')?.getBoundingClientRect()
  if (gridRect && 
      clientX >= gridRect.left && clientX <= gridRect.right &&
      clientY >= gridRect.top && clientY <= gridRect.bottom) {
    
    // 计算最接近的网格位置
    const relativeX = clientX - gridRect.left
    const relativeY = clientY - gridRect.top
    
    // 考虑padding和gap，计算网格位置
    const gridCol = Math.floor((relativeX - 8) / (pieceSize.value.width + 2))
    const gridRow = Math.floor((relativeY - 8) / (pieceSize.value.height + 2))
    const gridIndex = gridRow * gridCols.value + gridCol
    
    // 检查网格位置是否有效且未被占据
    if (gridIndex >= 0 && gridIndex < totalPieces.value && !isSlotOccupied(gridIndex)) {
      // 吸附到网格
      snapToGrid(draggingPieceIndex.value, gridIndex)
    } else if (piece.isPlaced) {
      // 已放置拼图块回到原位置
      resetPlacedPiecePosition(draggingPieceIndex.value)
    }
  } else if (piece.isPlaced) {
    // 已放置拼图块拖拽到网格外，回到原位置
    resetPlacedPiecePosition(draggingPieceIndex.value)
  }
  
  draggingPieceIndex.value = -1
  
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', stopDrag)
}

// 吸附到网格
const snapToGrid = (pieceIndex: number, gridIndex: number) => {
  const piece = pieces.value[pieceIndex]
  if (!piece) return
  
  // 检查是否是正确位置
  const isCorrect = piece.originalIndex === gridIndex
  
  // 更新拼图块状态
  piece.isPlaced = true
  piece.isCorrect = isCorrect
  piece.gridPosition = gridIndex
  
  // 计算网格中的实际位置
  const row = Math.floor(gridIndex / gridCols.value)
  const col = gridIndex % gridCols.value
  piece.currentX = 8 + col * (pieceSize.value.width + 2)
  piece.currentY = 8 + row * (pieceSize.value.height + 2)
  
  // 通知GameStore更新步数
  gameStore.moveCount++
  
  // 同步状态到GameStore
  syncPiecesToStore()
  
  // 显示反馈
  if (isCorrect) {
    console.log('正确放置！')
  } else {
    console.log('位置不正确')
  }
  
  // 检查是否完成
  checkGameCompletion()
}

// 重置已放置拼图块位置
const resetPlacedPiecePosition = (pieceIndex: number) => {
  const piece = pieces.value[pieceIndex]
  if (!piece || !piece.isPlaced) return
  
  // 重置到原来的网格位置
  const originalGridIndex = piece.gridPosition || 0
  const row = Math.floor(originalGridIndex / gridCols.value)
  const col = originalGridIndex % gridCols.value
  
  piece.currentX = 8 + col * (pieceSize.value.width + 2)
  piece.currentY = 8 + row * (pieceSize.value.height + 2)
}

// 监听拼图数据变化
onMounted(() => {
  if (props.puzzleData) {
    initializePieces()
  }
})

// 监听游戏状态变化
watch(() => gameStore.isGameActive, (newValue) => {
  if (!newValue && props.puzzleData) {
    console.log('游戏已暂停')
  }
})

// 同步拼图块状态到GameStore
const syncPiecesToStore = () => {
  if (!props.puzzleData) return
  
  const total = totalPieces.value
  
  // 创建PiecePosition数组
  const storePieces = Array.from({ length: total }, (_, i) => {
    const piece = pieces.value.find(p => p.originalIndex === i)
    
    if (piece && piece.isPlaced) {
      return {
        id: `piece_${Math.floor(i / gridCols.value)}_${i % gridCols.value}`,
        x: piece.currentX,
        y: piece.currentY,
        rotation: 0,
        isPlaced: true
      }
    } else {
      return {
        id: `piece_${Math.floor(i / gridCols.value)}_${i % gridCols.value}`,
        x: piece?.currentX || 0,
        y: piece?.currentY || 0,
        rotation: 0,
        isPlaced: false
      }
    }
  })
  
  // 通过placePiece方法更新GameStore状态
  storePieces.forEach((piece, index) => {
    if (piece.isPlaced) {
      gameStore.placePiece(piece.id, true)
    }
  })
}
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
