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

/**
 * 确定拼图块的边界状态
 * @param originalIndex 拼图块的原始索引
 * @param gridCols 网格列数
 * @param gridRows 网格行数
 * @returns 返回四个边的状态：{ topEdge, rightEdge, bottomEdge, leftEdge }
 *         0: 平边（边缘），1: 凸出，-1: 凹入
 */
export function determinePieceEdges(
  originalIndex: number,
  gridCols: number,
  gridRows: number
): { topEdge: number; rightEdge: number; bottomEdge: number; leftEdge: number } {
  const seed = originalIndex
  const row = Math.floor(originalIndex / gridCols)
  const col = originalIndex % gridCols
  
  // 确定每个边的状态：上、右、下、左
  // 0: 平边（边缘），1: 凸出，-1: 凹入
  const topEdge = row === 0 ? 0 : ((seed * 11) % 2 === 0 ? 1 : -1)
  const rightEdge = col === gridCols - 1 ? 0 : ((seed * 7) % 2 === 0 ? 1 : -1)
  const bottomEdge = row === gridRows - 1 ? 0 : ((seed * 13) % 2 === 0 ? 1 : -1)
  const leftEdge = col === 0 ? 0 : ((seed * 5) % 2 === 0 ? 1 : -1)
  
  return { topEdge, rightEdge, bottomEdge, leftEdge }
}
