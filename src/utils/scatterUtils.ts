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
 * 散落算法
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
