/**
 * 拼图板业务逻辑ViewModel
 * 处理拼图块相关的业务逻辑，连接Store和View
 */

import type { PieceStatus, PuzzleData } from '../../types'
import { nextTick, StyleValue } from 'vue'
import { getGridPos } from '@/utils/gridUtils'
import { 
  calculatePieceSize
} from '@/utils/layoutUtils'
import {
  generateRandomPosition,
  isPieceOverlapping,
  isPositionInBounds,
  constrainPosition,
  calculateGridCoordinates
} from '@/utils/positionUtils'
import {
  reshufflePieces,
  generateSmartPosition
} from '@/utils/puzzleUtils'
import {
  createGridStyle,
  createPieceImageStyle,
  createPieceStyle,
  createPlacedPieceStyle
} from '@/utils/puzzleStyleUtils'
import { audioUtils } from '@/utils/audioUtils'
import { useGameStore } from '@/stores/game'

export class PuzzleBoardViewModel {

  // 添加对 game store 的依赖
  private gameStore = useGameStore()
  // 游戏完成回调
  private onGameCompletedCallback?: () => void

  constructor(private puzzleData: PuzzleData | null) {
  }

  // 设置游戏完成回调
  setOnGameCompletedCallback(callback: () => void) {
    this.onGameCompletedCallback = callback
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
    return this.gameStore.getPuzzleBoardPiecesSnapshot()
  }

  get draggingPieceIndex() {
    return this.gameStore.draggingPieceIndex
  }

  get completionRate() {
    return this.gameStore.puzzleBoardCompletionRate
  }

  // 计算网格样式
  getGridStyle(): StyleValue {
    return createGridStyle(this.gridCols, this.gridRows, 300)
  }

  // 计算拼图块尺寸
  getPieceSize() {
    return calculatePieceSize(this.gridCols, this.gridRows, 300)
  }

  // 获取拼图块宽度
  get pieceWidth() {
    return this.getPieceSize().width
  }

  // 获取拼图块高度
  get pieceHeight() {
    return this.getPieceSize().height
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
    this.gameStore.initializePuzzleBoardPieces(total)
    
    // 散落拼图块
    nextTick(() => {
      this.shufflePieces()
    })
  }

  /**
   * 获取拼图块散落区域的实际尺寸
   */
  private getScatteredPiecesAreaSize(): { width: number; height: number } {
    // 尝试获取移动端散乱拼图块区域
    const mobileScattered = document.querySelector('.mobile-scattered') as HTMLElement
    if (mobileScattered) {
      const rect = mobileScattered.getBoundingClientRect()
      return {
        width: rect.width,
        height: rect.height
      }
    }
    
    // 尝试获取桌面端散乱拼图块区域
    const desktopScattered = document.querySelector('.scattered-pieces') as HTMLElement
    if (desktopScattered) {
      const rect = desktopScattered.getBoundingClientRect()
      return {
        width: rect.width,
        height: rect.height
      }
    }
    
    // 默认尺寸（桌面端）
    return {
      width: 320,
      height: 420
    }
  }

  // 打乱拼图块
  shufflePieces() {
    if (!this.puzzleData) return
    
    const areaSize = this.getScatteredPiecesAreaSize()
    const pieceSize = this.getPieceSize()
    
    const unplacedPieces = this.gameStore.getPuzzleBoardPiecesSnapshot().filter(piece => !piece.isPlaced)
    if (unplacedPieces.length === 0) return
    
    reshufflePieces(
      unplacedPieces, 
      areaSize.width, 
      areaSize.height, 
      pieceSize.width, 
      pieceSize.height,
      (index: number, x: number, y: number) => {
        this.gameStore.updatePiecePosition(index, x, y)
      }
    )
  }

  // 重置拼图
  resetPuzzle() {
    this.gameStore.resetAllPuzzleBoardPieceStates()
    this.initializePieces()
  }

