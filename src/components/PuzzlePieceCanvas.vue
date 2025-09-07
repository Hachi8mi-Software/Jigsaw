<!--
  Canvas渲染的拼图块组件
  使用Canvas技术提升性能，避免每个拼图块都加载完整图片
-->

<template>
  <canvas 
    ref="canvasRef"
    :width="actualCanvasSize.width"
    :height="actualCanvasSize.height"
    class="puzzle-piece-canvas"
    :style="canvasStyle"
    @mousedown="handleMouseDown"
    @touchstart="handleTouchStart"
  >
    <!-- 显示拼图块编号的覆盖层 -->
    <div class="piece-overlay" v-if="showNumber">
      <span class="piece-number">{{ piece.originalIndex + 1 }}</span>
    </div>
  </canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import type { PieceStatus, PuzzleData } from '../types'
import { imageCache as imageCacheManager } from '../utils/imageCache'
import { getGridPos } from '../utils/gridUtils'

interface Props {
  piece: PieceStatus
  puzzleData: PuzzleData
  gridCols: number
  gridRows: number
  pieceWidth: number
  pieceHeight: number
  isDragging?: boolean
  isPlaced?: boolean
  showNumber?: boolean
  numberDisplayMode?: 'always' | 'hover' | 'never' | 'minimal'
}

const props = withDefaults(defineProps<Props>(), {
  isDragging: false,
  isPlaced: false,
  showNumber: true,
  numberDisplayMode: 'minimal'
})

const emit = defineEmits<{
  mousedown: [event: MouseEvent]
  touchstart: [event: TouchEvent]
}>()

const canvasRef = ref<HTMLCanvasElement>()

// 获取实际的网格单元格尺寸
const getActualGridCellSize = () => {
  const gridContainer = document.querySelector('.puzzle-grid') as HTMLElement
  if (gridContainer) {
    const gridSlots = gridContainer.querySelectorAll('.grid-slot')
    if (gridSlots.length > 0) {
      const firstSlot = gridSlots[0] as HTMLElement
      return {
        width: firstSlot.offsetWidth,
        height: firstSlot.offsetHeight
      }
    }
  }
  return { width: props.pieceWidth, height: props.pieceHeight }
}

// 获取实际的Canvas尺寸
const actualCanvasSize = computed(() => {
  if (props.isPlaced) {
    // 对于已放置的拼图块，使用网格单元格的实际尺寸
    const actualSize = getActualGridCellSize()
    return {
      width: actualSize.width,
      height: actualSize.height
    }
  }
  // 对于未放置的拼图块，使用props传入的尺寸
  return {
    width: props.pieceWidth,
    height: props.pieceHeight
  }
})

