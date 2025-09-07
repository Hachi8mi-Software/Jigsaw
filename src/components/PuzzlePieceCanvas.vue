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
  // 计算凸出部分所需的额外空间
  const tabSize = Math.min(props.pieceWidth, props.pieceHeight) * 0.25
  const extraSpace = tabSize * 1.2 // 为凸出部分预留足够空间
  
  if (props.isPlaced) {
    // 对于已放置的拼图块，使用网格单元格的实际尺寸，并增加额外空间
    const actualSize = getActualGridCellSize()
    return {
      width: actualSize.width + extraSpace * 2, // 左右两侧各增加空间
      height: actualSize.height + extraSpace * 2 // 上下两侧各增加空间
    }
  }
  // 对于未放置的拼图块，使用props传入的尺寸，并增加额外空间
  return {
    width: props.pieceWidth + extraSpace * 2,
    height: props.pieceHeight + extraSpace * 2
  }
})

// Canvas样式
const canvasStyle = computed(() => {
  // 计算凸出部分所需的额外空间
  const tabSize = Math.min(props.pieceWidth, props.pieceHeight) * 0.25
  const extraSpace = tabSize * 1.2 // 为凸出部分预留足够空间
  
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

  // 调整位置，使拼图块在视觉上居中（考虑到Canvas尺寸增大了）
  left -= extraSpace
  top -= extraSpace

  const baseStyle = {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${actualCanvasSize.value.width}px`,
    height: `${actualCanvasSize.value.height}px`,
    cursor: props.isDragging ? 'grabbing' : 'grab',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    zIndex: props.isDragging ? 1000 : (props.isPlaced ? 5 : 10),
    transform: props.isDragging ? 'scale(1.05)' : 'scale(1)',
    transition: props.isDragging ? 'none' : 'transform 0.2s ease'
  }

  return baseStyle
})

/**
 * 创建拼图块路径（带凹凸效果）
 */
const createPuzzlePiecePath = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  // 拼图块凸起/凹陷的大小（占边长的比例）- 增大尺寸使效果更明显
  const tabSize = Math.min(width, height) * 0.25
  
  // 确定每个边的凹凸状态（随机但基于拼图块索引，保持一致性）
  // 使用原始索引作为随机种子，确保相同的拼图块总是有相同的形状
  const seed = props.piece.originalIndex
  const row = Math.floor(props.piece.originalIndex / props.gridCols)
  const col = props.piece.originalIndex % props.gridCols
  
  // 确定每个边的状态：上、右、下、左
  // 0: 平边（边缘），1: 凸出，-1: 凹入
  const topEdge = row === 0 ? 0 : ((seed * 11) % 2 === 0 ? 1 : -1)
  const rightEdge = col === props.gridCols - 1 ? 0 : ((seed * 7) % 2 === 0 ? 1 : -1)
  const bottomEdge = row === props.gridRows - 1 ? 0 : ((seed * 13) % 2 === 0 ? 1 : -1)
  const leftEdge = col === 0 ? 0 : ((seed * 5) % 2 === 0 ? 1 : -1)
  
  // 开始创建路径
  ctx.beginPath()
  
  // 上边
  ctx.moveTo(0, 0) // 左上角
  if (topEdge !== 0) {
    ctx.lineTo(width * 0.3, 0) // 上边左部分
    // 绘制凸起或凹陷 - 调整控制点使曲线更加明显
    ctx.bezierCurveTo(
      width * 0.35, topEdge > 0 ? -tabSize * 1.2 : tabSize * 0.8, // 控制点1 - 增强曲线效果
      width * 0.65, topEdge > 0 ? -tabSize * 1.2 : tabSize * 0.8, // 控制点2 - 增强曲线效果
      width * 0.7, 0 // 终点
    )
  }
  ctx.lineTo(width, 0) // 右上角
  
  // 右边
  if (rightEdge !== 0) {
    ctx.lineTo(width, height * 0.3) // 右边上部分
    // 绘制凸起或凹陷 - 调整控制点使曲线更加明显
    ctx.bezierCurveTo(
      width + (rightEdge > 0 ? tabSize * 1.2 : -tabSize * 0.8), height * 0.35, // 控制点1 - 增强曲线效果
      width + (rightEdge > 0 ? tabSize * 1.2 : -tabSize * 0.8), height * 0.65, // 控制点2 - 增强曲线效果
      width, height * 0.7 // 终点
    )
  }
  ctx.lineTo(width, height) // 右下角
  
  // 下边
  if (bottomEdge !== 0) {
    ctx.lineTo(width * 0.7, height) // 下边右部分
    // 绘制凸起或凹陷 - 调整控制点使曲线更加明显
    ctx.bezierCurveTo(
      width * 0.65, height + (bottomEdge > 0 ? tabSize * 1.2 : -tabSize * 0.8), // 控制点1 - 增强曲线效果
      width * 0.35, height + (bottomEdge > 0 ? tabSize * 1.2 : -tabSize * 0.8), // 控制点2 - 增强曲线效果
      width * 0.3, height // 终点
    )
  }
  ctx.lineTo(0, height) // 左下角
  
  // 左边
  if (leftEdge !== 0) {
    ctx.lineTo(0, height * 0.7) // 左边下部分
    // 绘制凸起或凹陷 - 调整控制点使曲线更加明显
    ctx.bezierCurveTo(
      leftEdge > 0 ? -tabSize * 1.2 : tabSize * 0.8, height * 0.65, // 控制点1 - 增强曲线效果
      leftEdge > 0 ? -tabSize * 1.2 : tabSize * 0.8, height * 0.35, // 控制点2 - 增强曲线效果
      0, height * 0.3 // 终点
    )
  }
  ctx.lineTo(0, 0) // 回到起点
  
  // 闭合路径
  ctx.closePath()
}

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
    
    // 计算拼图块的实际尺寸（不含凸出部分）
    const actualPieceWidth = props.isPlaced ? getActualGridCellSize().width : props.pieceWidth
    const actualPieceHeight = props.isPlaced ? getActualGridCellSize().height : props.pieceHeight
    
    // 计算居中偏移量
    const offsetX = (canvasSize.width - actualPieceWidth) / 2
    const offsetY = (canvasSize.height - actualPieceHeight) / 2
    
    // 保存当前状态并移动坐标系到居中位置
    ctx.save()
    ctx.translate(offsetX, offsetY)
    
    // 创建拼图块路径（带凹凸效果）
    createPuzzlePiecePath(ctx, actualPieceWidth, actualPieceHeight)
    
    // 设置裁剪区域为拼图块形状
    ctx.clip()
    
    // 绘制拼图块图片 - 扩展目标区域以覆盖凸出部分
    const tabSize = actualPieceWidth * 0.25 // 与createPuzzlePiecePath中相同的tabSize
    
    // 扩展绘制区域，使图片覆盖凸出部分
    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight, // 源区域
      -tabSize, -tabSize, actualPieceWidth + tabSize * 2, actualPieceHeight + tabSize * 2 // 目标区域扩大以覆盖凸出部分
    )
    
    // 恢复上下文状态（保留坐标系偏移）
    ctx.restore()
    
    // 重新保存状态并设置偏移，用于绘制边框
    ctx.save()
    ctx.translate(offsetX, offsetY)
    
    // 绘制拼图块边框 - 增强边框效果
    ctx.strokeStyle = props.isPlaced 
      ? (props.piece.isCorrect ? '#27ae60' : '#e74c3c')
      : '#333'
    ctx.lineWidth = 2.5
    createPuzzlePiecePath(ctx, actualPieceWidth, actualPieceHeight)
    ctx.stroke()
    
    // 添加内部阴影效果增强立体感
    ctx.globalCompositeOperation = 'source-atop'
    createPuzzlePiecePath(ctx, actualPieceWidth, actualPieceHeight)
    // 创建径向渐变
    const gradient = ctx.createRadialGradient(
      actualPieceWidth/2, actualPieceHeight/2, 0,
      actualPieceWidth/2, actualPieceHeight/2, actualPieceWidth/1.5
    )
    gradient.addColorStop(0, 'rgba(255,255,255,0.15)')
    gradient.addColorStop(1, 'rgba(0,0,0,0.25)')
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.restore() // 恢复上下文状态

    // 根据显示模式决定是否显示编号
    const shouldShowNumber = props.showNumber && props.numberDisplayMode !== 'never'
    
    if (shouldShowNumber) {
      const text = (props.piece.originalIndex + 1).toString()
      // 使用Canvas中心点作为文字位置，确保文字显示在拼图块中心
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
  background-color: transparent;
  user-select: none;
  -webkit-user-drag: none;
  box-sizing: border-box;
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
