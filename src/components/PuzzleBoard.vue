<!--
  简化的拼图游戏板组件
  用于演示基本功能
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
        <div class="pieces-area" ref="piecesAreaRef" :style="{ position: 'relative', zIndex: isDraggingFromScattered ? 20 : 1 }">
          <h4>拼图块</h4>
          <div class="scattered-pieces">
            <div
              v-for="(piece, index) in scatteredPieces"
              :key="`scattered-${index}`"
              class="puzzle-piece scattered"
              :class="{ 
                /* 【修正】这里的判断也需要加上 pieceType */
                'dragging': draggedPiece?.pieceType === 'scattered' && draggedPiece?.index === index,
                'selected': selectedPiece === index 
              }"
              :style="getScatteredPieceStyle(piece, index) as any"
              @mousedown="startDrag('scattered', index, $event)"
              @touchstart="startDrag('scattered', index, $event)"
            >
              <div 
                class="piece-image"
                :style="getPieceImageStyle(piece.originalIndex)"
              >
                <span class="piece-number">{{ piece.originalIndex + 1 }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：目标拼图网格 -->
        <div class="target-area" style="position: relative; z-index: 10;">
          <h4>目标区域</h4>
          <div class="puzzle-grid" :style="gridStyle as any" ref="puzzleGridRef">
            <!-- 网格占位符 -->
            <div
              v-for="index in totalPieces"
              :key="`slot-${index}`"
              class="grid-slot"
              :class="{ 'occupied': isSlotOccupied(index - 1) }"
              :data-slot-index="index - 1"
              @drop="handleDrop($event, index - 1)"
              @dragover.prevent
              @dragenter.prevent
            >
              <span class="slot-number">{{ index }}</span>
            </div>
            
            <!-- 已放置的拼图块 -->
            <div
              v-for="(piece, index) in placedPieces"
              :key="`placed-${index}`"
              class="puzzle-piece placed"
              :class="{ 
                'correct': piece.isCorrect,
                'incorrect': piece.isCorrect === false,
                'dragging': piece.isDragging
              }"
              :style="getPlacedPieceStyle(piece)"
              @mousedown="startDrag('placed', index, $event)"
              @touchstart="startDrag('placed', index, $event)"
            >
              <div 
                class="piece-image"
                :style="getPieceImageStyle(piece.originalIndex)"
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
import { computed, ref, onMounted, reactive } from 'vue'
import type { PuzzleData } from '../types'

interface Props {
  puzzleData: PuzzleData | null
}

const props = defineProps<Props>()

// 拼图块状态
interface PieceState {
  originalIndex: number  // 原始索引（正确位置）
  currentX: number       // 当前X坐标
  currentY: number       // 当前Y坐标
  isPlaced: boolean      // 是否已放置
  isCorrect?: boolean    // 是否放在正确位置
  gridPosition?: number  // 网格位置索引
  isDragging?: boolean   // 是否正在拖拽
}

const scatteredPieces = ref<PieceState[]>([])
const placedPieces = ref<PieceState[]>([])
const draggedPiece = ref<{ 
  index: number, 
  piece: PieceState, 
  offsetX: number, 
  offsetY: number,
  pieceType: 'scattered' | 'placed',
  startRect: DOMRect,
  gridRect: DOMRect
} | null>(null)
const selectedPiece = ref<number | null>(null)
const isDraggingFromScattered = ref(false)

// 模板引用
const piecesAreaRef = ref<HTMLElement>()
const puzzleGridRef = ref<HTMLElement>()

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
  // 总宽度400px，减去左右padding 16px，减去gap (cols-1) * 2px
  const availableWidth = 400 - 16 - (gridCols.value - 1) * 2
  const availableHeight = 300 - 16 - (gridRows.value - 1) * 2
  
  return {
    width: Math.floor(availableWidth / gridCols.value),
    height: Math.floor(availableHeight / gridRows.value)
  }
})

