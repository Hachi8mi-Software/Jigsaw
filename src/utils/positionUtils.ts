/**
 * 位置计算工具类
 * 负责拼图块位置相关的计算和检测
 */

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
  
  // 尝试通过DOM查询找到最接近的网格槽
  const gridContainer = document.querySelector('.puzzle-grid') as HTMLElement
  if (gridContainer) {
    const gridSlots = gridContainer.querySelectorAll('.grid-slot')
    let closestIndex = -1
    let minDistance = Infinity
    
    gridSlots.forEach((slot, index) => {
      const slotElement = slot as HTMLElement
      const slotRect = slotElement.getBoundingClientRect()
      
      // 计算鼠标位置到网格槽中心的距离
      const slotCenterX = slotRect.left + slotRect.width / 2
      const slotCenterY = slotRect.top + slotRect.height / 2
      const distance = Math.sqrt(
        Math.pow(clientX - slotCenterX, 2) + 
        Math.pow(clientY - slotCenterY, 2)
      )
      
      if (distance < minDistance) {
        minDistance = distance
        closestIndex = index
      }
    })
    
    if (closestIndex >= 0) {
      const gridRow = Math.floor(closestIndex / gridCols)
      const gridCol = closestIndex % gridCols
      return { gridCol, gridRow, gridIndex: closestIndex }
    }
  }
  
  // 降级到原来的计算方式
  const gridCol = Math.floor((relativeX - 6) / (pieceWidth + 2))
  const gridRow = Math.floor((relativeY - 6) / (pieceHeight + 2))
  const gridIndex = gridRow * gridCols + gridCol
  
  return { gridCol, gridRow, gridIndex }
}
