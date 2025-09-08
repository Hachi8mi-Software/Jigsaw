/**
 * 拼图相关工具函数
 */

import type { PieceStatus } from '../types'

/**
 * 计算拼图块尺寸
 * 根据拼图比例动态调整尺寸
 */
export function calculatePieceSize(gridCols: number, gridRows: number, baseSize: number = 300) {
  if (gridCols === 0 || gridRows === 0) {
    return { width: 100, height: 75 }
  }
  
  // 计算拼图比例
  const aspectRatio = gridCols / gridRows
  
  let gridWidth: number
  let gridHeight: number
  
  if (aspectRatio >= 1) {
    // 宽图：以高度为基准
    gridHeight = baseSize
    gridWidth = baseSize * aspectRatio
  } else {
    // 高图：以宽度为基准
    gridWidth = baseSize
    gridHeight = baseSize / aspectRatio
  }
  
  // 减去padding和gap，与createGridStyle保持一致
  const padding = 16 // 8px * 2 (来自createGridStyle的padding)
  const gapWidth = (gridCols - 1) * 2  // 列之间的2px gap
  const gapHeight = (gridRows - 1) * 2 // 行之间的2px gap
  
  const availableWidth = gridWidth - padding - gapWidth
  const availableHeight = gridHeight - padding - gapHeight
  
  // 减去Canvas边框的占用空间 (2px * 2 = 4px per piece)
  const canvasBorderWidth = 4 // 2px border * 2 sides
  const canvasBorderHeight = 4 // 2px border * 2 sides
  
  return {
    width: Math.floor(availableWidth / gridCols) - canvasBorderWidth,
    height: Math.floor(availableHeight / gridRows) - canvasBorderHeight
  }
}

/**
 * 检查两个拼图块是否重叠
 * @param piece1 第一个拼图块位置
 * @param piece2 第二个拼图块位置
 * @param pieceWidth 拼图块宽度
 * @param pieceHeight 拼图块高度
 * @param buffer 额外的缓冲区域，默认为20像素
 */
export function isPieceOverlapping(
  piece1: { x: number; y: number },
  piece2: { x: number; y: number },
  pieceWidth: number,
  pieceHeight: number,
  buffer: number = 20
): boolean {
  const dx = Math.abs(piece1.x - piece2.x)
  const dy = Math.abs(piece1.y - piece2.y)
  return dx < pieceWidth + buffer && dy < pieceHeight + buffer
}

/**
 * 生成网格位置数组
 */
export function generateGridPositions(
  maxCols: number,
  maxRows: number,
  pieceWidth: number,
  pieceHeight: number,
  margin: number,
  areaWidth: number,
  areaHeight: number
): { x: number; y: number }[] {
  const availablePositions: { x: number, y: number }[] = []
  
  for (let row = 0; row < maxRows; row++) {
    for (let col = 0; col < maxCols; col++) {
      const x = margin + col * (pieceWidth + 5)
      const y = margin + row * (pieceHeight + 5)
      
      if (x + pieceWidth <= areaWidth - margin && y + pieceHeight <= areaHeight - margin) {
        availablePositions.push({ x, y })
      }
    }
  }
  
  return availablePositions
}

/**
 * 随机打乱数组
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * 在区域内生成随机位置
 */
export function generateRandomPosition(
  areaWidth: number,
  areaHeight: number,
  pieceWidth: number,
  pieceHeight: number,
  margin: number = 5
): { x: number; y: number } {
  const effectiveWidth = areaWidth - 2 * margin - pieceWidth
  const effectiveHeight = areaHeight - 2 * margin - pieceHeight
  
  return {
    x: margin + Math.random() * effectiveWidth,
    y: margin + Math.random() * effectiveHeight
  }
}

/**
 * 检查位置是否在边界内
 */
export function isPositionInBounds(
  x: number,
  y: number,
  pieceWidth: number,
  pieceHeight: number,
  areaWidth: number,
  areaHeight: number,
  margin: number = 5
): boolean {
  return x >= margin && 
         y >= margin && 
         x + pieceWidth <= areaWidth - margin && 
         y + pieceHeight <= areaHeight - margin
}

/**
 * 约束位置到指定区域内
 */
export function constrainPosition(
  x: number,
  y: number,
  pieceWidth: number,
  pieceHeight: number,
  areaWidth: number,
  areaHeight: number,
  margin: number = 5
): { x: number; y: number } {
  const minX = margin
  const minY = margin
  const maxX = areaWidth - pieceWidth - margin
  const maxY = areaHeight - pieceHeight - margin
  
  return {
    x: Math.max(minX, Math.min(x, maxX)),
    y: Math.max(minY, Math.min(y, maxY))
  }
}

/**
 * 计算网格坐标
 */
export function calculateGridCoordinates(
  clientX: number,
  clientY: number,
  gridRect: DOMRect,
  pieceWidth: number,
  pieceHeight: number,
  gridCols: number
): { gridCol: number; gridRow: number; gridIndex: number } {
  const relativeX = clientX - gridRect.left
  const relativeY = clientY - gridRect.top
  
  const gridCol = Math.floor((relativeX - 6) / (pieceWidth + 2))
  const gridRow = Math.floor((relativeY - 6) / (pieceHeight + 2))
  const gridIndex = gridRow * gridCols + gridCol
  
  return { gridCol, gridRow, gridIndex }
}