// 方法
const getPieceImageStyle = (originalIndex: number) => {
  if (!props.puzzleData) return {}
  
  const correctRow = Math.floor(originalIndex / gridCols.value)
  const correctCol = originalIndex % gridCols.value
  
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

const getScatteredPieceStyle = (piece: PieceState, index: number) => {
  // 【修正】增加 pieceType 的判断，确保只为当前拖拽的、且类型为 scattered 的图块提升 z-index
  const isDraggingThis = draggedPiece.value?.pieceType === 'scattered' && draggedPiece.value?.index === index;
  
  return {
    position: 'absolute',
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
    zIndex: isDraggingThis ? 1000 : 10, // 【修正】使用新的判断变量
    transform: isDraggingThis ? 'scale(1.05)' : 'scale(1)',
    transition: isDraggingThis ? 'none' : 'transform 0.2s ease'
  }
}

const getPlacedPieceStyle = (piece: PieceState) => {
  const gridIndex = piece.gridPosition || 0
  const row = Math.floor(gridIndex / gridCols.value)
  const col = gridIndex % gridCols.value
  
  // 检查是否是当前拖拽的已放置拼图块
  const isDraggingThis = draggedPiece.value?.pieceType === 'placed' && draggedPiece.value?.index === piece.originalIndex;
  
  // 如果正在拖拽，使用拖拽位置
  if (piece.isDragging) {
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
    transform: isDraggingThis ? 'scale(1.05)' : 'scale(1)',
    transition: isDraggingThis ? 'none' : 'transform 0.2s ease',
    cursor: 'grab'
  }
}

const initializePieces = () => {
  if (!props.puzzleData) return
  
  const total = totalPieces.value
  const piecesAreaWidth = 300
  const piecesAreaHeight = 400
  
  // 初始化散乱的拼图块
  scatteredPieces.value = Array.from({ length: total }, (_, i) => ({
    originalIndex: i,
    currentX: Math.random() * (piecesAreaWidth - pieceSize.value.width),
    currentY: Math.random() * (piecesAreaHeight - pieceSize.value.height),
    isPlaced: false
  }))
  
  // 清空已放置的拼图块
  placedPieces.value = []
}

const shufflePieces = () => {
  if (!props.puzzleData) return
  
  const piecesAreaWidth = 300
  const piecesAreaHeight = 400
  
  // 重新随机散布所有未放置的拼图块
  scatteredPieces.value = scatteredPieces.value.map(piece => ({
    ...piece,
    currentX: Math.random() * (piecesAreaWidth - pieceSize.value.width),
    currentY: Math.random() * (piecesAreaHeight - pieceSize.value.height)
  }))
}

const resetPuzzle = () => {
  // 将所有已放置的拼图块移回散乱区域
  const allPieces = [...scatteredPieces.value, ...placedPieces.value]
  scatteredPieces.value = allPieces.map(piece => ({
    ...piece,
    isPlaced: false,
    isCorrect: undefined,
    gridPosition: undefined
  }))
  placedPieces.value = []
  initializePieces()
}

const autoSolve = () => {
  if (!props.puzzleData) return
  
  // 将所有拼图块放到正确位置
  const allPieces = [...scatteredPieces.value, ...placedPieces.value]
  placedPieces.value = allPieces.map((piece, index) => ({
    ...piece,
    isPlaced: true,
    isCorrect: true,
    gridPosition: piece.originalIndex
  }))
  scatteredPieces.value = []
}

const isSlotOccupied = (slotIndex: number): boolean => {
  return placedPieces.value.some(piece => piece.gridPosition === slotIndex)
}

// 拖拽相关方法
const startDrag = (pieceType: 'scattered' | 'placed', index: number, event: MouseEvent | TouchEvent) => {
  event.preventDefault()
  
  // 根据 pieceType 从正确的数组中获取 piece
  const piece = pieceType === 'scattered' 
    ? scatteredPieces.value[index] 
    : placedPieces.value[index]
  
  if (!piece) return
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  // 缓存边界矩形，避免重复计算
  const piecesAreaRect = piecesAreaRef.value?.getBoundingClientRect()
  const gridRect = puzzleGridRef.value?.getBoundingClientRect()
  if (!piecesAreaRect || !gridRect) return
  
  // 计算偏移量
  let offsetX: number, offsetY: number
  
  if (pieceType === 'scattered') {
    offsetX = clientX - piecesAreaRect.left - piece.currentX
    offsetY = clientY - piecesAreaRect.top - piece.currentY
  } else {
    // 已放置的拼图块，从网格位置计算偏移
    const gridIndex = piece.gridPosition || 0
    const row = Math.floor(gridIndex / gridCols.value)
    const col = gridIndex % gridCols.value
    const pieceXInGrid = col * (pieceSize.value.width + 2) + 8
    const pieceYInGrid = row * (pieceSize.value.height + 2) + 8
    
    // 计算鼠标相对于 grid 的坐标
    const mouseXInGrid = clientX - gridRect.left
    const mouseYInGrid = clientY - gridRect.top
    
    // 计算鼠标在图块内部的偏移
    offsetX = mouseXInGrid - pieceXInGrid
    offsetY = mouseYInGrid - pieceYInGrid
  }
  
  draggedPiece.value = {
    index,
    piece,
    offsetX,
    offsetY,
    pieceType,
    startRect: piecesAreaRect,
    gridRect: gridRect
  }
  
  // 设置拖拽状态，提升z-index
  piece.isDragging = true
  
  // 设置拖拽源状态
  if (pieceType === 'scattered') {
    isDraggingFromScattered.value = true
  }
  
  document.addEventListener('mousemove', handleDrag, { passive: false })
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', handleDrag, { passive: false })
  document.addEventListener('touchend', stopDrag)
}

const handleDrag = (event: MouseEvent | TouchEvent) => {
  if (!draggedPiece.value) return
  
  event.preventDefault()
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  // 使用缓存的边界矩形，避免重复计算
  const { startRect, gridRect, pieceType, offsetX, offsetY } = draggedPiece.value
  
  let newX: number, newY: number
  
  if (pieceType === 'scattered') {
    // 散乱拼图块的拖拽
    newX = clientX - startRect.left - offsetX
    newY = clientY - startRect.top - offsetY
    
    // 更新拼图块位置
    draggedPiece.value.piece.currentX = newX
    draggedPiece.value.piece.currentY = newY
  } else {
    // 已放置拼图块的拖拽，坐标应相对于 grid
    const mouseXInGrid = clientX - gridRect.left
    const mouseYInGrid = clientY - gridRect.top
    
    newX = mouseXInGrid - offsetX
    newY = mouseYInGrid - offsetY
    
    // 更新拼图块位置（临时拖拽位置）
    draggedPiece.value.piece.currentX = newX
    draggedPiece.value.piece.currentY = newY
  }
}

const stopDrag = (event: MouseEvent | TouchEvent) => {
  if (!draggedPiece.value) return
  
  event.preventDefault()
  
  const { piece, pieceType, gridRect } = draggedPiece.value
  
  // 清除拖拽状态
  piece.isDragging = false
  
  // 检查是否在目标网格区域内
  const clientX = 'touches' in event ? event.changedTouches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.changedTouches[0].clientY : event.clientY
  
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
      if (pieceType === 'scattered') {
        // 散乱拼图块吸附到网格
        snapToGrid(draggedPiece.value.index, gridIndex)
      } else {
        // 已放置拼图块移动到新位置
        movePlacedPiece(draggedPiece.value.index, gridIndex)
      }
    } else if (pieceType === 'placed') {
      // 已放置拼图块回到原位置
      resetPlacedPiecePosition(draggedPiece.value.index)
    }
  } else if (pieceType === 'placed') {
    // 已放置拼图块拖拽到网格外，回到原位置
    resetPlacedPiecePosition(draggedPiece.value.index)
  }
  
  // 清除拖拽源状态
  isDraggingFromScattered.value = false
  
  draggedPiece.value = null
  
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', stopDrag)
}

