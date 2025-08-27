/**
 * 拼图块散落算法工具函数
 */

import type { PieceStatus } from '../types'
import { 
  generateGridPositions, 
  shuffleArray, 
  generateRandomPosition,
  isPieceOverlapping
} from './puzzleUtils'

/**
 * 散落算法 - 规律排列模式
 */
export function scatterPieces(
  piecesToScatter: PieceStatus[],
  areaWidth: number,
  areaHeight: number,
  pieceWidth: number,
  pieceHeight: number,
  updatePiecePosition: (index: number, x: number, y: number) => void
) {
  const margin = 10
  const effectiveWidth = areaWidth - 2 * margin
  const effectiveHeight = areaHeight - 2 * margin
  
  const maxCols = Math.max(1, Math.floor(effectiveWidth / (pieceWidth + 5)))
  const maxRows = Math.max(1, Math.floor(effectiveHeight / (pieceHeight + 5)))
  const maxPositions = maxCols * maxRows
  
  if (piecesToScatter.length > maxPositions) {
    scatterPiecesCompactMode(piecesToScatter, areaWidth, areaHeight, pieceWidth, pieceHeight, updatePiecePosition)
    return
  }
  
  // 生成所有可能的位置
  const availablePositions = generateGridPositions(
    maxCols, 
    maxRows, 
    pieceWidth, 
    pieceHeight, 
    margin, 
    areaWidth, 
    areaHeight
  )
  
  // 随机打乱位置
  const shuffledPositions = shuffleArray(availablePositions)
  
  // 分配位置
  piecesToScatter.forEach((piece, index) => {
    if (index < shuffledPositions.length) {
      const pos = shuffledPositions[index]
      updatePiecePosition(piece.originalIndex, pos.x, pos.y)
    }
  })
}

/**
 * 紧凑模式散落算法 - 随机位置避免重叠
 */
export function scatterPiecesCompactMode(
  piecesToScatter: PieceStatus[],
  areaWidth: number,
  areaHeight: number,
  pieceWidth: number,
  pieceHeight: number,
  updatePiecePosition: (index: number, x: number, y: number) => void
) {
  const margin = 5
  
  piecesToScatter.forEach(piece => {
    let attempts = 0
    let validPosition = false
    
    while (!validPosition && attempts < 50) {
      const randomPos = generateRandomPosition(areaWidth, areaHeight, pieceWidth, pieceHeight, margin)
      
      // 检查是否与其他拼图块重叠
      const hasOverlap = piecesToScatter.some(otherPiece => {
        if (otherPiece === piece || !otherPiece.x) return false
        return isPieceOverlapping(randomPos, otherPiece, pieceWidth, pieceHeight)
      })
      
      if (!hasOverlap) {
        updatePiecePosition(piece.originalIndex, randomPos.x, randomPos.y)
        validPosition = true
      }
      
      attempts++
    }
    
    if (!validPosition) {
      const fallbackPos = generateRandomPosition(areaWidth, areaHeight, pieceWidth, pieceHeight, margin)
      updatePiecePosition(piece.originalIndex, fallbackPos.x, fallbackPos.y)
    }
  })
}

/**
 * 智能散落算法 - 自动选择最佳散落方式
 */
export function smartScatterPieces(
  piecesToScatter: PieceStatus[],
  areaWidth: number,
  areaHeight: number,
  pieceWidth: number,
  pieceHeight: number,
  updatePiecePosition: (index: number, x: number, y: number) => void
) {
  if (piecesToScatter.length === 0) return
  
  // 根据拼图块数量和区域大小选择散落策略
  const totalArea = areaWidth * areaHeight
  const pieceArea = pieceWidth * pieceHeight
  const occupancyRatio = (piecesToScatter.length * pieceArea) / totalArea
  
  if (occupancyRatio > 0.7) {
    // 高密度情况使用紧凑模式
    scatterPiecesCompactMode(piecesToScatter, areaWidth, areaHeight, pieceWidth, pieceHeight, updatePiecePosition)
  } else {
    // 低密度情况使用规律排列
    scatterPieces(piecesToScatter, areaWidth, areaHeight, pieceWidth, pieceHeight, updatePiecePosition)
  }
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
  
  smartScatterPieces(unplacedPieces, areaWidth, areaHeight, pieceWidth, pieceHeight, updatePiecePosition)
}