import type { Boundary, BoundaryState } from '../types'

/**
 * 从边界数据确定拼图块的边界状态
 * @param originalIndex 拼图块的原始索引
 * @param gridCols 网格列数
 * @param gridRows 网格行数
 * @param boundaries 边界数组（可选，如果提供则使用编辑器数据）
 * @returns 返回四个边的状态：{ topEdge, rightEdge, bottomEdge, leftEdge }
 *         0: 平边，1: 凸出，-1: 凹入
 *         如果没有边界数据，所有边都返回0（平边）
 */
export function determinePieceEdges(
  originalIndex: number,
  gridCols: number,
  gridRows: number,
  boundaries?: Boundary[]
): { topEdge: number; rightEdge: number; bottomEdge: number; leftEdge: number } {
  const row = Math.floor(originalIndex / gridCols)
  const col = originalIndex % gridCols
  
  // 如果提供了边界数据，使用编辑器定义的边界状态
  if (boundaries && boundaries.length > 0) {
    return determinePieceEdgesFromBoundaries(originalIndex, gridCols, gridRows, boundaries)
  }
  
  // 否则所有边都设置为平边
  return determinePieceEdgesDefault(originalIndex, gridCols, gridRows)
}

/**
 * 从边界数据确定拼图块的边界状态（使用编辑器数据）
 * 确保相邻拼图块的边界状态互补（一个凸，另一个凹）
 */
function determinePieceEdgesFromBoundaries(
  originalIndex: number,
  gridCols: number,
  gridRows: number,
  boundaries: Boundary[]
): { topEdge: number; rightEdge: number; bottomEdge: number; leftEdge: number } {
  const row = Math.floor(originalIndex / gridCols)
  const col = originalIndex % gridCols
  
  // 查找相关的边界
  const topBoundary = boundaries.find(b => 
    b.direction === 'horizontal' && 
    b.row === row - 1 && 
    b.col === col
  )
  
  const rightBoundary = boundaries.find(b => 
    b.direction === 'vertical' && 
    b.row === row && 
    b.col === col
  )
  
  const bottomBoundary = boundaries.find(b => 
    b.direction === 'horizontal' && 
    b.row === row && 
    b.col === col
  )
  
  const leftBoundary = boundaries.find(b => 
    b.direction === 'vertical' && 
    b.row === row && 
    b.col === col - 1
  )
  
  // 转换边界状态为边状态，考虑拼图块的位置来决定互补性
  const topEdge = topBoundary ? getComplementaryEdgeState(topBoundary.state, 'top', row, col) : 0
  const rightEdge = rightBoundary ? getComplementaryEdgeState(rightBoundary.state, 'right', row, col) : 0
  const bottomEdge = bottomBoundary ? getComplementaryEdgeState(bottomBoundary.state, 'bottom', row, col) : 0
  const leftEdge = leftBoundary ? getComplementaryEdgeState(leftBoundary.state, 'left', row, col) : 0
  
  return { topEdge, rightEdge, bottomEdge, leftEdge }
}

/**
 * 获取互补的边状态
 * 确保相邻拼图块在同一个边界上有互补的凹凸状态
 * @param boundaryState 边界状态
 * @param edgeDirection 边方向
 * @param row 拼图块行
 * @param col 拼图块列
 * @returns 互补的边状态
 */
function getComplementaryEdgeState(
  boundaryState: BoundaryState, 
  edgeDirection: 'top' | 'right' | 'bottom' | 'left',
  row: number,
  col: number
): number {
  // 对于平直边界，返回0
  if (boundaryState === 'flat') {
    return 0
  }
  
  // 对于凹凸边界，根据拼图块位置和边方向决定互补性
  // 使用拼图块的行列坐标作为种子，确保相同位置的拼图块总是有相同的边状态
  const seed = row * 1000 + col
  
  switch (edgeDirection) {
    case 'top':
      // 上边：如果边界是凸的，当前拼图块应该是凹的（从上方看）
      return boundaryState === 'convex' ? 1 : -1
    case 'right':
      // 右边：如果边界是凸的，当前拼图块应该是凸的（从右侧看）
      return boundaryState === 'convex' ? -1 : 1
    case 'bottom':
      // 下边：如果边界是凸的，当前拼图块应该是凸的（从下方看）
      return boundaryState === 'convex' ? -1 : 1
    case 'left':
      // 左边：如果边界是凸的，当前拼图块应该是凹的（从左侧看）
      return boundaryState === 'convex' ? 1 : -1
    default:
      return 0
  }
}

/**
 * 确定拼图块的边界状态（全部为平边）
 */
function determinePieceEdgesDefault(
  originalIndex: number,
  gridCols: number,
  gridRows: number
): { topEdge: number; rightEdge: number; bottomEdge: number; leftEdge: number } {
  // 所有边都设置为平边（0）
  return { 
    topEdge: 0, 
    rightEdge: 0, 
    bottomEdge: 0, 
    leftEdge: 0 
  }
}

/**
 * 将边界状态转换为边状态
 * @param boundaryState 边界状态
 * @returns 边状态：0=平边，1=凸出，-1=凹入
 */
function boundaryStateToEdgeState(boundaryState: BoundaryState): number {
  switch (boundaryState) {
    case 'flat':
      return 0
    case 'convex':
      return 1
    case 'concave':
      return -1
    default:
      return 0
  }
}
