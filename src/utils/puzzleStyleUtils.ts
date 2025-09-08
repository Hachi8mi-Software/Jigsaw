/**
 * 拼图板样式相关工具函数
 */

import type { StyleValue } from 'vue'
import type { PieceStatus, PuzzleData } from '../types'
import { getGridPos } from './gridUtils'

/**
 * 计算网格样式
 * 根据拼图比例动态调整尺寸
 */
export function createGridStyle(gridCols: number, gridRows: number, baseSize: number = 300): StyleValue {
  // 使用统一的尺寸计算逻辑
  const { width, height } = calculateGridDimensions(gridCols, gridRows, baseSize)
  
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
    gridTemplateRows: `repeat(${gridRows}, 1fr)`,
    gap: '2px',
    width: `${width}px`,
    height: `${height}px`,
    border: `2px dashed var(--settings-border, #ccc)`,
    borderRadius: '8px',
    padding: '8px',
    backgroundColor: 'var(--settings-card-bg, #f9f9f9)',
    position: 'relative' as const
  }
}

/**
 * 计算网格尺寸 - 统一的尺寸计算逻辑
 */
function calculateGridDimensions(gridCols: number, gridRows: number, baseSize: number = 300) {
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
 * 获取拼图块图像样式
 */
export function createPieceImageStyle(
  piece: PieceStatus, 
  puzzleData: PuzzleData,
  gridCols: number,
  gridRows: number
): StyleValue {
  const correctRow = Math.floor(piece.originalIndex / gridCols)
  const correctCol = piece.originalIndex % gridCols
  
  return {
    backgroundImage: `url(${puzzleData.imageUrl})`,
    backgroundSize: `${gridCols * 100}% ${gridRows * 100}%`,
    backgroundPosition: `-${correctCol * 100}% -${correctRow * 100}%`,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: 'bold',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
  }
}

/**
 * 获取拼图块基础样式
 */
export function createPieceStyle(
  piece: PieceStatus,
  pieceWidth: number,
  pieceHeight: number,
  isDragging: boolean = false
): StyleValue {
  return {
    position: 'absolute' as const,
    left: `${piece.x}px`,
    top: `${piece.y}px`,
    width: `${pieceWidth}px`,
    height: `${pieceHeight}px`,
    border: '2px solid #666',
    borderRadius: '4px',
    cursor: 'grab',
    overflow: 'hidden',
    backgroundColor: 'var(--settings-card-bg, white)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    zIndex: isDragging ? 1000 : 10,
    transform: isDragging ? 'scale(1.05)' : 'scale(1)',
    transition: isDragging ? 'none' : 'transform 0.2s ease'
  }
}

/**
 * 获取已放置拼图块样式
 */
export function createPlacedPieceStyle(
  piece: PieceStatus,
  pieceWidth: number,
  pieceHeight: number,
  gridCols: number,
  isDragging: boolean = false
): StyleValue {
  const gridIndex = piece.gridPosition || 0
  
  // 如果正在拖拽，使用拖拽位置
  if (isDragging) {
    return {
      position: 'absolute' as const,
      left: `${piece.x}px`,
      top: `${piece.y}px`,
      width: `${pieceWidth}px`,
      height: `${pieceHeight}px`,
      border: piece.isCorrect ? '2px solid #27ae60' : '2px solid #e74c3c',
      borderRadius: '4px',
      overflow: 'hidden',
      backgroundColor: 'var(--settings-card-bg, white)',
      zIndex: 1000,
      transform: 'scale(1.05)',
      transition: 'none',
      cursor: 'grabbing'
    }
  }
  
  // 使用 gridUtils 计算网格位置
  const { x, y } = getGridPos(gridIndex, { width: pieceWidth, height: pieceHeight }, gridCols)
  
  // 正常放置位置
  return {
    position: 'absolute' as const,
    left: `${x}px`,
    top: `${y}px`,
    width: `${pieceWidth}px`,
    height: `${pieceHeight}px`,
    border: piece.isCorrect ? '2px solid #27ae60' : '2px solid #e74c3c',
    borderRadius: '4px',
    overflow: 'hidden',
    backgroundColor: 'var(--settings-card-bg, white)',
    zIndex: 5,
    cursor: 'grab'
  }
}
