<!--
  Canvas渲染的拼图块组件
  使用Canvas技术提升性能，避免每个拼图块都加载完整图片
-->

<template>
  <div class="puzzle-piece-container" :style="containerStyle">
    <canvas 
      ref="canvasRef"
      :width="actualCanvasSize.width"
      :height="actualCanvasSize.height"
      class="puzzle-piece-canvas"
      :style="canvasStyle"
      @mousedown="handleMouseDown"
      @touchstart="handleTouchStart"
    >
    </canvas>
    <!-- 拖拽区域遮罩 -->
    <div 
      class="drag-mask"
      :style="dragMaskStyle"
      @mousedown="handleMouseDown"
      @touchstart="handleTouchStart"
    >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import type { PieceStatus, PuzzleData } from '../types'
import { imageCache as imageCacheManager } from '../utils/imageCache'
import { getGridPos } from '../utils/gridUtils'
import { determinePieceEdges } from '../utils/puzzleUtils'

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
  const tabSize = Math.min(props.pieceWidth, props.pieceHeight) * 0.12
  const extraSpace = tabSize * 3 // 为凸出部分预留足够空间，进一步增加扩展比例
  
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

// 容器样式
const containerStyle = computed(() => {
  // 计算凸出部分所需的额外空间
  const tabSize = Math.min(props.pieceWidth, props.pieceHeight) * 0.12
  const extraSpace = tabSize * 3 // 为凸出部分预留足够空间，进一步增加扩展比例
  
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

  return {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${actualCanvasSize.value.width}px`,
    height: `${actualCanvasSize.value.height}px`,
    zIndex: props.isDragging ? 1000 : (props.isPlaced ? 5 : 10),
    transform: props.isDragging ? 'scale(1.05)' : 'scale(1)',
    transition: props.isDragging ? 'none' : 'transform 0.2s ease'
  }
})

// Canvas样式
const canvasStyle = computed(() => {
  return {
    position: 'absolute' as const,
    left: '0px',
    top: '0px',
    width: `${actualCanvasSize.value.width}px`,
    height: `${actualCanvasSize.value.height}px`,
    pointerEvents: 'none' as const // Canvas不接收鼠标事件
  }
})

// 拖拽遮罩样式
const dragMaskStyle = computed(() => {
  // 计算凸出部分所需的额外空间
  const tabSize = Math.min(props.pieceWidth, props.pieceHeight) * 0.25
  const extraSpace = tabSize * 1.2
  
  // 计算拼图块的实际尺寸（不含凸出部分）
  const actualPieceWidth = props.isPlaced ? getActualGridCellSize().width : props.pieceWidth
  const actualPieceHeight = props.isPlaced ? getActualGridCellSize().height : props.pieceHeight
  
  // 计算居中偏移量
  const offsetX = (actualCanvasSize.value.width - actualPieceWidth) / 2
  const offsetY = (actualCanvasSize.value.height - actualPieceHeight) / 2
  
  return {
    position: 'absolute' as const,
    left: `${offsetX}px`,
    top: `${offsetY}px`,
    width: `${actualPieceWidth}px`,
    height: `${actualPieceHeight}px`,
    cursor: props.isDragging ? 'grabbing' : 'grab',
    pointerEvents: 'auto' as const
  }
})

/**
 * 创建拼图块路径（带凹凸效果）
 */
const createPuzzlePiecePath = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  // 拼图块凸起/凹陷的大小（占边长的比例）- 调整为更合理的尺寸
  const tabSize = Math.min(width, height) * 0.12
  
  // 确定每个边的凹凸状态
  // 优先使用编辑器定义的边界数据，如果没有则使用随机生成
  const { topEdge, rightEdge, bottomEdge, leftEdge } = determinePieceEdges(
    props.piece.originalIndex,
    props.gridCols,
    props.gridRows,
    props.puzzleData.boundaries
  )
  
  // 开始创建路径
  ctx.beginPath()
  
  // 上边
  ctx.moveTo(0, 0) // 左上角
  if (topEdge !== 0) {
    ctx.lineTo(width * 0.4, 0) // 上边左部分
    // 绘制标准半圆凸起或凹陷
    const centerX = width * 0.5
    const centerY = topEdge > 0 ? -tabSize : tabSize
    const radius = tabSize
    ctx.arc(centerX, centerY, radius, Math.PI, 0, topEdge < 0) // 半圆
    ctx.lineTo(width * 0.6, 0) // 上边右部分
  }
  ctx.lineTo(width, 0) // 右上角
  
  // 右边
  if (rightEdge !== 0) {
    ctx.lineTo(width, height * 0.4) // 右边上部分
    // 绘制标准半圆凸起或凹陷
    const centerX = width + (rightEdge > 0 ? tabSize : -tabSize)
    const centerY = height * 0.5
    const radius = tabSize
    ctx.arc(centerX, centerY, radius, Math.PI * 1.5, Math.PI * 0.5, rightEdge < 0) // 半圆
    ctx.lineTo(width, height * 0.6) // 右边下部分
  }
  ctx.lineTo(width, height) // 右下角
  
  // 下边
  if (bottomEdge !== 0) {
    ctx.lineTo(width * 0.6, height) // 下边右部分
    // 绘制标准半圆凸起或凹陷
    const centerX = width * 0.5
    const centerY = height + (bottomEdge > 0 ? tabSize : -tabSize)
    const radius = tabSize
    ctx.arc(centerX, centerY, radius, 0, Math.PI, bottomEdge < 0) // 半圆
    ctx.lineTo(width * 0.4, height) // 下边左部分
  }
  ctx.lineTo(0, height) // 左下角
  
  // 左边
  if (leftEdge !== 0) {
    ctx.lineTo(0, height * 0.6) // 左边下部分
    // 绘制标准半圆凸起或凹陷
    const centerX = leftEdge > 0 ? -tabSize : tabSize
    const centerY = height * 0.5
    const radius = tabSize
    ctx.arc(centerX, centerY, radius, Math.PI * 0.5, Math.PI * 1.5, leftEdge < 0) // 半圆
    ctx.lineTo(0, height * 0.4) // 左边上部分
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
    
    // 绘制拼图块图片 - 确保主体部分显示正确的原图区域
    const tabSize = Math.min(actualPieceWidth, actualPieceHeight) * 0.12 // 与createPuzzlePiecePath中相同的tabSize
    
    // 计算扩展的源区域，确保目标区域扩大时源区域也相应扩大
    // 进一步增加扩展比例，确保凸起部分也能填充图片
    const sourceTabSizeX = (tabSize * 2.5 / actualPieceWidth) * sourceWidth
    const sourceTabSizeY = (tabSize * 2.5 / actualPieceHeight) * sourceHeight
    
    // 绘制图片，源区域和目标区域都相应扩展
    ctx.drawImage(
      img,
      sourceX - sourceTabSizeX, sourceY - sourceTabSizeY, 
      sourceWidth + sourceTabSizeX * 2, sourceHeight + sourceTabSizeY * 2, // 扩展的源区域
      -tabSize * 2.5, -tabSize * 2.5, 
      actualPieceWidth + tabSize * 5, actualPieceHeight + tabSize * 5 // 扩展的目标区域
    )
    
    // 恢复上下文状态（保留坐标系偏移）
    ctx.restore()
    
    // 重新保存状态并设置偏移，用于绘制边框
    ctx.save()
    ctx.translate(offsetX, offsetY)
    
    // 绘制拼图块边框 - 恢复明显的边框效果
    ctx.strokeStyle = props.isPlaced 
      ? (props.piece.isCorrect ? '#27ae60' : '#e74c3c')
      : '#666'
    ctx.lineWidth = 2.5
    createPuzzlePiecePath(ctx, actualPieceWidth, actualPieceHeight)
    ctx.stroke()
    
    // 添加内部光效增强立体感
    ctx.globalCompositeOperation = 'source-atop'
    createPuzzlePiecePath(ctx, actualPieceWidth, actualPieceHeight)
    // 创建径向渐变光效
    const gradient = ctx.createRadialGradient(
      actualPieceWidth/2, actualPieceHeight/2, 0,
      actualPieceWidth/2, actualPieceHeight/2, actualPieceWidth/1.5
    )
    gradient.addColorStop(0, 'rgba(255,255,255,0.2)')
    gradient.addColorStop(1, 'rgba(0,0,0,0.1)')
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
        // 普通模式：只显示文字轮廓，无背景
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
.puzzle-piece-container {
  user-select: none;
  -webkit-user-drag: none;
  box-sizing: border-box;
}

.puzzle-piece-canvas {
  display: block;
  background-color: transparent;
  user-select: none;
  -webkit-user-drag: none;
  box-sizing: border-box;
}

.drag-mask {
  background-color: transparent;
  user-select: none;
  -webkit-user-drag: none;
  box-sizing: border-box;
}

/* 鼠标悬停效果 */
.puzzle-piece-container:hover .puzzle-piece-canvas {
  filter: brightness(1.1);
}

/* 拖拽时的效果 */
.puzzle-piece-container[style*="scale(1.05)"] .puzzle-piece-canvas {
  filter: brightness(1.1);
}
</style>
