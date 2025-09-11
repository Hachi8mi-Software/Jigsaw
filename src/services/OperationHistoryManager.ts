import type { PieceStatus } from '../types'

/**
 * 操作记录接口
 */
export interface Operation {
  id: string
  type: 'swap' | 'place' | 'move'
  timestamp: Date
  beforeState: PieceStatus[]
  afterState: PieceStatus[]
  description: string
}

/**
 * 操作历史管理器
 * 负责管理撤销栈和重做栈，跟踪所有导致步数增加的操作
 */
export class OperationHistoryManager {
  private undoStack: Operation[] = []
  private redoStack: Operation[] = []
  private maxHistorySize: number = 50 // 最大历史记录数量

  /**
   * 添加新操作到历史记录
   * @param operation 操作记录
   */
  addOperation(operation: Operation): void {
    // 添加新操作时清空重做栈
    this.redoStack = []
    
    // 将操作添加到撤销栈
    this.undoStack.push(operation)
    
    // 限制历史记录大小
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift()
    }
  }

  /**
   * 撤销最近的操作
   * @returns 撤销的操作记录，如果没有可撤销的操作则返回null
   */
  undo(): Operation | null {
    if (this.undoStack.length === 0) {
      return null
    }

    const operation = this.undoStack.pop()!
    this.redoStack.push(operation)
    
    return operation
  }

  /**
   * 重做最近撤销的操作
   * @returns 重做的操作记录，如果没有可重做的操作则返回null
   */
  redo(): Operation | null {
    if (this.redoStack.length === 0) {
      return null
    }

    const operation = this.redoStack.pop()!
    this.undoStack.push(operation)
    
    return operation
  }

  /**
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  /**
   * 检查是否可以重做
   */
  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  /**
   * 获取撤销栈大小
   */
  getUndoStackSize(): number {
    return this.undoStack.length
  }

  /**
   * 获取重做栈大小
   */
  getRedoStackSize(): number {
    return this.redoStack.length
  }

  /**
   * 清空所有历史记录
   */
  clear(): void {
    this.undoStack = []
    this.redoStack = []
  }

  /**
   * 生成操作ID
   */
  generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 创建操作记录
   * @param type 操作类型
   * @param beforeState 操作前状态
   * @param afterState 操作后状态
   * @param description 操作描述
   */
  createOperation(
    type: Operation['type'],
    beforeState: PieceStatus[],
    afterState: PieceStatus[],
    description: string
  ): Operation {
    const operation = {
      id: this.generateOperationId(),
      type,
      timestamp: new Date(),
      beforeState: this.deepClonePieceStatus(beforeState),
      afterState: this.deepClonePieceStatus(afterState),
      description
    }
    
    // 添加调试信息
    console.log('📝 创建操作记录:', {
      type: operation.type,
      description: operation.description,
      beforeStatePieces: beforeState.length,
      afterStatePieces: afterState.length,
      unplacedPiecesBefore: beforeState.filter(p => !p.isPlaced).length,
      unplacedPiecesAfter: afterState.filter(p => !p.isPlaced).length
    })
    
    return operation
  }

  /**
   * 深度克隆拼图块状态数组
   * @param pieces 拼图块状态数组
   */
  private deepClonePieceStatus(pieces: PieceStatus[]): PieceStatus[] {
    return pieces.map(piece => ({
      ...piece,
      // 完整复制所有位置相关属性
      x: piece.x,
      y: piece.y,
      rotation: piece.rotation,
      flipped: piece.flipped,
      isPlaced: piece.isPlaced,
      isCorrect: piece.isCorrect,
      gridPosition: piece.gridPosition,
      originalIndex: piece.originalIndex,
      id: piece.id
    }))
  }

  /**
   * 获取最近的操作记录（用于调试）
   */
  getLastOperation(): Operation | null {
    return this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null
  }

  /**
   * 获取操作历史统计信息
   */
  getHistoryStats(): {
    undoCount: number
    redoCount: number
    totalOperations: number
  } {
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      totalOperations: this.undoStack.length + this.redoStack.length
    }
  }
}