/**
 * SVG工具类 - 负责生成拼图块的SVG路径
 * 采用面向对象设计模式
 */

import { BoundaryState, type Boundary, type GridConfig } from '../types'

/**
 * SVG路径生成器类
 */
export class SvgPathGenerator {
  private static readonly CURVE_INTENSITY = 0.3 // 曲线强度
  private static readonly CONNECTOR_SIZE = 0.15 // 连接器大小比例

  /**
   * 生成单个边界的SVG路径数据
   * @param type 边界类型
   * @param startX 起始X坐标
   * @param startY 起始Y坐标
   * @param endX 结束X坐标
   * @param endY 结束Y坐标
   * @param pieceWidth 拼图块宽度
   * @param pieceHeight 拼图块高度
   * @returns SVG路径字符串
   */
  static generateBoundaryPath(
    type: BoundaryState,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    pieceWidth: number,
    pieceHeight: number
  ): string {
    if (type === BoundaryState.FLAT) {
      return `L ${endX} ${endY}`
    }

    const isHorizontal = Math.abs(endX - startX) > Math.abs(endY - startY)
    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2
    
    const connectorSize = isHorizontal 
      ? pieceHeight * this.CONNECTOR_SIZE 
      : pieceWidth * this.CONNECTOR_SIZE

    if (isHorizontal) {
      return this.generateHorizontalConnector(
        startX, startY, endX, endY, midX, midY, connectorSize, type
      )
    } else {
      return this.generateVerticalConnector(
        startX, startY, endX, endY, midX, midY, connectorSize, type
      )
    }
  }

  /**
   * 生成水平方向的连接器
   */
  private static generateHorizontalConnector(
    startX: number, startY: number, endX: number, endY: number,
    midX: number, midY: number, connectorSize: number, type: BoundaryState
  ): string {
    const direction = type === BoundaryState.CONVEX ? -1 : 1
    const controlOffset = connectorSize * this.CURVE_INTENSITY
    
    const cp1X = midX - connectorSize / 2
    const cp1Y = midY
    const cp2X = midX - connectorSize / 4
    const cp2Y = midY + direction * connectorSize
    const cp3X = midX + connectorSize / 4
    const cp3Y = midY + direction * connectorSize
    const cp4X = midX + connectorSize / 2
    const cp4Y = midY

    return `L ${cp1X} ${cp1Y} ` +
           `Q ${cp2X - controlOffset} ${cp2Y} ${cp2X} ${cp2Y} ` +
           `Q ${midX} ${midY + direction * connectorSize * 1.2} ${cp3X} ${cp3Y} ` +
           `Q ${cp4X + controlOffset} ${cp4Y} ${cp4X} ${cp4Y} ` +
           `L ${endX} ${endY}`
  }

  /**
   * 生成垂直方向的连接器
   */
  private static generateVerticalConnector(
    startX: number, startY: number, endX: number, endY: number,
    midX: number, midY: number, connectorSize: number, type: BoundaryState
  ): string {
    const direction = type === BoundaryState.CONVEX ? -1 : 1
    const controlOffset = connectorSize * this.CURVE_INTENSITY
    
    const cp1X = midX
    const cp1Y = midY - connectorSize / 2
    const cp2X = midX + direction * connectorSize
    const cp2Y = midY - connectorSize / 4
    const cp3X = midX + direction * connectorSize
    const cp3Y = midY + connectorSize / 4
    const cp4X = midX
    const cp4Y = midY + connectorSize / 2

    return `L ${cp1X} ${cp1Y} ` +
           `Q ${cp2X} ${cp2Y - controlOffset} ${cp2X} ${cp2Y} ` +
           `Q ${midX + direction * connectorSize * 1.2} ${midY} ${cp3X} ${cp3Y} ` +
           `Q ${cp4X} ${cp4Y + controlOffset} ${cp4X} ${cp4Y} ` +
           `L ${endX} ${endY}`
  }

  /**
   * 生成完整拼图块的SVG路径
   * @param row 行索引
   * @param col 列索引
   * @param gridConfig 网格配置
   * @param boundaries 边界数组
   * @returns 完整的SVG路径字符串
   */
  static generatePiecePath(
    row: number,
    col: number,
    gridConfig: GridConfig,
    boundaries: Boundary[]
  ): string {
    const { pieceWidth, pieceHeight } = gridConfig
    const startX = col * pieceWidth
    const startY = row * pieceHeight

    let path = `M ${startX} ${startY}`

    // 顶边
    if (row > 0) {
      const topBoundary = boundaries.find(b => 
        b.row === row - 1 && b.col === col && b.direction === 'horizontal'
      )
      const boundaryState = topBoundary ? this.getOppositeState(topBoundary.state) : BoundaryState.FLAT
      path += this.generateBoundaryPath(
        boundaryState, startX, startY, startX + pieceWidth, startY,
        pieceWidth, pieceHeight
      )
    } else {
      path += ` L ${startX + pieceWidth} ${startY}`
    }

    // 右边
    if (col < gridConfig.cols - 1) {
      const rightBoundary = boundaries.find(b => 
        b.row === row && b.col === col && b.direction === 'vertical'
      )
      const boundaryState = rightBoundary?.state || BoundaryState.FLAT
      path += this.generateBoundaryPath(
        boundaryState, startX + pieceWidth, startY, startX + pieceWidth, startY + pieceHeight,
        pieceWidth, pieceHeight
      )
    } else {
      path += ` L ${startX + pieceWidth} ${startY + pieceHeight}`
    }

    // 底边
    if (row < gridConfig.rows - 1) {
      const bottomBoundary = boundaries.find(b => 
        b.row === row && b.col === col && b.direction === 'horizontal'
      )
      const boundaryState = bottomBoundary?.state || BoundaryState.FLAT
      path += this.generateBoundaryPath(
        boundaryState, startX + pieceWidth, startY + pieceHeight, startX, startY + pieceHeight,
        pieceWidth, pieceHeight
      )
    } else {
      path += ` L ${startX} ${startY + pieceHeight}`
    }

    // 左边
    if (col > 0) {
      const leftBoundary = boundaries.find(b => 
        b.row === row && b.col === col - 1 && b.direction === 'vertical'
      )
      const boundaryState = leftBoundary ? this.getOppositeState(leftBoundary.state) : BoundaryState.FLAT
      path += this.generateBoundaryPath(
        boundaryState, startX, startY + pieceHeight, startX, startY,
        pieceWidth, pieceHeight
      )
    } else {
      path += ` L ${startX} ${startY}`
    }

    path += ' Z'
    return path
  }

  /**
   * 获取相对的边界状态（用于相邻拼图块）
   */
  private static getOppositeState(state: BoundaryState): BoundaryState {
    switch (state) {
      case BoundaryState.CONVEX:
        return BoundaryState.CONCAVE
      case BoundaryState.CONCAVE:
        return BoundaryState.CONVEX
      default:
        return BoundaryState.FLAT
    }
  }
}

/**
 * 边界管理器类 - 负责边界约束逻辑
 */
export class BoundaryManager {
  /**
   * 生成初始边界数组
   * @param gridConfig 网格配置
   * @returns 边界数组
   */
  static generateInitialBoundaries(gridConfig: GridConfig): Boundary[] {
    const boundaries: Boundary[] = []
    const { rows, cols, pieceWidth, pieceHeight } = gridConfig

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
