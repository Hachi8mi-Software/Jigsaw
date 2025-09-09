/**
 * 边界管理工具类
 * 负责边界状态管理和转换
 */

import { BoundaryState, type Boundary, type GridConfig, type PieceEdges } from '../types'

/**
 * 边界状态转换器类 - 统一处理边界状态转换
 */
export class BoundaryStateConverter {
  /**
   * 获取相反状态（用于相邻拼图块）
   * @param boundaryState 边界状态
   * @returns 相反的边界状态
   */
  static getOppositeState(boundaryState: BoundaryState): BoundaryState {
    switch (boundaryState) {
      case BoundaryState.CONVEX:
        return BoundaryState.CONCAVE
      case BoundaryState.CONCAVE:
        return BoundaryState.CONVEX
      default:
        return BoundaryState.FLAT
    }
  }

  /**
   * 将BoundaryState转换为数字值（用于需要数字的场景）
   * @param boundaryState 边界状态
   * @returns 数字值：0=平直, 1=外凸, -1=内凹
   */
  static toNumericValue(boundaryState: BoundaryState): number {
    switch (boundaryState) {
      case BoundaryState.FLAT:
        return 0
      case BoundaryState.CONVEX:
        return 1
      case BoundaryState.CONCAVE:
        return -1
      default:
        return 0
    }
  }

  /**
   * 从数字值转换为BoundaryState
   * @param numericValue 数字值：0=平直, 1=外凸, -1=内凹
   * @returns 边界状态
   */
  static fromNumericValue(numericValue: number): BoundaryState {
    switch (numericValue) {
      case 0:
        return BoundaryState.FLAT
      case 1:
        return BoundaryState.CONVEX
      case -1:
        return BoundaryState.CONCAVE
      default:
        return BoundaryState.FLAT
    }
  }

  /**
   * 获取拼图块的边状态
   * @param row 行索引
   * @param col 列索引
   * @param gridConfig 网格配置
   * @param boundaries 边界数组
   * @returns 拼图块的四个边状态
   */
  static getPieceEdges(
    row: number,
    col: number,
    gridConfig: GridConfig,
    boundaries: Boundary[]
  ): PieceEdges {
    const { rows, cols } = gridConfig

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

    // 转换边界状态为边状态
    const topEdge = topBoundary 
      ? this.getOppositeState(topBoundary.state) // 上边需要相反状态
      : BoundaryState.FLAT
    
    const rightEdge = rightBoundary 
      ? rightBoundary.state // 右边保持原状态
      : BoundaryState.FLAT
    
    const bottomEdge = bottomBoundary 
      ? bottomBoundary.state // 下边保持原状态
      : BoundaryState.FLAT
    
    const leftEdge = leftBoundary 
      ? this.getOppositeState(leftBoundary.state) // 左边需要相反状态
      : BoundaryState.FLAT

    return { topEdge, rightEdge, bottomEdge, leftEdge }
  }
}

/**
 * 边界管理器类 - 负责边界约束逻辑
 */
export class BoundaryManager {
  /**
   * 生成初始边界数组
   * @param gridConfig 网格配置
   * @param dynamicPieceWidth 动态拼图块宽度（可选，默认使用gridConfig中的值）
   * @param dynamicPieceHeight 动态拼图块高度（可选，默认使用gridConfig中的值）
   * @returns 边界数组
   */
  static generateInitialBoundaries(
    gridConfig: GridConfig, 
    dynamicPieceWidth?: number, 
    dynamicPieceHeight?: number
  ): Boundary[] {
    const boundaries: Boundary[] = []
    const { rows, cols } = gridConfig
    const pieceWidth = dynamicPieceWidth ?? gridConfig.pieceWidth
    const pieceHeight = dynamicPieceHeight ?? gridConfig.pieceHeight

    // 生成水平边界
    for (let row = 0; row < rows - 1; row++) {
      for (let col = 0; col < cols; col++) {
        boundaries.push({
          id: `h_${row}_${col}`,
          row,
          col,
          direction: 'horizontal',
          state: BoundaryState.FLAT,
          startX: col * pieceWidth,
          startY: (row + 1) * pieceHeight,
          endX: (col + 1) * pieceWidth,
          endY: (row + 1) * pieceHeight
        })
      }
    }

    // 生成垂直边界
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols - 1; col++) {
        boundaries.push({
          id: `v_${row}_${col}`,
          row,
          col,
          direction: 'vertical',
          state: BoundaryState.FLAT,
          startX: (col + 1) * pieceWidth,
          startY: row * pieceHeight,
          endX: (col + 1) * pieceWidth,
          endY: (row + 1) * pieceHeight
        })
      }
    }

    return boundaries
  }

  /**
   * 随机化所有边界状态
   * @param boundaries 边界数组
   * @returns 更新后的边界数组
   */
  static randomizeBoundaries(boundaries: Boundary[]): Boundary[] {
    const states = [BoundaryState.FLAT, BoundaryState.CONVEX, BoundaryState.CONCAVE]
    
    return boundaries.map(boundary => ({
      ...boundary,
      state: states[Math.floor(Math.random() * states.length)]
    }))
  }

  /**
   * 更新边界状态并确保约束一致性
   * @param boundaries 边界数组
   * @param boundaryId 要更新的边界ID
   * @param newState 新状态
   * @returns 更新后的边界数组
   */
  static updateBoundaryState(
    boundaries: Boundary[],
    boundaryId: string,
    newState: BoundaryState
  ): Boundary[] {
    const updatedBoundaries = [...boundaries]
    const boundaryIndex = updatedBoundaries.findIndex(b => b.id === boundaryId)
    
    if (boundaryIndex !== -1) {
      updatedBoundaries[boundaryIndex] = {
        ...updatedBoundaries[boundaryIndex],
        state: newState
      }
    }

    return updatedBoundaries
  }
}