const snapToGrid = (pieceIndex: number, gridIndex: number) => {
  const piece = scatteredPieces.value[pieceIndex]
  if (!piece) return
  
  // 检查是否是正确位置
  const isCorrect = piece.originalIndex === gridIndex
  
  // 创建已放置的拼图块
  const placedPiece: PieceState = {
    ...piece,
    isPlaced: true,
    isCorrect,
    gridPosition: gridIndex
  }
  
  // 从散乱区域移除，添加到已放置区域
  scatteredPieces.value.splice(pieceIndex, 1)
  placedPieces.value.push(placedPiece)
  
  // 显示反馈
  if (isCorrect) {
    console.log('正确放置！')
    // 这里可以添加成功的视觉/音效反馈
  } else {
    console.log('位置不正确')
    // 这里可以添加错误的视觉反馈
  }
  
  // 检查是否完成
  if (scatteredPieces.value.length === 0) {
    const allCorrect = placedPieces.value.every(p => p.isCorrect)
    if (allCorrect) {
      console.log('拼图完成！')
      // 这里可以添加完成的庆祝效果
    }
  }
}

const movePlacedPiece = (pieceIndex: number, newGridIndex: number) => {
  const piece = placedPieces.value[pieceIndex]
  if (!piece) return
  
  // 检查是否是正确位置
  const isCorrect = piece.originalIndex === newGridIndex
  
  // 更新拼图块位置
  piece.gridPosition = newGridIndex
  piece.isCorrect = isCorrect
  
  // 显示反馈
  if (isCorrect) {
    console.log('正确移动！')
  } else {
    console.log('位置不正确')
  }
}

const resetPlacedPiecePosition = (pieceIndex: number) => {
  const piece = placedPieces.value[pieceIndex]
  if (!piece) return
  
  // 重置到原来的网格位置
  const originalGridIndex = piece.gridPosition || 0
  piece.gridPosition = originalGridIndex
  
  // 清除拖拽状态
  piece.isDragging = false
}

const handleDrop = (event: DragEvent, slotIndex: number) => {
  // 这个方法用于HTML5拖拽API，目前我们使用鼠标/触摸事件
  event.preventDefault()
}

// 监听拼图数据变化
onMounted(() => {
  if (props.puzzleData) {
    initializePieces()
  }
})
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

.puzzle-piece.scattered {
  @apply hover:shadow-lg;
}

.puzzle-piece.scattered:hover {
  transform: scale(1.02);
}

.puzzle-piece.scattered.dragging {
  @apply shadow-2xl;
  transform: scale(1.05) !important;
  cursor: grabbing !important;
}

.puzzle-piece.scattered.selected {
  @apply ring-2 ring-blue-500;
}

.puzzle-piece.placed {
  @apply hover:shadow-lg;
}

.puzzle-piece.placed:hover {
  transform: scale(1.02);
}

.puzzle-piece.placed.correct {
  @apply shadow-md;
  animation: correctPlacement 0.5s ease-out;
}

.puzzle-piece.placed.incorrect {
  animation: incorrectPlacement 0.4s ease-out;
}

.puzzle-piece.placed.dragging {
  @apply shadow-2xl;
  transform: scale(1.05) !important;
  cursor: grabbing !important;
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
