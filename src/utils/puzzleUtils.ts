/**
 * 拼图相关工具函数
 */

/**
 * 拼图核心工具函数
 * 负责拼图块状态确定和散落算法
 */

import { PieceStatus, Boundary, PieceEdges, BoundaryState } from '../types'
import { BoundaryStateConverter } from './boundaryUtils'
import { isPieceOverlapping, generateRandomPosition } from './positionUtils'

/**
 * 确定拼图块的边状态
 * @param originalIndex 拼图块的原始索引
 * @param gridCols 网格列数
 * @param gridRows 网格行数
 * @param boundaries 边界数组（可选，如果提供则使用编辑器数据）
 * @returns 返回四个边的状态，使用BoundaryState枚举
 *         如果没有边界数据，所有边都返回FLAT（平边）
 */
export function determinePieceEdges(
  originalIndex: number,
  gridCols: number,
  gridRows: number,
  boundaries?: Boundary[]
): PieceEdges {
  const row = Math.floor(originalIndex / gridCols)
  const col = originalIndex % gridCols
  
  // 如果提供了边界数据，使用统一的转换器
  if (boundaries && boundaries.length > 0) {
    const gridConfig = { rows: gridRows, cols: gridCols, pieceWidth: 100, pieceHeight: 100 }
    return BoundaryStateConverter.getPieceEdges(row, col, gridConfig, boundaries)
  }
  
  // 否则所有边都设置为平边
  return {
    topEdge: BoundaryState.FLAT,
    rightEdge: BoundaryState.FLAT,
    bottomEdge: BoundaryState.FLAT,
    leftEdge: BoundaryState.FLAT
  }
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
 * 散落算法 - 将拼图块随机分布在指定区域内
 */
export function scatterPieces(
  piecesToScatter: PieceStatus[],
  areaWidth: number,
  areaHeight: number,
  pieceWidth: number,
  pieceHeight: number,
  updatePiecePosition: (index: number, x: number, y: number) => void
) {
  const margin = 5
  // 记录已经打乱过的拼图块
  const scatteredPieces: PieceStatus[] = []
  
  piecesToScatter.forEach(piece => {
    let attempts = 0
    let validPosition = false
    
    while (!validPosition && attempts < 100) {
      const randomPos = generateRandomPosition(areaWidth, areaHeight, pieceWidth, pieceHeight, margin)
      
      // 只检查是否与本轮已经打乱过的拼图块重叠
      const hasOverlap = scatteredPieces.some(scatteredPiece => {
        return isPieceOverlapping(randomPos, scatteredPiece, pieceWidth, pieceHeight)
      })
      
      if (!hasOverlap) {
        updatePiecePosition(piece.originalIndex, randomPos.x, randomPos.y)
        // 更新拼图块位置并添加到已打乱列表
        const updatedPiece = { ...piece, x: randomPos.x, y: randomPos.y }
        scatteredPieces.push(updatedPiece)
        validPosition = true
      }
      
      attempts++
    }
    
    if (!validPosition) {
      const fallbackPos = generateRandomPosition(areaWidth, areaHeight, pieceWidth, pieceHeight, margin)
      updatePiecePosition(piece.originalIndex, fallbackPos.x, fallbackPos.y)
      // 即使是fallback位置也要添加到已打乱列表
      const updatedPiece = { ...piece, x: fallbackPos.x, y: fallbackPos.y }
      scatteredPieces.push(updatedPiece)
    }
  })
}

/**
 * 重新散落指定的拼图块
 */
export function reshufflePieces(
  unplacedPieces: PieceStatus[],
  areaWidth: number,
  areaHeight: number,
  pieceWidth: number,
  pieceHeight: number,
  updatePiecePosition: (index: number, x: number, y: number) => void
) {
  if (unplacedPieces.length === 0) return
  
  scatterPieces(unplacedPieces, areaWidth, areaHeight, pieceWidth, pieceHeight, updatePiecePosition)
}

