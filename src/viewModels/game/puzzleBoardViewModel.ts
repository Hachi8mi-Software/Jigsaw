/**
 * 拼图板业务逻辑ViewModel
 * 处理拼图块相关的业务逻辑，连接Store和View
 */

import type { PieceStatus, PuzzleData } from '../../types'
import { nextTick, StyleValue } from 'vue'
import { getGridPos } from '@/utils/gridUtils'
import { GameController } from './gameController'
import { 
  calculatePieceSize, 
  generateRandomPosition,
  isPieceOverlapping,
  isPositionInBounds,
  constrainPosition,
  calculateGridCoordinates
} from '@/utils/puzzleUtils'
import {
  createGridStyle,
  createPieceImageStyle,
  createPieceStyle,
  createPlacedPieceStyle
} from '@/utils/puzzleStyleUtils'
import {
  reshufflePieces
} from '@/utils/scatterUtils'

export class PuzzleBoardViewModel {
  // GameController 实例
  private gameController: GameController

  constructor(private puzzleData: PuzzleData | null) {
    this.gameController = new GameController()
  }

  // 计算属性
  get totalPieces() {
    return this.puzzleData ? 
      this.puzzleData.gridConfig.rows * this.puzzleData.gridConfig.cols : 0
  }

  get gridRows() {
    return this.puzzleData?.gridConfig.rows || 0
  }

  get gridCols() {
    return this.puzzleData?.gridConfig.cols || 0
  }

  get pieces() {
    return this.gameController.puzzleBoardData.pieces
  }

  get draggingPieceIndex() {
    return this.gameController.puzzleBoardData.draggingPieceIndex
  }

  get completionRate() {
    return this.gameController.puzzleBoardData.completionRate
  }

  // 计算网格样式
  getGridStyle(): StyleValue {
    return createGridStyle(this.gridCols, this.gridRows)
  }

  // 计算拼图块尺寸
  getPieceSize() {
    return calculatePieceSize(this.gridCols, this.gridRows)
  }

  // 获取拼图块图像样式
  getPieceImageStyle(piece: PieceStatus): StyleValue {
    if (!this.puzzleData) return {}
    return createPieceImageStyle(piece, this.puzzleData, this.gridCols, this.gridRows)
  }

  // 获取拼图块基础样式
  getPieceStyle(piece: PieceStatus): StyleValue {
    const pieceSize = this.getPieceSize()
    const isDragging = this.draggingPieceIndex === piece.originalIndex
    return createPieceStyle(piece, pieceSize.width, pieceSize.height, isDragging)
  }

  // 获取已放置拼图块样式
  getPlacedPieceStyle(piece: PieceStatus): StyleValue {
    const pieceSize = this.getPieceSize()
    const isDragging = this.draggingPieceIndex === piece.originalIndex
    return createPlacedPieceStyle(piece, pieceSize.width, pieceSize.height, this.gridCols, isDragging)
  }

  // 初始化拼图块
  initializePieces() {
    if (!this.puzzleData) return
    
    const total = this.totalPieces
    
    if (total === 0 || this.gridCols === 0 || this.gridRows === 0) {
      console.warn('拼图参数异常，跳过初始化:', { total, gridCols: this.gridCols, gridRows: this.gridRows })
      return
    }
    
    // 初始化拼图块数据
    this.gameController.initializePuzzleBoardData(total)
    
    // 散落拼图块
    nextTick(() => {
      this.shufflePieces()
    })
  }

  // 打乱拼图块
  shufflePieces() {
    if (!this.puzzleData) return
    
    const piecesAreaWidth = 320
    const piecesAreaHeight = 420
    const pieceSize = this.getPieceSize()
    
    const unplacedPieces = this.gameController.puzzleBoardData.unplacedPieces
    if (unplacedPieces.length === 0) return
    
    reshufflePieces(
      unplacedPieces, 
      piecesAreaWidth, 
      piecesAreaHeight, 
      pieceSize.width, 
      pieceSize.height,
      (index: number, x: number, y: number) => {
        this.gameController.updatePiecePosition(index, x, y)
      }
    )
  }

  // 重置拼图
  resetPuzzle() {
    this.gameController.resetAllPuzzleBoardPieces()
    this.initializePieces()
  }

  // 自动完成
  autoSolve() {
    if (!this.puzzleData) return
    
    this.pieces.forEach((piece: PieceStatus, index: number) => {
      const correctPos = getGridPos(index, this.getPieceSize(), this.gridCols)
      this.gameController.updatePiecePosition(index, correctPos.x, correctPos.y)
      this.gameController.setPiecePlaced(index, true, piece.originalIndex, true)
      console.log(`Piece ${index} snapped to grid position:`, correctPos)
    })
  }

  // 检查插槽是否被占用
  isSlotOccupied(slotIndex: number): boolean {
    return this.gameController.isSlotOccupied(slotIndex)
  }

  // 拖拽开始
  startDrag(index: number, clientX: number, clientY: number) {
    const piece = this.gameController.getPiece(index)
    if (!piece) return
    
    // 计算偏移量
    if (piece.isPlaced) {
      const pieceSize = this.getPieceSize()
      const gridIndex = piece.gridPosition || 0
      const row = Math.floor(gridIndex / this.gridCols)
      const col = gridIndex % this.gridCols
      const pieceXInGrid = col * (pieceSize.width + 2) + 8
      const pieceYInGrid = row * (pieceSize.height + 2) + 8
      
      this.gameController.updatePiecePosition(index, pieceXInGrid, pieceYInGrid)
    }
    
    const dragOffset = {
      x: clientX - piece.x,
      y: clientY - piece.y
    }
    
    this.gameController.setDraggingState(index, dragOffset)
  }

