/**
 * 游戏完成检查器
 * 负责检查游戏是否完成和相关逻辑
 */

import { ref } from 'vue'
import type { PieceStatus } from '../types'

export class GameCompletionChecker {
  private pieces = ref<PieceStatus[]>([])

  constructor(initialPieces: PieceStatus[] = []) {
    this.pieces.value = initialPieces
  }

  /**
   * 更新拼图块数据
   */
  updatePieces(pieces: PieceStatus[]): void {
    this.pieces.value = pieces
  }

  /**
   * 检查拼图板游戏是否完成
   */
  isPuzzleBoardGameCompleted(): boolean {
    if (this.pieces.value.length === 0) return false
    return this.pieces.value.every(piece => piece.isPlaced && piece.isCorrect)
  }

  /**
   * 检查游戏完成
   */
  checkGameCompletion(): boolean {
    const totalPieces = this.pieces.value.length
    if (totalPieces > 0) {
      const placedPieces = this.pieces.value.filter(piece => piece.isPlaced)
      if (placedPieces.length === totalPieces) {
        // 检查是否所有已放置的拼图块都在正确位置
        const correctPieces = this.pieces.value.filter(piece => piece.isPlaced && piece.isCorrect)
        if (correctPieces.length === totalPieces) {
          return true
        }
      }
    }

    // 基于 puzzleBoardPieces 的检查
    if (this.isPuzzleBoardGameCompleted()) {
      return true
    }

    return false
  }

  /**
   * 获取拼图块的正确位置
   */
  getCorrectPositionForPiece(pieceId: string): { row: number, col: number } | null {
    const piece = this.pieces.value.find(p => p.id === pieceId)
    if (!piece) return null
    
    // 这里需要根据拼图配置计算正确位置
    // 暂时返回 null，需要根据实际拼图配置实现
    return null
  }

  /**
   * 检查拼图块是否在指定位置
   */
  isPieceAtPosition(
    pieceId: string,
    targetRow: number,
    targetCol: number,
    tolerance: number = 5
  ): boolean {
    const piece = this.pieces.value.find(p => p.id === pieceId)
    if (!piece) return false

    // 这里需要根据拼图配置计算位置
    // 暂时返回 false，需要根据实际拼图配置实现
    return false
  }

  /**
   * 将拼图块吸附到网格
   */
  snapPieceToGrid(
    pieceId: string,
    targetRow: number,
    targetCol: number,
    pieceWidth: number,
    pieceHeight: number
  ): { x: number, y: number } | null {
    const piece = this.pieces.value.find(p => p.id === pieceId)
    if (!piece) return null

    // 计算网格位置
    const x = targetCol * (pieceWidth + 2) + 8
    const y = targetRow * (pieceHeight + 2) + 8

    return { x, y }
  }

  /**
   * 获取完成百分比
   */
  getCompletionPercentage(): number {
    const totalPieces = this.pieces.value.length
    if (totalPieces === 0) return 0

    const correctlyPlacedPieces = this.pieces.value.filter(piece => 
      piece.isPlaced && piece.isCorrect
    ).length

    return Math.round((correctlyPlacedPieces / totalPieces) * 100)
  }

  /**
   * 获取拼图板完成率
   */
  getPuzzleBoardCompletionRate(): number {
    const totalPieces = this.pieces.value.length
    if (totalPieces === 0) return 0

    const placedPieces = this.pieces.value.filter(piece => piece.isPlaced).length
    return Math.round((placedPieces / totalPieces) * 100)
  }

  /**
   * 获取未放置的拼图块
   */
  getUnplacedPieces(): PieceStatus[] {
    return this.pieces.value.filter(piece => !piece.isPlaced)
  }

  /**
   * 获取已放置的拼图块
   */
  getPlacedPieces(): PieceStatus[] {
    return this.pieces.value.filter(piece => piece.isPlaced)
  }

  /**
   * 获取正确放置的拼图块
   */
  getCorrectlyPlacedPieces(): PieceStatus[] {
    return this.pieces.value.filter(piece => piece.isPlaced && piece.isCorrect)
  }
}
