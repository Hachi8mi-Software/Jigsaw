/**
 * 布局计算工具类
 * 负责拼图布局和尺寸相关的计算
 */

/**
 * 获取屏幕适配的基准尺寸
 */
function getResponsiveBaseSize(): number {
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  
  // 移动端适配
  if (screenWidth < 768) {
    // 移动端：使用屏幕宽度的70%作为最大宽度
    const maxWidth = screenWidth * 0.7
    return Math.min(maxWidth, 280) // 最大280px
  }
  
  // 平板端适配
  if (screenWidth < 1024) {
    // 平板端：使用屏幕宽度的60%作为最大宽度
    const maxWidth = screenWidth * 0.6
    return Math.min(maxWidth, 400) // 最大400px
  }
  
  // 桌面端适配
  const maxWidth = screenWidth * 0.5
  return Math.min(maxWidth, 500) // 最大500px
}

/**
 * 计算拼图块尺寸
 * 根据拼图比例动态调整尺寸，支持矩形拼图块，智能适配屏幕
 */
export function calculatePieceSize(
  gridCols: number, 
  gridRows: number, 
  baseSize?: number, 
  customPieceSize?: { width: number, height: number }
) {
  if (gridCols === 0 || gridRows === 0) {
    return { width: 100, height: 75 }
  }
  
  // 使用响应式基准尺寸
  const responsiveBaseSize = baseSize || getResponsiveBaseSize()
  
  // 如果提供了自定义拼图块尺寸，需要智能适配屏幕
  if (customPieceSize) {
    return adaptCustomPieceSizeToScreen(customPieceSize, gridCols, gridRows, responsiveBaseSize)
  }
  
  // 使用统一的尺寸计算逻辑
  const { width: gridWidth, height: gridHeight } = calculateGridDimensions(gridCols, gridRows, responsiveBaseSize)
  
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
 * 将自定义拼图块尺寸适配到屏幕
 */
function adaptCustomPieceSizeToScreen(
  customPieceSize: { width: number, height: number },
  gridCols: number,
  gridRows: number,
  maxBaseSize: number
): { width: number, height: number } {
  // 计算原始网格尺寸
  const originalGridWidth = gridCols * customPieceSize.width + (gridCols - 1) * 2 + 16
  const originalGridHeight = gridRows * customPieceSize.height + (gridRows - 1) * 2 + 16
  
  // 计算缩放比例
  const scaleX = maxBaseSize / originalGridWidth
  const scaleY = maxBaseSize / originalGridHeight
  const scale = Math.min(scaleX, scaleY, 1) // 不放大，只缩小
  
  // 如果不需要缩放，直接返回原始尺寸
  if (scale >= 1) {
    return customPieceSize
  }
  
  // 应用缩放
  return {
    width: Math.floor(customPieceSize.width * scale),
    height: Math.floor(customPieceSize.height * scale)
  }
}

/**
 * 计算网格尺寸 - 统一的尺寸计算逻辑
 */
export function calculateGridDimensions(gridCols: number, gridRows: number, baseSize: number = 300) {
  if (gridCols === 0 || gridRows === 0) {
    return { width: 300, height: 200 }
  }
  
  // 计算拼图比例
  const aspectRatio = gridCols / gridRows
  
  let width: number
  let height: number
  
  if (aspectRatio >= 1) {
    // 宽图：以高度为基准
    height = baseSize
    width = baseSize * aspectRatio
  } else {
    // 高图：以宽度为基准
    width = baseSize
    height = baseSize / aspectRatio
  }
  
  return { width, height }
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
