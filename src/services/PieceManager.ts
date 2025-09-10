/**
 * 拼图块管理类
 * 负责处理拼图块的所有操作和状态管理
 */

import { ref } from 'vue'
import type { PieceStatus, PuzzleData } from '../types'
import { getGridPos } from '@/utils/gridUtils'
import { generateRandomPosition } from '@/utils/positionUtils'
import { useSettingsStore } from '../stores/settings'

export class PieceManager {
  private pieces = ref<PieceStatus[]>([])
  private draggingPieceIndex = ref(-1)
  private dragOffset = ref({ x: 0, y: 0 })

  constructor(private puzzleData: PuzzleData | null = null) {}

  /**
   * 设置拼图数据
   */
  setPuzzleData(puzzleData: PuzzleData | null): void {
    this.puzzleData = puzzleData
  }

  /**
   * 初始化拼图块
   */
  initializePieces(totalPieces: number): void {
    const settingsStore = useSettingsStore()
    const isRotationEnabled = settingsStore.settings.game.enableRotation
    
    this.pieces.value = Array.from({ length: totalPieces }, (_, i) => {
      // 基础拼图块数据
      const piece: PieceStatus = {
        id: `piece_${i}`,
        x: 0,
        y: 0,
        rotation: 0,
        flipped: false,
        originalIndex: i,
        currentX: 0,
        currentY: 0,
        isPlaced: false
      }
      
      // 如果启用了旋转功能，添加随机旋转和翻转
      if (isRotationEnabled) {
        // 随机旋转：0°, 90°, 180°, 270°
        const rotations = [0, 90, 180, 270]
        piece.rotation = rotations[Math.floor(Math.random() * rotations.length)]
        
        // 随机翻转：50%概率翻转
        piece.flipped = Math.random() < 0.5
        
        console.log(`拼图块 ${i} 初始化: 旋转${piece.rotation}°, 翻转${piece.flipped}`)
      }
      
      return piece
    })
  }

  /**
   * 更新拼图块位置
   */
  updatePiecePosition(pieceId: string | number, x: number, y: number): void {
    const piece = typeof pieceId === "string"
      ? this.pieces.value.find(p => p.id === pieceId)
      : this.pieces.value.find(p => p.originalIndex === pieceId)

    if (piece) {
      piece.x = x
      piece.y = y
    }
  }

  /**
   * 更新拼图块旋转
   */
  updatePieceRotation(pieceId: string, rotation: number): void {
    const piece = this.pieces.value.find(p => p.id === pieceId)
    if (piece) {
      piece.rotation = rotation
    }
  }

  /**
   * 更新拼图块翻转状态
   */
  updatePieceFlip(pieceId: string, flipped: boolean): void {
    const piece = this.pieces.value.find(p => p.id === pieceId)
    if (piece) {
      piece.flipped = flipped
    }
  }

  /**
   * 更新拼图块放置状态
   */
  updatePiecePlacement(pieceId: string, isPlaced: boolean, isCorrect?: boolean): void {
    const piece = this.pieces.value.find(p => p.id === pieceId)
    if (piece) {
      piece.isPlaced = isPlaced
      if (isCorrect !== undefined) {
        piece.isCorrect = isCorrect
      }
    }
  }

  /**
   * 设置拼图块放置状态
   */
  setPiecePlaced(index: number, isPlaced: boolean, gridPosition?: number, isCorrect?: boolean): void {
    const piece = this.pieces.value[index]
    if (piece) {
      piece.isPlaced = isPlaced
      piece.gridPosition = gridPosition
      
      // 如果isCorrect未提供，根据originalIndex和gridPosition计算
      if (isCorrect !== undefined) {
        piece.isCorrect = isCorrect
      } else if (gridPosition !== undefined) {
        piece.isCorrect = piece.originalIndex === gridPosition
      } else {
        piece.isCorrect = undefined
      }
    }
  }

  /**
   * 获取拼图块
   */
  getPiece(index: number): PieceStatus | undefined {
    return this.pieces.value[index]
  }

  /**
   * 检查格子是否被占用
   */
  isSlotOccupied(slotIndex: number): boolean {
    return this.pieces.value.some(piece => piece.isPlaced && piece.gridPosition === slotIndex)
  }

  /**
   * 获取占用指定格子的拼图块索引
   */
  getPieceAtSlot(slotIndex: number): number {
    return this.pieces.value.findIndex(piece => piece.isPlaced && piece.gridPosition === slotIndex)
  }

  /**
   * 对换两个拼图块的位置
   */
  swapPieces(pieceIndex1: number, pieceIndex2: number): void {
    const piece1 = this.pieces.value[pieceIndex1]
    const piece2 = this.pieces.value[pieceIndex2]
    
    if (!piece1 || !piece2 || !this.puzzleData) return
    
    // 交换位置信息
    const tempGridPosition = piece1.gridPosition
    
    // 更新第一个拼图块
    piece1.gridPosition = piece2.gridPosition
    piece1.isCorrect = piece1.originalIndex === piece1.gridPosition
    
    // 更新第二个拼图块
    piece2.gridPosition = tempGridPosition
    piece2.isCorrect = piece2.originalIndex === piece2.gridPosition
    
    // 更新坐标位置
    if (piece1.isPlaced && piece2.isPlaced) {
      const pieceSize = {
        width: this.puzzleData.gridConfig.pieceWidth,
        height: this.puzzleData.gridConfig.pieceHeight
      }
      const gridCols = this.puzzleData.gridConfig.cols
      
      // 计算新的坐标位置
      const pos1 = getGridPos(piece1.gridPosition!, pieceSize, gridCols)
      const pos2 = getGridPos(piece2.gridPosition!, pieceSize, gridCols)
      
      piece1.x = pos1.x
      piece1.y = pos1.y
      piece2.x = pos2.x
      piece2.y = pos2.y
    }
  }

