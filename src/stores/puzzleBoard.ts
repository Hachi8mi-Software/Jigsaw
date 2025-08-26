/**
 * 拼图板数据状态管理Store
 * 专门管理拼图块的位置、状态等数据
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PuzzleData } from '../types'

// 拼图块状态接口
export interface PieceStatus {
  originalIndex: number      // 原始索引（正确位置）
  currentX: number          // 当前X坐标
  currentY: number          // 当前Y坐标
  isPlaced: boolean         // 是否已放置
  isCorrect?: boolean       // 是否放在正确位置
  gridPosition?: number     // 网格位置索引
}

export const usePuzzleBoardStore = defineStore('puzzleBoard', () => {
  // 基础状态
  const pieces = ref<PieceStatus[]>([])
  const draggingPieceIndex = ref(-1)
  const dragOffset = ref({ x: 0, y: 0 })

  // 计算属性
  const unplacedPieces = computed(() => {
    return pieces.value.filter(piece => !piece.isPlaced)
  })

  const placedPieces = computed(() => {
    return pieces.value.filter(piece => piece.isPlaced)
  })

  const correctlyPlacedPieces = computed(() => {
    return pieces.value.filter(piece => piece.isPlaced && piece.isCorrect)
  })

  const completionRate = computed(() => {
    if (pieces.value.length === 0) return 0
    return Math.round((correctlyPlacedPieces.value.length / pieces.value.length) * 100)
  })

  // 基础数据操作方法
  const initializePieces = (totalPieces: number) => {
    pieces.value = Array.from({ length: totalPieces }, (_, i) => ({
      originalIndex: i,
      currentX: 0,
      currentY: 0,
      isPlaced: false
    }))
  }

  const updatePiecePosition = (index: number, x: number, y: number) => {
    const piece = pieces.value[index]
    if (piece) {
      piece.currentX = x
      piece.currentY = y
    }
  }

  const setPiecePlaced = (index: number, isPlaced: boolean, gridPosition?: number, isCorrect?: boolean) => {
    const piece = pieces.value[index]
    if (piece) {
      piece.isPlaced = isPlaced
      piece.gridPosition = gridPosition
      piece.isCorrect = isCorrect
    }
  }

  const getPiece = (index: number): PieceStatus | undefined => {
    return pieces.value[index]
  }

  const isSlotOccupied = (slotIndex: number): boolean => {
    return pieces.value.some(piece => piece.isPlaced && piece.gridPosition === slotIndex)
  }

  // 重置拼图块状态
  const resetAllPieceStates = () => {
    pieces.value.forEach(piece => {
      piece.isPlaced = false
      piece.isCorrect = undefined
      piece.gridPosition = undefined
    })
  }

  // 清除拼图块数据
  const clearPieces = () => {
    pieces.value = []
    draggingPieceIndex.value = -1
    dragOffset.value = { x: 0, y: 0 }
  }

  // 拖拽相关状态管理
  const setDraggingPiece = (index: number) => {
    draggingPieceIndex.value = index
  }

  const clearDragging = () => {
    draggingPieceIndex.value = -1
  }

  const setDragOffset = (offset: { x: number, y: number }) => {
    dragOffset.value = offset
  }

  // 从外部数据恢复状态
  const restorePiecesFromData = (piecesData: PieceStatus[]) => {
    pieces.value = piecesData.map(piece => ({ ...piece }))
  }

  // 获取状态快照
  const getPiecesSnapshot = (): PieceStatus[] => {
    return pieces.value.map(piece => ({ ...piece }))
  }

  // 检查游戏是否完成
  const isGameCompleted = (): boolean => {
    if (pieces.value.length === 0) return false
    return pieces.value.every(piece => piece.isPlaced && piece.isCorrect)
  }

  return {
    // 状态
    pieces,
    draggingPieceIndex,
    dragOffset,

    // 计算属性
    unplacedPieces,
    placedPieces,
    correctlyPlacedPieces,
    completionRate,

    // 方法
    initializePieces,
    updatePiecePosition,
    setPiecePlaced,
    getPiece,
    isSlotOccupied,
    resetAllPieces: resetAllPieceStates,
    resetPieces: clearPieces,
    setDraggingPiece,
    clearDragging,
    setDragOffset,
    restorePiecesFromData,
    getPiecesSnapshot,
    isGameCompleted
  }
})
