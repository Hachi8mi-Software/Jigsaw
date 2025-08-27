/**
 * 拼图板业务逻辑ViewModel
 * 处理拼图块相关的业务逻辑，连接Store和View
 */

import { useGameStore } from '../stores/game'
import type { PieceStatus, PuzzleData } from '../types'
import { StyleValue, watch, WatchStopHandle } from 'vue'
import { getGridPos } from '@/utils/gridUtils'

export class PuzzleBoardViewModel {
  // Store 实例 (现在只使用 gameStore，因为 puzzleBoard 功能已合并)
  private gameStore = useGameStore()
  
  // 监听器停止函数
  private unwatchPieces: WatchStopHandle | null = null

  constructor(private puzzleData: PuzzleData | null) {
    this.initializePiecesWatcher()
  }

  private oldPieces: PieceStatus[] = []
  // 初始化pieces监听器
  private initializePiecesWatcher() {
    // 监听gameStore中pieces的变化
    this.unwatchPieces = watch(
      () => this.gameStore.pieces,
      (newPieces) => {
        // 深度比较，只有实际变化时才同步
        if (this.shouldSyncToGameStore(newPieces, this.oldPieces)) {
          this.syncToGameStore()
          this.oldPieces = JSON.parse(JSON.stringify(newPieces)) // 深拷贝
        }
      },
      { 
        deep: true,  // 深度监听
        immediate: false  // 不立即执行
      }
    )
  }

  // 判断是否需要同步到GameStore
  private shouldSyncToGameStore(newPieces: PieceStatus[], oldPieces: PieceStatus[]): boolean {
    if (!this.puzzleData) return false
    if (!newPieces || !oldPieces) return true
    if (newPieces.length !== oldPieces.length) return true
    
    // 检查是否有实质性的变化（位置、放置状态等）
    return newPieces.some((newPiece, index) => {
      const oldPiece = oldPieces[index]
      if (!oldPiece) return true
      
      return (
        newPiece.isPlaced !== oldPiece.isPlaced ||
        newPiece.isCorrect !== oldPiece.isCorrect ||
        newPiece.gridPosition !== oldPiece.gridPosition
      )
    })
  }

  // 销毁监听器
  destroy() {
    if (this.unwatchPieces) {
      this.unwatchPieces()
      this.unwatchPieces = null
    }
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
    return this.gameStore.pieces
  }

  get draggingPieceIndex() {
    return this.gameStore.draggingPieceIndex
  }

  get completionRate() {
    return this.gameStore.puzzleBoardCompletionRate
  }