  // 拖拽过程中
  handleDrag(clientX: number, clientY: number) {
    if (this.draggingPieceIndex === -1) return
    
    const piece = this.gameController.getPiece(this.draggingPieceIndex)
    if (!piece) return
    
    const newX = clientX - this.gameController.dragOffset.x
    const newY = clientY - this.gameController.dragOffset.y
    
    this.gameController.updatePiecePosition(this.draggingPieceIndex, newX, newY)
  }

  // 拖拽结束
  stopDrag(clientX: number, clientY: number, gridRect: DOMRect | null) {
    if (this.draggingPieceIndex === -1) return
    
    const piece = this.gameController.getPiece(this.draggingPieceIndex)
    if (!piece) return
    
    if (gridRect && 
        clientX >= gridRect.left && clientX <= gridRect.right &&
        clientY >= gridRect.top && clientY <= gridRect.bottom) {
      
      this.handleGridDrop(clientX, clientY, gridRect)
    } else {
      this.handleOutsideDrop()
    }
    
    this.gameController.clearDraggingState()
  }

  // 处理在网格内放置
  private handleGridDrop(clientX: number, clientY: number, gridRect: DOMRect) {
    const pieceSize = this.getPieceSize()
    const { gridIndex } = calculateGridCoordinates(
      clientX, 
      clientY, 
      gridRect, 
      pieceSize.width, 
      pieceSize.height, 
      this.gridCols
    )
    
    if (gridIndex >= 0 && gridIndex < this.totalPieces && !this.isSlotOccupied(gridIndex)) {
      this.snapToGrid(gridIndex)
    } else {
      this.handleInvalidGridDrop()
    }
  }

  // 处理在网格外放置
  private handleOutsideDrop() {
    const piece = this.gameController.getPiece(this.draggingPieceIndex)
    if (!piece) return
    
    if (piece.isPlaced) {
      this.resetPlacedPiecePosition()
    } else {
      this.constrainToPiecesArea()
    }
  }

  // 处理无效网格放置
  private handleInvalidGridDrop() {
    const piece = this.gameController.getPiece(this.draggingPieceIndex)
    if (!piece) return
    
    if (piece.isPlaced) {
      this.resetPlacedPiecePosition()
    } else {
      this.constrainToPiecesArea()
    }
  }

  // 吸附到网格
  private snapToGrid(gridIndex: number) {
    const piece = this.gameController.getPiece(this.draggingPieceIndex)
    if (!piece) return

    const { x: newX, y: newY } = getGridPos(gridIndex, this.getPieceSize(), this.gridCols)
    const isCorrect = piece.originalIndex === gridIndex
    
    this.gameController.updatePiecePosition(this.draggingPieceIndex, newX, newY)
    this.gameController.setPiecePlaced(this.draggingPieceIndex, true, gridIndex, isCorrect)
    
    // 通知GameController增加步数
    this.gameController.incrementMoveCount()
    
    // 检查游戏完成
    this.checkGameCompletion()
    
    console.log(isCorrect ? '正确放置！' : '位置不正确')
  }

  // 重置已放置拼图块位置
  private resetPlacedPiecePosition() {
    const piece = this.gameController.getPiece(this.draggingPieceIndex)
    if (!piece || !piece.isPlaced) return
    
    const pieceSize = this.getPieceSize()
    const originalGridIndex = piece.gridPosition || 0
    const row = Math.floor(originalGridIndex / this.gridCols)
    const col = originalGridIndex % this.gridCols
    
    const originalX = 8 + col * (pieceSize.width + 2)
    const originalY = 8 + row * (pieceSize.height + 2)
    
    this.gameController.updatePiecePosition(this.draggingPieceIndex, originalX, originalY)
  }

  // 约束到拼图块区域
  private constrainToPiecesArea() {
    const piece = this.gameController.getPiece(this.draggingPieceIndex)
    if (!piece || piece.isPlaced) return
    
    const piecesAreaWidth = 320
    const piecesAreaHeight = 420
    const pieceSize = this.getPieceSize()
    
    if (!isPositionInBounds(piece.x, piece.y, pieceSize.width, pieceSize.height, piecesAreaWidth, piecesAreaHeight)) {
      
      // 找到合适的位置
      let attempts = 0
      let validPosition = false
      
      while (!validPosition && attempts < 20) {
        const randomPos = generateRandomPosition(piecesAreaWidth, piecesAreaHeight, pieceSize.width, pieceSize.height)
        
        const hasOverlap = this.gameController.puzzleBoardData.unplacedPieces.some((otherPiece: PieceStatus) => {
          if (otherPiece === piece) return false
          return isPieceOverlapping(randomPos, otherPiece, pieceSize.width, pieceSize.height)
        })
        
        if (!hasOverlap) {
          this.gameController.updatePiecePosition(this.draggingPieceIndex, randomPos.x, randomPos.y)
          validPosition = true
        }
        
        attempts++
      }
      
      if (!validPosition) {
        const constrainedPos = constrainPosition(
          piece.x, 
          piece.y, 
          pieceSize.width, 
          pieceSize.height, 
          piecesAreaWidth, 
          piecesAreaHeight
        )
        this.gameController.updatePiecePosition(this.draggingPieceIndex, constrainedPos.x, constrainedPos.y)
      }
    }
  }

  // 检查游戏完成
  private checkGameCompletion() {
    this.gameController.checkPuzzleBoardCompletion()
  }
}
