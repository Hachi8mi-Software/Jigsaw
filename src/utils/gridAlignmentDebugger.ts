/**
 * 网格对齐调试工具
 * 帮助分析CSS Grid和Canvas位置的差异
 */

export class GridAlignmentDebugger {
  /**
   * 获取CSS Grid中网格单元的实际位置（考虑box-sizing）
   */
  static getGridCellPosition(gridContainer: HTMLElement, cellIndex: number, gridCols: number): { x: number, y: number } | null {
    const gridSlots = gridContainer.querySelectorAll('.grid-slot')
    const targetSlot = gridSlots[cellIndex] as HTMLElement
    
    if (!targetSlot) {
      console.warn(`Grid slot ${cellIndex} not found`)
      return null
    }

    const containerRect = gridContainer.getBoundingClientRect()
    const slotRect = targetSlot.getBoundingClientRect()
    
    // 获取容器的border宽度
    const containerStyle = window.getComputedStyle(gridContainer)
    const borderLeft = parseInt(containerStyle.borderLeftWidth) || 0
    const borderTop = parseInt(containerStyle.borderTopWidth) || 0
    
    // 计算相对于容器内容区域的位置（考虑border）
    const x = slotRect.left - containerRect.left + borderLeft
    const y = slotRect.top - containerRect.top + borderTop
    
    return { x, y }
  }  /**
   * 分析网格布局信息
   */
  static analyzeGridLayout(gridContainer: HTMLElement, gridCols: number, gridRows: number) {
    const containerRect = gridContainer.getBoundingClientRect()
    const computedStyle = window.getComputedStyle(gridContainer)
    
    console.log('=== 网格布局分析 ===')
    console.log('容器尺寸:', { 
      width: containerRect.width, 
      height: containerRect.height 
    })
    console.log('容器样式:', {
      padding: computedStyle.padding,
      gap: computedStyle.gap,
      gridTemplateColumns: computedStyle.gridTemplateColumns,
      gridTemplateRows: computedStyle.gridTemplateRows
    })
    
    // 分析前几个网格单元的位置
    for (let i = 0; i < Math.min(4, gridCols * gridRows); i++) {
      const position = this.getGridCellPosition(gridContainer, i, gridCols)
      if (position) {
        const row = Math.floor(i / gridCols)
        const col = i % gridCols
        console.log(`网格[${row}, ${col}] (index ${i}):`, position)
      }
    }
  }
  
  /**
   * 对比Canvas位置和CSS Grid位置
   */
  static compareCanvasAndGrid(
    canvasElement: HTMLCanvasElement, 
    gridContainer: HTMLElement, 
    pieceIndex: number,
    gridCols: number
  ) {
    const canvasRect = canvasElement.getBoundingClientRect()
    const containerRect = gridContainer.getBoundingClientRect()
    const gridPosition = this.getGridCellPosition(gridContainer, pieceIndex, gridCols)
    
    const canvasRelativePos = {
      x: canvasRect.left - containerRect.left,
      y: canvasRect.top - containerRect.top
    }
    
    if (gridPosition) {
      const diff = {
        x: canvasRelativePos.x - gridPosition.x,
        y: canvasRelativePos.y - gridPosition.y
      }
      
      console.log(`拼图块 ${pieceIndex} 位置对比:`)
      console.log('Canvas位置:', canvasRelativePos)
      console.log('Grid位置:', gridPosition)
      console.log('差异:', diff)
      
      return { canvasPos: canvasRelativePos, gridPos: gridPosition, diff }
    }
    
    return null
  }
  
  /**
   * 生成修正的getGridPos函数建议
   */
  static generateCorrectedGridPos(gridContainer: HTMLElement, gridCols: number, gridRows: number) {
    console.log('=== 生成修正建议 ===')
    
    const samples = []
    for (let i = 0; i < Math.min(6, gridCols * gridRows); i++) {
      const position = this.getGridCellPosition(gridContainer, i, gridCols)
      if (position) {
        const row = Math.floor(i / gridCols)
        const col = i % gridCols
        samples.push({ row, col, position })
      }
    }
    
    if (samples.length >= 2) {
      // 计算基础偏移和间距
      const firstPos = samples[0].position
      const secondPos = samples[1].position
      
      let cellWidth = 0
      let cellHeight = 0
      
      if (samples[0].col !== samples[1].col) {
        // 水平相邻
        cellWidth = secondPos.x - firstPos.x
      }
      
      // 寻找垂直相邻的单元格
      const verticalSample = samples.find(s => s.col === 0 && s.row === 1)
      if (verticalSample) {
        cellHeight = verticalSample.position.y - firstPos.y
      }
      
      console.log('建议的网格参数:')
      console.log(`基础偏移: x=${firstPos.x}, y=${firstPos.y}`)
      console.log(`单元格间距: width=${cellWidth}, height=${cellHeight}`)
      
      return {
        baseOffset: firstPos,
        cellSpacing: { width: cellWidth, height: cellHeight }
      }
    }
    
    return null
  }
}

// 全局调试函数
declare global {
  interface Window {
    debugGridAlignment: typeof GridAlignmentDebugger
  }
}

if (typeof window !== 'undefined') {
  window.debugGridAlignment = GridAlignmentDebugger
}