  // 自动完成
  autoSolve() {
    if (!this.puzzleData) return
    
    this.pieces.forEach((piece: PieceStatus, index: number) => {
      // 获取实际的网格位置
      let correctX = 0
      let correctY = 0
      
      const gridContainer = document.querySelector('.puzzle-grid') as HTMLElement
      if (gridContainer) {
        const gridSlots = gridContainer.querySelectorAll('.grid-slot')
        const targetSlot = gridSlots[piece.originalIndex] as HTMLElement
        
        if (targetSlot) {
          // 使用DOM元素的实际位置
          correctX = targetSlot.offsetLeft
          correctY = targetSlot.offsetTop
        } else {
          // 降级到计算位置
          const correctPos = getGridPos(piece.originalIndex, this.getPieceSize(), this.gridCols)
          correctX = correctPos.x
          correctY = correctPos.y
        }
      } else {
        // 降级到计算位置
        const correctPos = getGridPos(piece.originalIndex, this.getPieceSize(), this.gridCols)
        correctX = correctPos.x
        correctY = correctPos.y
      }
      
      this.gameStore.updatePiecePosition(index, correctX, correctY)
      this.gameStore.setPuzzleBoardPiecePlaced(index, true, piece.originalIndex, true)
      console.log(`Piece ${index} snapped to grid position:`, { x: correctX, y: correctY })
    })
    
    // 检查游戏是否完成并触发完成事件
    this.checkGameCompletion()
  }

  // 检查插槽是否被占用
  isSlotOccupied(slotIndex: number): boolean {
    return this.gameStore.isPuzzleBoardSlotOccupied(slotIndex)
  }

  // 拖拽开始
  startDrag(index: number, clientX: number, clientY: number) {
    const piece = this.gameStore.getPuzzleBoardPiece(index)
    if (!piece) return
    
    // 获取拼图块的实际显示位置
    let actualX = piece.x
    let actualY = piece.y
    
    // 如果是已放置的拼图块，获取其在网格中的实际显示位置
    if (piece.isPlaced && piece.gridPosition !== undefined) {
      const gridContainer = document.querySelector('.puzzle-grid') as HTMLElement
      if (gridContainer) {
        const gridSlots = gridContainer.querySelectorAll('.grid-slot')
        const targetSlot = gridSlots[piece.gridPosition] as HTMLElement
        
        if (targetSlot) {
          // 使用DOM元素的实际位置
          actualX = targetSlot.offsetLeft
          actualY = targetSlot.offsetTop
        } else {
          // 降级到计算位置
          const pieceSize = this.getPieceSize()
          const row = Math.floor(piece.gridPosition / this.gridCols)
          const col = piece.gridPosition % this.gridCols
          actualX = col * (pieceSize.width + 2) + 8
          actualY = row * (pieceSize.height + 2) + 8
        }
      } else {
        // 降级到计算位置
        const pieceSize = this.getPieceSize()
        const row = Math.floor(piece.gridPosition / this.gridCols)
        const col = piece.gridPosition % this.gridCols
        actualX = col * (pieceSize.width + 2) + 8
        actualY = row * (pieceSize.height + 2) + 8
      }
      
      // 更新拼图块位置到拖拽起始位置
      this.gameStore.updatePiecePosition(index, actualX, actualY)
    }
    
    // 基于实际显示位置计算拖拽偏移量
    const dragOffset = {
      x: clientX - actualX,
      y: clientY - actualY
    }
    
    this.gameStore.setDraggingPiece(index)
    this.gameStore.setDragOffset(dragOffset)
  }
  
  // 拖拽过程中
  handleDrag(clientX: number, clientY: number) {
    if (this.draggingPieceIndex === -1) return
    
    const piece = this.getPiece(this.draggingPieceIndex)
    if (!piece) return
    
    const newX = clientX - this.gameStore.dragOffset.x
    const newY = clientY - this.gameStore.dragOffset.y
    this.gameStore.updatePiecePosition(this.draggingPieceIndex, newX, newY)
  }

  // 拖拽结束
  stopDrag(clientX: number, clientY: number, gridRect: DOMRect | null) {
    if (this.draggingPieceIndex === -1) return
    
    const piece = this.gameStore.getPuzzleBoardPiece(this.draggingPieceIndex)
    if (!piece) return
    
    if (gridRect && 
        clientX >= gridRect.left && clientX <= gridRect.right &&
        clientY >= gridRect.top && clientY <= gridRect.bottom) {
      
      this.handleGridDrop(clientX, clientY, gridRect)
    } else {
      this.handleOutsideDrop()
    }
    
    this.gameStore.clearDragging()
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
    
    // 处理网格放置
    if (gridIndex >= 0 && gridIndex < this.totalPieces) {
      if (!this.isSlotOccupied(gridIndex)) {
        // 空格子，直接放置
        this.snapToGrid(gridIndex)
      } else {
        // 格子被占用，执行对换
        this.swapWithOccupiedSlot(gridIndex)
      }
    } else {
      this.handleInvalidGridDrop()
    }
  }