// Canvas样式
const canvasStyle = computed(() => {
  let left = props.piece.x
  let top = props.piece.y
  
  // 获取实际的网格单元格尺寸
  const actualSize = getActualGridCellSize()

  // 如果是已放置的拼图块且不在拖拽状态，尝试获取实际的网格位置
  if (props.isPlaced && !props.isDragging && props.piece.gridPosition !== undefined) {
    // 先尝试从DOM获取实际网格位置
    const gridContainer = document.querySelector('.puzzle-grid') as HTMLElement
    if (gridContainer) {
      const gridSlots = gridContainer.querySelectorAll('.grid-slot')
      const targetSlot = gridSlots[props.piece.gridPosition] as HTMLElement
      
      if (targetSlot) {
        // 使用offsetLeft/offsetTop获取相对于父容器的位置
        // 这样可以自动处理box-sizing、border、padding等影响
        left = targetSlot.offsetLeft
        top = targetSlot.offsetTop
      } else {
        // 降级到计算位置
        const { x, y } = getGridPos(props.piece.gridPosition, { width: props.pieceWidth, height: props.pieceHeight }, props.gridCols)
        left = x
        top = y
      }
    } else {
      // 降级到计算位置
      const { x, y } = getGridPos(props.piece.gridPosition, { width: props.pieceWidth, height: props.pieceHeight }, props.gridCols)
      left = x
      top = y
    }
  }

  const baseStyle = {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${actualSize.width}px`,
    height: `${actualSize.height}px`,
    cursor: props.isDragging ? 'grabbing' : 'grab',
    border: props.isPlaced 
      ? (props.piece.isCorrect ? '2px solid #27ae60' : '2px solid #e74c3c')
      : '2px solid #666',
    borderRadius: '4px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    zIndex: props.isDragging ? 1000 : (props.isPlaced ? 5 : 10),
    transform: props.isDragging ? 'scale(1.05)' : 'scale(1)',
    transition: props.isDragging ? 'none' : 'transform 0.2s ease'
  }

  return baseStyle
})

/**
 * 渲染拼图块到Canvas
 */
const renderPiece = async () => {
  if (!canvasRef.value || !props.puzzleData) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  try {
    // 获取缓存的图片
    const img = await imageCacheManager.getImage(props.puzzleData.imageUrl)

    // 计算源图片区域
    const correctRow = Math.floor(props.piece.originalIndex / props.gridCols)
    const correctCol = props.piece.originalIndex % props.gridCols
    
    const sourceX = (correctCol / props.gridCols) * img.naturalWidth
    const sourceY = (correctRow / props.gridRows) * img.naturalHeight
    const sourceWidth = img.naturalWidth / props.gridCols
    const sourceHeight = img.naturalHeight / props.gridRows

    // 获取实际的Canvas尺寸
    const canvasSize = actualCanvasSize.value

    // 清除画布
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height)

    // 绘制拼图块图片
    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight, // 源区域
      0, 0, canvasSize.width, canvasSize.height      // 目标区域
    )

    // 根据显示模式决定是否显示编号
    const shouldShowNumber = props.showNumber && props.numberDisplayMode !== 'never'
    
    if (shouldShowNumber) {
      const text = (props.piece.originalIndex + 1).toString()
      const centerX = canvasSize.width / 2
      const centerY = canvasSize.height / 2

      // 设置字体
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      if (props.numberDisplayMode === 'minimal') {
        // 最小化模式：只显示文字，使用更强的轮廓效果确保可见性
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)'
        ctx.lineWidth = 4
        ctx.strokeText(text, centerX, centerY)
        
        // 再加一层细轮廓增强对比度
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.strokeText(text, centerX, centerY)
        
        // 主要文字
        ctx.fillStyle = 'rgba(255, 255, 255, 0.98)'
        ctx.fillText(text, centerX, centerY)
      } else {
        // 普通模式：显示文字背景
        const textMetrics = ctx.measureText(text)
        const textWidth = textMetrics.width
        const textHeight = 16

        const padding = 4
        const bgX = centerX - textWidth / 2 - padding
        const bgY = centerY - textHeight / 2 - padding
        const bgWidth = textWidth + padding * 2
        const bgHeight = textHeight + padding * 2

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(bgX, bgY, bgWidth, bgHeight)

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)'
        ctx.lineWidth = 3
        ctx.strokeText(text, centerX, centerY)

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
        ctx.fillText(text, centerX, centerY)
      }
    }

  } catch (error) {
    console.error('渲染拼图块失败:', error)
    
    // 渲染失败时显示占位符
    const ctx = canvasRef.value?.getContext('2d')
    if (ctx) {
      const canvasSize = actualCanvasSize.value
      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height)
      
      ctx.fillStyle = '#666'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('加载失败', canvasSize.width / 2, canvasSize.height / 2)
    }
  }
}

/**
 * 预加载图片
 */
const preloadImage = async () => {
  if (!props.puzzleData?.imageUrl) return
  
  try {
    await imageCacheManager.preloadImage(props.puzzleData.imageUrl)
  } catch (error) {
    console.error('图片预加载失败:', error)
  }
}

// 事件处理
const handleMouseDown = (event: MouseEvent) => {
  emit('mousedown', event)
}

const handleTouchStart = (event: TouchEvent) => {
  emit('touchstart', event)
}

// 生命周期和监听
onMounted(async () => {
  await preloadImage()
  await nextTick()
  renderPiece()
})

// 监听属性变化，重新渲染
watch(() => [
  props.piece.x, 
  props.piece.y, 
  props.piece.originalIndex, 
  props.puzzleData.imageUrl,
  props.showNumber
], () => {
  nextTick(() => renderPiece())
}, { deep: true })

// 监听尺寸变化
watch(() => [props.pieceWidth, props.pieceHeight, actualCanvasSize.value], () => {
  nextTick(() => {
    if (canvasRef.value) {
      const canvasSize = actualCanvasSize.value
      canvasRef.value.width = canvasSize.width
      canvasRef.value.height = canvasSize.height
      renderPiece()
    }
  })
}, { deep: true })
</script>

<style scoped>
.puzzle-piece-canvas {
  display: block;
  background-color: white;
  user-select: none;
  -webkit-user-drag: none;
  box-sizing: border-box; /* 确保border包含在尺寸内 */
}

.piece-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
}

.piece-number {
  color: rgba(255, 255, 255, 0.9);
  font-weight: bold;
  font-size: 14px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

/* 鼠标悬停效果 */
.puzzle-piece-canvas:hover {
  filter: brightness(1.1);
}

/* 拖拽时的效果 */
.puzzle-piece-canvas[style*="scale(1.05)"] {
  filter: brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.3));
}
</style>