  /**
   * 重新计算所有拼图块的正确性状态
   */
  recalculateCorrectness(): void {
    this.pieces.value.forEach(piece => {
      if (piece.isPlaced && piece.gridPosition !== undefined) {
        piece.isCorrect = piece.originalIndex === piece.gridPosition
      }
    })
  }

  /**
   * 重置所有拼图块状态
   */
  resetAllStates(): void {
    const settingsStore = useSettingsStore()
    const isRotationEnabled = settingsStore.settings.game.enableRotation
    
    this.pieces.value.forEach(piece => {
      piece.isPlaced = false
      piece.isCorrect = undefined
      piece.gridPosition = undefined
      
      // 如果启用了旋转功能，重新随机旋转和翻转
      if (isRotationEnabled) {
        // 随机旋转：0°, 90°, 180°, 270°
        const rotations = [0, 90, 180, 270]
        piece.rotation = rotations[Math.floor(Math.random() * rotations.length)]
        
        // 随机翻转：50%概率翻转
        piece.flipped = Math.random() < 0.5
        
        console.log(`拼图块 ${piece.originalIndex} 重置: 旋转${piece.rotation}°, 翻转${piece.flipped}`)
      } else {
        // 如果未启用旋转功能，重置为默认状态
        piece.rotation = 0
        piece.flipped = false
      }
    })
  }

  /**
   * 清空拼图块
   */
  clearPieces(): void {
    this.pieces.value = []
    this.draggingPieceIndex.value = -1
    this.dragOffset.value = { x: 0, y: 0 }
  }

  /**
   * 设置拖拽拼图块
   */
  setDraggingPiece(index: number): void {
    this.draggingPieceIndex.value = index
  }

  /**
   * 清除拖拽状态
   */
  clearDragging(): void {
    this.draggingPieceIndex.value = -1
  }

  /**
   * 设置拖拽偏移
   */
  setDragOffset(offset: { x: number, y: number }): void {
    this.dragOffset.value = offset
  }

  /**
   * 从数据恢复拼图块
   */
  restoreFromData(piecesData: PieceStatus[]): void {
    this.pieces.value = piecesData.map(piece => ({ ...piece }))
  }

  /**
   * 获取拼图块快照
   */
  getSnapshot(): PieceStatus[] {
    return this.pieces.value.map(piece => ({ ...piece }))
  }

  /**
   * 生成初始拼图块位置
   */
  generateInitialPositions(): void {
    if (!this.puzzleData) return

    const pieceSize = {
      width: this.puzzleData.gridConfig.pieceWidth,
      height: this.puzzleData.gridConfig.pieceHeight
    }
    
    // 使用与shufflePieces相同的区域大小
    const piecesAreaWidth = 320
    const piecesAreaHeight = 420

    const settingsStore = useSettingsStore()
    const isRotationEnabled = settingsStore.settings.game.enableRotation
    
    this.pieces.value.forEach((piece, index) => {
      const randomPos = generateRandomPosition(piecesAreaWidth, piecesAreaHeight, pieceSize.width, pieceSize.height, 10)
      piece.x = randomPos.x
      piece.y = randomPos.y
      piece.originalIndex = index
      
      // 如果启用了旋转功能，同时随机设置旋转和翻转
      if (isRotationEnabled) {
        // 随机旋转：0°, 90°, 180°, 270°
        const rotations = [0, 90, 180, 270]
        piece.rotation = rotations[Math.floor(Math.random() * rotations.length)]
        
        // 随机翻转：50%概率翻转
        piece.flipped = Math.random() < 0.5
        
        console.log(`拼图块 ${index} 打乱: 旋转${piece.rotation}°, 翻转${piece.flipped}`)
      }
    })
  }

  /**
   * 打乱拼图块位置
   */
  shufflePositions(): void {
    const positions = this.pieces.value.map(piece => ({ x: piece.x, y: piece.y }))
    
    // Fisher-Yates 洗牌算法
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[positions[i], positions[j]] = [positions[j], positions[i]]
    }
    
    // 应用打乱后的位置
    this.pieces.value.forEach((piece, index) => {
      piece.x = positions[index].x
      piece.y = positions[index].y
    })
  }

  // Getter 方法
  get piecesValue() {
    return this.pieces.value
  }

  get draggingPieceIndexValue() {
    return this.draggingPieceIndex.value
  }

  get dragOffsetValue() {
    return this.dragOffset.value
  }

  get totalPieces() {
    return this.pieces.value.length
  }

  get placedPieces() {
    return this.pieces.value.filter(piece => piece.isPlaced).length
  }

  get correctlyPlacedPieces() {
    return this.pieces.value.filter(piece => piece.isPlaced && piece.isCorrect).length
  }
}