  // 计算网格样式
  getGridStyle(): StyleValue {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${this.gridCols}, 1fr)`,
      gridTemplateRows: `repeat(${this.gridRows}, 1fr)`,
      gap: '2px',
      width: '400px',
      height: '300px',
      border: '2px solid #ccc',
      borderRadius: '8px',
      padding: '8px',
      backgroundColor: '#f9f9f9',
      position: 'relative' as const
    }
  }

  // 计算拼图块尺寸
  getPieceSize() {
    if (this.gridCols === 0 || this.gridRows === 0) {
      return { width: 100, height: 75 }
    }
    
    const availableWidth = 400 - 16 - (this.gridCols - 1) * 2
    const availableHeight = 300 - 16 - (this.gridRows - 1) * 2
    
    return {
      width: Math.floor(availableWidth / this.gridCols),
      height: Math.floor(availableHeight / this.gridRows)
    }
  }

  // 获取拼图块图像样式
  getPieceImageStyle(piece: PieceStatus): StyleValue {
    if (!this.puzzleData) return {}
    
    const correctRow = Math.floor(piece.originalIndex / this.gridCols)
    const correctCol = piece.originalIndex % this.gridCols
    
    return {
      backgroundImage: `url(${this.puzzleData.imageUrl})`,
      backgroundSize: `${this.gridCols * 100}% ${this.gridRows * 100}%`,
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

  // 获取拼图块基础样式
  getPieceStyle(piece: PieceStatus): StyleValue {
    const pieceSize = this.getPieceSize()
    
    return {
      position: 'absolute' as const,
      left: `${piece.x}px`,
      top: `${piece.y}px`,
      width: `${pieceSize.width}px`,
      height: `${pieceSize.height}px`,
      border: '2px solid #666',
      borderRadius: '4px',
      cursor: 'grab',
      overflow: 'hidden',
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      zIndex: this.draggingPieceIndex === piece.originalIndex ? 1000 : 10,
      transform: this.draggingPieceIndex === piece.originalIndex ? 'scale(1.05)' : 'scale(1)',
      transition: this.draggingPieceIndex === piece.originalIndex ? 'none' : 'transform 0.2s ease'
    }
  }

  // 获取已放置拼图块样式
  getPlacedPieceStyle(piece: PieceStatus): StyleValue {
    const pieceSize = this.getPieceSize()
    const gridIndex = piece.gridPosition || 0
    const row = Math.floor(gridIndex / this.gridCols)
    const col = gridIndex % this.gridCols
    
    // 如果正在拖拽，使用拖拽位置
    if (this.draggingPieceIndex === piece.originalIndex) {
      return {
        position: 'absolute' as const,
        left: `${piece.x}px`,
        top: `${piece.y}px`,
        width: `${pieceSize.width}px`,
        height: `${pieceSize.height}px`,
        border: piece.isCorrect ? '2px solid #27ae60' : '2px solid #e74c3c',
        borderRadius: '4px',
        overflow: 'hidden',
        backgroundColor: 'white',
        zIndex: 1000,
        transform: 'scale(1.05)',
        transition: 'none',
        cursor: 'grabbing'
      }
    }
    
    // 正常放置位置
    return {
      position: 'absolute' as const,
      left: `${8 + col * (pieceSize.width + 2)}px`,
      top: `${8 + row * (pieceSize.height + 2)}px`,
      width: `${pieceSize.width}px`,
      height: `${pieceSize.height}px`,
      border: piece.isCorrect ? '2px solid #27ae60' : '2px solid #e74c3c',
      borderRadius: '4px',
      overflow: 'hidden',
      backgroundColor: 'white',
      zIndex: 5,
      cursor: 'grab'
    }
  }

  // 初始化拼图块
  initializePieces() {
    if (!this.puzzleData) return
    
    const total = this.totalPieces
    const piecesAreaWidth = 320
    const piecesAreaHeight = 420
    const pieceSize = this.getPieceSize()
    
    if (total === 0 || this.gridCols === 0 || this.gridRows === 0) {
      console.warn('拼图参数异常，跳过初始化:', { total, gridCols: this.gridCols, gridRows: this.gridRows })
      return
    }
    
    // 初始化拼图块数据
    this.gameStore.initializePuzzleBoardPieces(total)
    
    // 散落拼图块
    this.scatterPieces(
      this.gameStore.unplacedPieces,
      piecesAreaWidth,
      piecesAreaHeight,
      pieceSize.width,
      pieceSize.height
    )
  }

  // 散落算法
  private scatterPieces(
    piecesToScatter: PieceStatus[], 
    areaWidth: number, 
    areaHeight: number, 
    pieceWidth: number, 
    pieceHeight: number
  ) {
    const margin = 10
    const effectiveWidth = areaWidth - 2 * margin
    const effectiveHeight = areaHeight - 2 * margin
    
    const maxCols = Math.max(1, Math.floor(effectiveWidth / (pieceWidth + 5)))
    const maxRows = Math.max(1, Math.floor(effectiveHeight / (pieceHeight + 5)))
    const maxPositions = maxCols * maxRows
    
    if (piecesToScatter.length > maxPositions) {
      this.scatterCompactMode(piecesToScatter, areaWidth, areaHeight, pieceWidth, pieceHeight)
      return
    }
    
    // 生成所有可能的位置
    const availablePositions: { x: number, y: number }[] = []
    for (let row = 0; row < maxRows; row++) {
      for (let col = 0; col < maxCols; col++) {
        const x = margin + col * (pieceWidth + 5)
        const y = margin + row * (pieceHeight + 5)
        
        if (x + pieceWidth <= areaWidth - margin && y + pieceHeight <= areaHeight - margin) {
          availablePositions.push({ x, y })
        }
      }
    }
    
    // 随机打乱位置
    for (let i = availablePositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]]
    }
    
    // 分配位置
    piecesToScatter.forEach((piece, index) => {
      if (index < availablePositions.length) {
        const pos = availablePositions[index]
        this.gameStore.updatePuzzleBoardPiecePosition(piece.originalIndex, pos.x, pos.y)
      }
    })
  }

  // 紧凑模式散落
  private scatterCompactMode(
    piecesToScatter: PieceStatus[], 
    areaWidth: number, 
    areaHeight: number, 
    pieceWidth: number, 
    pieceHeight: number
  ) {
    const margin = 5
    const effectiveWidth = areaWidth - 2 * margin - pieceWidth
    const effectiveHeight = areaHeight - 2 * margin - pieceHeight
    
    piecesToScatter.forEach(piece => {
      let attempts = 0
      let validPosition = false
      
      while (!validPosition && attempts < 50) {
        const x = margin + Math.random() * effectiveWidth
        const y = margin + Math.random() * effectiveHeight
        
        // 检查是否与其他拼图块重叠
        const hasOverlap = piecesToScatter.some(otherPiece => {
          if (otherPiece === piece || !otherPiece.x) return false
          
          const dx = Math.abs(x - otherPiece.x)
          const dy = Math.abs(y - otherPiece.y)
          
          return dx < pieceWidth && dy < pieceHeight
        })
        
        if (!hasOverlap) {
          this.gameStore.updatePuzzleBoardPiecePosition(piece.originalIndex, x, y)
          validPosition = true
        }
        
        attempts++
      }
      
      if (!validPosition) {
        const x = margin + (Math.random() * effectiveWidth)
        const y = margin + (Math.random() * effectiveHeight)
        this.gameStore.updatePuzzleBoardPiecePosition(piece.originalIndex, x, y)
      }
    })
  }

  // 打乱拼图块
  shufflePieces() {
    if (!this.puzzleData) return
    
    const piecesAreaWidth = 320
    const piecesAreaHeight = 420
    const pieceSize = this.getPieceSize()
    
    const unplacedPieces = this.gameStore.unplacedPieces
    if (unplacedPieces.length === 0) return
    
    this.scatterPieces(unplacedPieces, piecesAreaWidth, piecesAreaHeight, pieceSize.width, pieceSize.height)
  }

  // 重置拼图
  resetPuzzle() {
    this.gameStore.resetAllPuzzleBoardPieceStates()
    this.initializePieces()
  }

  // 自动完成
  autoSolve() {
    if (!this.puzzleData) return
    
    this.pieces.forEach((piece, index) => {
      const correctPos = getGridPos(index, this.getPieceSize(), this.gridCols)
      this.gameStore.updatePuzzleBoardPiecePosition(index, correctPos.x, correctPos.y)
      this.gameStore.setPuzzleBoardPiecePlaced(index, true, piece.originalIndex, true)
      console.log(`Piece ${index} snapped to grid position:`, correctPos)
    })
  }

  // 检查插槽是否被占用
  isSlotOccupied(slotIndex: number): boolean {
    return this.gameStore.isPuzzleBoardSlotOccupied(slotIndex)
  }

  // 拖拽开始
  startDrag(index: number, clientX: number, clientY: number) {
    const piece = this.gameStore.getPuzzleBoardPiece(index)
    if (!piece) return
    
    // 计算偏移量
    if (piece.isPlaced) {
      const pieceSize = this.getPieceSize()
      const gridIndex = piece.gridPosition || 0
      const row = Math.floor(gridIndex / this.gridCols)
      const col = gridIndex % this.gridCols
      const pieceXInGrid = col * (pieceSize.width + 2) + 8
      const pieceYInGrid = row * (pieceSize.height + 2) + 8
      
      this.gameStore.updatePuzzleBoardPiecePosition(index, pieceXInGrid, pieceYInGrid)
    }
    
    const dragOffset = {
      x: clientX - piece.x,
      y: clientY - piece.y
    }
    
    this.gameStore.setDragOffset(dragOffset)
    this.gameStore.setDraggingPiece(index)
  }

  // 拖拽过程中
  handleDrag(clientX: number, clientY: number) {
    if (this.draggingPieceIndex === -1) return
    
    const piece = this.gameStore.getPuzzleBoardPiece(this.draggingPieceIndex)
    if (!piece) return
    
    const newX = clientX - this.gameStore.dragOffset.x
    const newY = clientY - this.gameStore.dragOffset.y
    
    this.gameStore.updatePuzzleBoardPiecePosition(this.draggingPieceIndex, newX, newY)
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
    const relativeX = clientX - gridRect.left
    const relativeY = clientY - gridRect.top
    
    const gridCol = Math.floor((relativeX - 8) / (pieceSize.width + 2))
    const gridRow = Math.floor((relativeY - 8) / (pieceSize.height + 2))
    const gridIndex = gridRow * this.gridCols + gridCol
    
    if (gridIndex >= 0 && gridIndex < this.totalPieces && !this.isSlotOccupied(gridIndex)) {
      this.snapToGrid(gridIndex)
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

    const { x: newX, y: newY } = getGridPos(gridIndex, this.getPieceSize(), this.gridCols)
    const isCorrect = piece.originalIndex === gridIndex
    
    this.gameStore.updatePuzzleBoardPiecePosition(this.draggingPieceIndex, newX, newY)
    this.gameStore.setPuzzleBoardPiecePlaced(this.draggingPieceIndex, true, gridIndex, isCorrect)
    
    // 通知GameStore增加步数
    this.gameStore.incrementMoveCount()
    
    // 检查游戏完成
    this.checkGameCompletion()
    
    console.log(isCorrect ? '正确放置！' : '位置不正确')
  }

  // 重置已放置拼图块位置
  private resetPlacedPiecePosition() {
    const piece = this.gameStore.getPuzzleBoardPiece(this.draggingPieceIndex)
    if (!piece || !piece.isPlaced) return
    
    const pieceSize = this.getPieceSize()
    const originalGridIndex = piece.gridPosition || 0
    const row = Math.floor(originalGridIndex / this.gridCols)
    const col = originalGridIndex % this.gridCols
    
    const originalX = 8 + col * (pieceSize.width + 2)
    const originalY = 8 + row * (pieceSize.height + 2)
    
    this.gameStore.updatePuzzleBoardPiecePosition(this.draggingPieceIndex, originalX, originalY)
  }

  // 约束到拼图块区域
  private constrainToPiecesArea() {
    const piece = this.gameStore.getPuzzleBoardPiece(this.draggingPieceIndex)
    if (!piece || piece.isPlaced) return
    
    const piecesAreaWidth = 320
    const piecesAreaHeight = 420
    const pieceSize = this.getPieceSize()
    
    const minX = 5
    const minY = 5
    const maxX = piecesAreaWidth - pieceSize.width - 5
    const maxY = piecesAreaHeight - pieceSize.height - 5
    
    if (piece.x < minX || piece.x > maxX || 
        piece.y < minY || piece.y > maxY) {
      
      // 找到合适的位置
      let attempts = 0
      let validPosition = false
      
      while (!validPosition && attempts < 20) {
        const x = minX + Math.random() * (maxX - minX)
        const y = minY + Math.random() * (maxY - minY)
        
        const hasOverlap = this.gameStore.unplacedPieces.some(otherPiece => {
          if (otherPiece === piece) return false
          const dx = Math.abs(x - otherPiece.x)
          const dy = Math.abs(y - otherPiece.y)
          return dx < pieceSize.width && dy < pieceSize.height
        })
        
        if (!hasOverlap) {
          this.gameStore.updatePuzzleBoardPiecePosition(this.draggingPieceIndex, x, y)
          validPosition = true
        }
        
        attempts++
      }
      
      if (!validPosition) {
        const constrainedX = Math.max(minX, Math.min(piece.x, maxX))
        const constrainedY = Math.max(minY, Math.min(piece.y, maxY))
        this.gameStore.updatePuzzleBoardPiecePosition(this.draggingPieceIndex, constrainedX, constrainedY)
      }
    }
  }

  // 检查游戏完成
  private checkGameCompletion() {
    if (this.gameStore.isPuzzleBoardGameCompleted()) {
      console.log('🎉 游戏完成！所有拼图块都在正确位置')
      this.gameStore.isCompleted = true
      this.gameStore.completeGameState(new Date())
    }
  }

  // 同步到GameStore
  private syncToGameStore() {
    if (!this.puzzleData) return
    
    this.pieces.forEach((piece, index) => {
      const pieceId = `piece_${Math.floor(index / this.gridCols)}_${index % this.gridCols}`
      
      // 更新位置信息
      const storePiece = this.gameStore.pieces.find(p => p.id === pieceId)
      if (storePiece) {
        storePiece.x = piece.x
        storePiece.y = piece.y
        storePiece.isPlaced = piece.isPlaced
      }
      
      // 更新放置状态
      this.gameStore.updatePiecePlacement(pieceId, piece.isPlaced)
    })
  }

  // 从GameStore同步状态
  syncFromGameStore() {
    if (!this.puzzleData || !this.gameStore.pieces.length) return
    
    // 临时停用监听器，避免在恢复过程中触发同步
    const wasWatching = this.unwatchPieces !== null
    if (wasWatching && this.unwatchPieces) {
      this.unwatchPieces()
      this.unwatchPieces = null
    }
    
    const total = this.totalPieces
    
    // 根据GameStore数据重建pieces
    const restoredPieces = Array.from({ length: total }, (_, i) => {
      const storePiece = this.gameStore.pieces.find(p => p.id === `piece_${Math.floor(i / this.gridCols)}_${i % this.gridCols}`)
      
      if (storePiece && storePiece.isPlaced) {
        const pieceSize = this.getPieceSize()
        const actualX = storePiece.x || 0
        const actualY = storePiece.y || 0
        
        const gridCol = Math.floor((actualX - 8) / (pieceSize.width + 2))
        const gridRow = Math.floor((actualY - 8) / (pieceSize.height + 2))
        const actualGridIndex = gridRow * this.gridCols + gridCol
        const isCorrect = i === actualGridIndex
        
        return {
          originalIndex: i,
          x: actualX,
          y: actualY,
          isPlaced: true,
          isCorrect: isCorrect,
          gridPosition: actualGridIndex
        }
      } else {
        return {
          originalIndex: i,
          x: storePiece?.x || 0,
          y: storePiece?.y || 0,
          isPlaced: false,
          isCorrect: undefined,
          gridPosition: undefined
        }
      }
    })
    
    this.gameStore.restorePuzzleBoardPiecesFromData(restoredPieces)
    
    // 重新散落未放置的拼图块
    const unplacedPieces = this.gameStore.unplacedPieces
    if (unplacedPieces.some(p => p.x === 0 || p.y === 0)) {
      const pieceSize = this.getPieceSize()
      this.scatterPieces(unplacedPieces, 320, 420, pieceSize.width, pieceSize.height)
    }
    
    // 重新启用监听器
    if (wasWatching) {
      this.initializePiecesWatcher()
    }
  }

  // 保存状态到localStorage
  saveToLocalStorage() {
    if (!this.puzzleData) return
    
    const stateData = {
      puzzleId: this.puzzleData.id,
      pieces: this.gameStore.getPuzzleBoardPiecesSnapshot(),
      timestamp: Date.now()
    }
    
    localStorage.setItem(`puzzle_exact_state_${this.puzzleData.id}`, JSON.stringify(stateData))
  }

  // 从localStorage恢复状态
  restoreFromLocalStorage(): boolean {
    if (!this.puzzleData) return false
    
    const savedState = localStorage.getItem(`puzzle_exact_state_${this.puzzleData.id}`)
    if (!savedState) return false
    
    try {
      const stateData = JSON.parse(savedState)
      if (stateData.puzzleId !== this.puzzleData.id) return false
      
      // 临时停用监听器，避免在恢复过程中触发同步
      const wasWatching = this.unwatchPieces !== null
      if (wasWatching && this.unwatchPieces) {
        this.unwatchPieces()
        this.unwatchPieces = null
      }
      
      this.gameStore.restorePuzzleBoardPiecesFromData(stateData.pieces)
      console.log('成功从localStorage恢复拼图块状态')
      
      // 重新启用监听器
      if (wasWatching) {
        this.initializePiecesWatcher()
      }
      
      return true
    } catch (error) {
      console.error('从localStorage恢复状态失败:', error)
      return false
    }
  }
}