  // 处理在网格外放置
  private handleOutsideDrop() {
    const piece = this.gameStore.getPuzzleBoardPiece(this.draggingPieceIndex)
    if (!piece) return
    
    if (piece.isPlaced) {
      this.resetPlacedPiecePosition()
    } else {
      this.constrainToPiecesArea()
    }
  }

  // 处理无效网格放置
  private handleInvalidGridDrop() {
    const piece = this.gameStore.getPuzzleBoardPiece(this.draggingPieceIndex)
    if (!piece) return
    
    if (piece.isPlaced) {
      this.resetPlacedPiecePosition()
    } else {
      this.constrainToPiecesArea()
    }
  }

  // 吸附到网格
  private snapToGrid(gridIndex: number) {
    const piece = this.gameStore.getPuzzleBoardPiece(this.draggingPieceIndex)
    if (!piece) return

    // 获取实际的网格位置
    let newX = 0
    let newY = 0
    
    const gridContainer = document.querySelector('.puzzle-grid') as HTMLElement
    if (gridContainer) {
      const gridSlots = gridContainer.querySelectorAll('.grid-slot')
      const targetSlot = gridSlots[gridIndex] as HTMLElement
      
      if (targetSlot) {
        // 使用DOM元素的实际位置
        newX = targetSlot.offsetLeft
        newY = targetSlot.offsetTop
      } else {
        // 降级到计算位置
        const { x, y } = getGridPos(gridIndex, this.getPieceSize(), this.gridCols)
        newX = x
        newY = y
      }
    } else {
      // 降级到计算位置
      const { x, y } = getGridPos(gridIndex, this.getPieceSize(), this.gridCols)
      newX = x
      newY = y
    }
    
    const isCorrect = piece.originalIndex === gridIndex
    console.log("x: ", newX, "y: ", newY)
    
    this.gameStore.updatePiecePosition(this.draggingPieceIndex, newX, newY)
    this.gameStore.setPuzzleBoardPiecePlaced(this.draggingPieceIndex, true, gridIndex, isCorrect)
    
    // 播放拼图块放置音效
    audioUtils.playPiecePlaced()
    
    // 增加步数
    this.gameStore.incrementMoveCount()
    
    // 重新计算所有拼图块的正确性状态
    this.gameStore.recalculateAllCorrectness()
    
    // 检查游戏完成
    this.checkGameCompletion()
    
    console.log(isCorrect ? '正确放置！' : '位置不正确')
  }

