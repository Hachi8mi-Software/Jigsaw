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