  // 与占用格子的拼图块对换
  private swapWithOccupiedSlot(targetGridIndex: number) {
    const draggingPiece = this.gameStore.getPuzzleBoardPiece(this.draggingPieceIndex)
    if (!draggingPiece) return

    // 获取占用目标格子的拼图块索引
    const occupiedPieceIndex = this.gameStore.getPieceAtSlot(targetGridIndex)
    if (occupiedPieceIndex === -1) return

    const occupiedPiece = this.gameStore.getPuzzleBoardPiece(occupiedPieceIndex)
    if (!occupiedPiece) return

    // 如果拖拽的拼图块还没有放置，先将其放置到目标位置
    if (!draggingPiece.isPlaced) {
      // 获取实际的网格位置
      let newX = 0
      let newY = 0
      
      const gridContainer = document.querySelector('.puzzle-grid') as HTMLElement
      if (gridContainer) {
        const gridSlots = gridContainer.querySelectorAll('.grid-slot')
        const targetSlot = gridSlots[targetGridIndex] as HTMLElement
        
        if (targetSlot) {
          // 使用DOM元素的实际位置
          newX = targetSlot.offsetLeft
          newY = targetSlot.offsetTop
        } else {
          // 降级到计算位置
          const { x, y } = getGridPos(targetGridIndex, this.getPieceSize(), this.gridCols)
          newX = x
          newY = y
        }
      } else {
        // 降级到计算位置
        const { x, y } = getGridPos(targetGridIndex, this.getPieceSize(), this.gridCols)
        newX = x
        newY = y
      }
      
      const isCorrect = draggingPiece.originalIndex === targetGridIndex
      
      this.gameStore.updatePiecePosition(this.draggingPieceIndex, newX, newY)
      this.gameStore.setPuzzleBoardPiecePlaced(this.draggingPieceIndex, true, targetGridIndex, isCorrect)
      
      // 将原来占用该位置的拼图块移出网格
      this.gameStore.setPuzzleBoardPiecePlaced(occupiedPieceIndex, false, undefined, undefined)
      
      // 将原拼图块移动到拼图区域
      const pieceSize = this.getPieceSize()
      const areaSize = this.getScatteredPiecesAreaSize()
      
      // 获取所有未放置的拼图块（包括即将被移出的拼图块）
      const unplacedPieces = this.gameStore.pieces.filter((piece: PieceStatus) => !piece.isPlaced)
      
      // 使用智能位置生成，避免重叠
      const smartPos = generateSmartPosition(
        unplacedPieces,
        areaSize.width,
        areaSize.height,
        pieceSize.width,
        pieceSize.height,
        5
      )
      
      this.gameStore.updatePiecePosition(occupiedPieceIndex, smartPos.x, smartPos.y)
    } else {
      // 如果拖拽的拼图块已经放置，执行对换
      this.gameStore.swapPuzzleBoardPieces(this.draggingPieceIndex, occupiedPieceIndex)
    }

    // 播放拼图块放置音效
    audioUtils.playPiecePlaced()
    
    // 增加步数
    this.gameStore.incrementMoveCount()
    
    // 重新计算所有拼图块的正确性状态
    this.gameStore.recalculateAllCorrectness()
    
    // 检查游戏完成
    this.checkGameCompletion()
    
    console.log('拼图块对换完成')
  }

  // 重置已放置拼图块位置
  private resetPlacedPiecePosition() {
    const piece = this.gameStore.getPuzzleBoardPiece(this.draggingPieceIndex)
    if (!piece || !piece.isPlaced) return
    
    const pieceSize = this.getPieceSize()
    const originalGridIndex = piece.gridPosition || 0
    const row = Math.floor(originalGridIndex / this.gridCols)
    const col = originalGridIndex % this.gridCols
    
    const originalX = 6 + col * (pieceSize.width + 2)
    const originalY = 6 + row * (pieceSize.height + 2)
    
    this.gameStore.updatePiecePosition(this.draggingPieceIndex, originalX, originalY)
  }

  // 约束到拼图块区域
  private constrainToPiecesArea() {
    const piece = this.gameStore.getPuzzleBoardPiece(this.draggingPieceIndex)
    if (!piece || piece.isPlaced) return
    
    const areaSize = this.getScatteredPiecesAreaSize()
    const pieceSize = this.getPieceSize()
    
    if (!isPositionInBounds(piece.x, piece.y, pieceSize.width, pieceSize.height, areaSize.width, areaSize.height)) {
      
      // 找到合适的位置
      let attempts = 0
      let validPosition = false
      
      while (!validPosition && attempts < 20) {
        const randomPos = generateRandomPosition(areaSize.width, areaSize.height, pieceSize.width, pieceSize.height)
        
        const hasOverlap = this.gameStore.getPuzzleBoardPiecesSnapshot().some((otherPiece: PieceStatus) => {
          if (otherPiece === piece) return false
          return isPieceOverlapping(randomPos, otherPiece, pieceSize.width, pieceSize.height)
        })
        
        if (!hasOverlap) {
          this.gameStore.updatePiecePosition(this.draggingPieceIndex, randomPos.x, randomPos.y)
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
          areaSize.width, 
          areaSize.height
        )
        this.gameStore.updatePiecePosition(this.draggingPieceIndex, constrainedPos.x, constrainedPos.y)
      }
    }
  }

  // 检查游戏完成
  private checkGameCompletion() {
    if (this.gameStore.checkGameCompletion()) {
      audioUtils.playPuzzleCompleted()
      // 触发游戏完成回调
      if (this.onGameCompletedCallback) {
        this.onGameCompletedCallback()
      }
    }
  }

  // 获取拼图块
  getPiece(index: number): PieceStatus | undefined {
    return this.gameStore.getPuzzleBoardPiece(index)
  }
}
