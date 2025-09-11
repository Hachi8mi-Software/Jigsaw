/**
 * 重构后的游戏状态管理Store
 * 使用服务类来管理不同的功能模块，保持代码简洁
 */

import { defineStore } from 'pinia'
import { computed, reactive } from 'vue'
import type { PuzzleData, PiecePosition, PieceStatus } from '../types'
import { GameTimer } from '../services/GameTimer'
import { PieceManager } from '../services/PieceManager'
import { GameStateManager } from '../services/GameStateManager'
import { GameCompletionChecker } from '../services/GameCompletionChecker'
import { GamePersistence } from '../services/GamePersistence'
import { OperationHistoryManager, type Operation } from '../services/OperationHistoryManager'
import { calculatePuzzleDifficulty } from '../utils/difficultyUtils'

export const useGameStore = defineStore('game', () => {
  // 服务类实例
  const gameTimer = new GameTimer()
  const pieceManager = new PieceManager()
  const gameStateManager = new GameStateManager()
  const gameCompletionChecker = new GameCompletionChecker()
  const gamePersistence = new GamePersistence()
  const operationHistory = reactive(new OperationHistoryManager())

  // 计算属性
  const totalPieces = computed(() => pieceManager.totalPieces)
  const elapsedTime = computed(() => gameTimer.elapsedTime)
  const completionPercentage = computed(() => gameCompletionChecker.getCompletionPercentage())
  const currentDifficulty = computed(() => {
    const puzzle = gameStateManager.currentPuzzleValue
    if (puzzle) {
      return calculatePuzzleDifficulty(puzzle)
    }
    return 1
  })
  const unplacedPieces = computed(() => gameCompletionChecker.getUnplacedPieces())
  const placedPieces = computed(() => gameCompletionChecker.getPlacedPieces())
  const correctlyPlacedPieces = computed(() => gameCompletionChecker.getCorrectlyPlacedPieces())
  const puzzleBoardCompletionRate = computed(() => gameCompletionChecker.getPuzzleBoardCompletionRate())

  // 转换函数
  const convertPiecePositionsToStatus = (piecePositions: PiecePosition[]): PieceStatus[] => {
    return piecePositions.map((piece, index) => ({
      id: piece.id,
      x: piece.x,
      y: piece.y,
      rotation: piece.rotation,
      originalIndex: index,
      isPlaced: piece.isPlaced,
      isCorrect: undefined,
      gridPosition: undefined
    }))
  }

  const convertStatusToPiecePositions = (pieceStatuses: PieceStatus[]): PiecePosition[] => {
    return pieceStatuses.map(piece => ({
      id: piece.id || `piece_${piece.originalIndex}`,
      x: piece.x,
      y: piece.y,
      rotation: piece.rotation || 0,
      isPlaced: piece.isPlaced
    }))
  }

  // 游戏状态管理方法
  const initializeNewGame = (data: {
    puzzleData: PuzzleData
    pieces: PieceStatus[]
    startTime: Date
    sessionId: string
  }) => {
    gameStateManager.initializeNewGame(data)
    pieceManager.setPuzzleData(data.puzzleData)
    pieceManager.restoreFromData(data.pieces)
    gameCompletionChecker.updatePieces(pieceManager.piecesValue)
    gameTimer.startTimer(data.puzzleData.id)
  }

  const restoreGameState = (data: {
    puzzleData: PuzzleData
    pieces: PieceStatus[]
    startTime: Date
    endTime?: Date
    moveCount: number
    sessionId: string
    totalPauseTime?: number
    pauseStartTime?: Date | null
    isPaused?: boolean
  }) => {
    gameStateManager.restoreGameState({
      puzzleData: data.puzzleData,
      pieces: data.pieces,
      startTime: data.startTime,
      endTime: data.endTime,
      moveCount: data.moveCount,
      sessionId: data.sessionId,
      isPaused: data.isPaused
    })
    pieceManager.setPuzzleData(data.puzzleData)
    pieceManager.restoreFromData(data.pieces)
    gameCompletionChecker.updatePieces(pieceManager.piecesValue)
    
    // 恢复计时器状态
    gameTimer.restoreTimerState(
      data.startTime,
      data.endTime,
      data.totalPauseTime || 0,
      data.pauseStartTime,
      data.isPaused || false,
      data.puzzleData.id
    )
  }

  const pauseGameState = (autoPause: boolean = false) => {
    console.log('🔄 pauseGameState 被调用:', { autoPause })
    gameStateManager.pauseGame(autoPause)
    gameTimer.pauseTimer()
    console.log('✅ 游戏状态已暂停，计时器已暂停')
  }

  const resumeGameState = () => {
    gameStateManager.resumeGame()
    gameTimer.resumeTimer()
  }

  const completeGameState = (completionTime: Date, isAutoCompleted: boolean = false) => {
    gameStateManager.completeGame(completionTime, isAutoCompleted)
    gameTimer.setEndTime(completionTime)
  }

  const resetGameState = () => {
    gameStateManager.resetGameState()
    pieceManager.clearPieces()
    gameTimer.cleanup()
    gameCompletionChecker.updatePieces([])
  }

  const stopCurrentPuzzle = () => {
    // 停止当前拼图的计时（退出拼图时调用）
    gameTimer.stopCurrentPuzzle()
  }

  const setAutoCompleted = (isAutoCompleted: boolean) => {
    gameStateManager.setAutoCompleted(isAutoCompleted)
  }

  // 拼图块管理方法
  const updatePiecePosition = (pieceId: string | number, x: number, y: number) => {
    pieceManager.updatePiecePosition(pieceId, x, y)
  }

  const updatePieceRotation = (pieceId: string, rotation: number) => {
    pieceManager.updatePieceRotation(pieceId, rotation)
  }

  const updatePieceFlip = (pieceId: string, flipped: boolean) => {
    pieceManager.updatePieceFlip(pieceId, flipped)
  }

  const updatePiecePlacement = (pieceId: string, isPlaced: boolean, isCorrect?: boolean) => {
    pieceManager.updatePiecePlacement(pieceId, isPlaced, isCorrect)
    gameCompletionChecker.updatePieces(pieceManager.piecesValue)
  }

  const initializePuzzleBoardPieces = (totalPieces: number) => {
    pieceManager.initializePieces(totalPieces)
    gameCompletionChecker.updatePieces(pieceManager.piecesValue)
  }

  const updatePuzzleBoardPiecePosition = (index: number, x: number, y: number) => {
    pieceManager.updatePiecePosition(index, x, y)
  }

  const setPuzzleBoardPiecePlaced = (index: number, isPlaced: boolean, gridPosition?: number, isCorrect?: boolean) => {
    pieceManager.setPiecePlaced(index, isPlaced, gridPosition, isCorrect)
    gameCompletionChecker.updatePieces(pieceManager.piecesValue)
  }

  const getPuzzleBoardPiece = (index: number): PieceStatus | undefined => {
    return pieceManager.getPiece(index)
  }

  const isPuzzleBoardSlotOccupied = (slotIndex: number): boolean => {
    return pieceManager.isSlotOccupied(slotIndex)
  }

  const getPieceAtSlot = (slotIndex: number): number => {
    return pieceManager.getPieceAtSlot(slotIndex)
  }

  const swapPuzzleBoardPieces = (pieceIndex1: number, pieceIndex2: number): void => {
    // 记录操作前状态
    const beforeState = pieceManager.getSnapshot()
    
    pieceManager.swapPieces(pieceIndex1, pieceIndex2)
    gameCompletionChecker.updatePieces(pieceManager.piecesValue)
    
    // 记录操作后状态并添加到历史记录
    const afterState = pieceManager.getSnapshot()
    const operation = operationHistory.createOperation(
      'swap',
      beforeState,
      afterState,
      `交换拼图块 ${pieceIndex1} 和 ${pieceIndex2}`
    )
    operationHistory.addOperation(operation)
  }

  const resetAllPuzzleBoardPieceStates = () => {
    pieceManager.resetAllStates()
    gameCompletionChecker.updatePieces(pieceManager.piecesValue)
  }

  const recalculateAllCorrectness = () => {
    pieceManager.recalculateCorrectness()
    gameCompletionChecker.updatePieces(pieceManager.piecesValue)
  }

  const clearPuzzleBoardPieces = () => {
    pieceManager.clearPieces()
    gameCompletionChecker.updatePieces([])
  }

  const setDraggingPiece = (index: number) => {
    pieceManager.setDraggingPiece(index)
  }

  const clearDragging = () => {
    pieceManager.clearDragging()
  }

  const setDragOffset = (offset: { x: number, y: number }) => {
    pieceManager.setDragOffset(offset)
  }

  const restorePuzzleBoardPiecesFromData = (piecesData: PieceStatus[]) => {
    pieceManager.restoreFromData(piecesData)
    gameCompletionChecker.updatePieces(pieceManager.piecesValue)
  }

  const getPuzzleBoardPiecesSnapshot = (): PieceStatus[] => {
    return pieceManager.getSnapshot()
  }

  // 游戏完成检查方法
  const isPuzzleBoardGameCompleted = (): boolean => {
    return gameCompletionChecker.isPuzzleBoardGameCompleted()
  }

  const checkGameCompletion = () => {
    const isCompleted = gameCompletionChecker.checkGameCompletion()
    if (isCompleted) {
      const completionTime = new Date()
      const isAutoCompleted = gameStateManager.isAutoCompletedValue
      gameStateManager.completeGame(completionTime, isAutoCompleted)
      gameTimer.setEndTime(completionTime)
      console.log('🎉 游戏完成检测到，停止计时器')
    }
    return isCompleted
  }

  const getCorrectPositionForPiece = (pieceId: string): { row: number, col: number } | null => {
    return gameCompletionChecker.getCorrectPositionForPiece(pieceId)
  }

  const isPieceAtPosition = (
    pieceId: string,
    targetRow: number,
    targetCol: number,
    tolerance: number = 5
  ): boolean => {
    return gameCompletionChecker.isPieceAtPosition(pieceId, targetRow, targetCol, tolerance)
  }

  const snapPieceToGrid = (
    pieceId: string,
    targetRow: number,
    targetCol: number,
    pieceWidth: number,
    pieceHeight: number
  ): { x: number, y: number } | null => {
    return gameCompletionChecker.snapPieceToGrid(pieceId, targetRow, targetCol, pieceWidth, pieceHeight)
  }

  // 持久化管理方法
  const generateSessionId = (): string => {
    return gamePersistence.generateSessionId()
  }

  const saveGameState = (puzzleData: PuzzleData) => {
    const gameState = {
      pieces: pieceManager.piecesValue,
      startTime: gameTimer.startTimeValue,
      endTime: gameTimer.endTimeValue,
      moveCount: gameStateManager.moveCountValue,
      sessionId: gameStateManager.gameSessionIdValue,
      totalPauseTime: gameTimer.totalPauseTimeValue,
      pauseStartTime: gameTimer.pauseStartTimeValue,
      isPaused: gameStateManager.isPausedValue
    }
    gamePersistence.saveGameState(puzzleData, gameState)
  }

  const loadGameState = (puzzleId: string): any | null => {
    return gamePersistence.loadGameState(puzzleId)
  }

  const clearGameState = (puzzleId: string): void => {
    gamePersistence.clearGameState(puzzleId)
  }

  const loadGameSnapshot = (data: {
    puzzleData: PuzzleData
    pieces: PieceStatus[]
    startTime: Date
    endTime?: Date
    moveCount: number
    sessionId: string
  }) => {
    return gamePersistence.loadGameSnapshot(data)
  }

  const resetPauseTime = (): void => {
    gameTimer.resetPauseTime()
  }

  const calculateElapsedTime = (startTime: Date, endTime?: Date): number => {
    return gameTimer.calculateElapsedTime(startTime, endTime)
  }

  const incrementMoveCount = () => {
    gameStateManager.incrementMoveCount()
  }

  // 撤销和重做相关方法
  const undoLastOperation = (): boolean => {
    const operation = operationHistory.undo()
    if (!operation) {
      return false
    }
    
    console.log('🔄 执行撤销操作:', {
      operationType: operation.type,
      description: operation.description,
      timestamp: operation.timestamp
    })
    
    // 恢复到操作前状态
    pieceManager.restoreFromData(operation.beforeState)
    gameCompletionChecker.updatePieces(pieceManager.piecesValue)
    
    // 增加步数（因为撤销了一个操作）
    gameStateManager.incrementMoveCount()
    
    console.log('✅ 撤销操作完成，拼图块位置已还原')
    
    return true
  }

  const redoLastOperation = (): boolean => {
    const operation = operationHistory.redo()
    if (!operation) {
      return false
    }
    
    // 恢复到操作后状态
    pieceManager.restoreFromData(operation.afterState)
    gameCompletionChecker.updatePieces(pieceManager.piecesValue)
    
    // 增加步数（因为重做了一个操作）
    gameStateManager.incrementMoveCount()
    
    return true
  }

  const canUndo = (): boolean => {
    return operationHistory.canUndo()
  }

  const canRedo = (): boolean => {
    return operationHistory.canRedo()
  }

  const clearOperationHistory = (): void => {
    operationHistory.clear()
  }

  // 用于记录操作前状态的临时变量
  let operationBeforeState: PieceStatus[] | null = null

  const startRecordingOperation = (): void => {
    operationBeforeState = pieceManager.getSnapshot()
  }

  const recordPlaceOperation = (pieceIndex: number, gridIndex: number): void => {
    if (!operationBeforeState) {
      console.warn('操作前状态未记录，无法创建操作历史')
      return
    }
    
    const afterState = pieceManager.getSnapshot()
    const operation = operationHistory.createOperation(
      'place',
      operationBeforeState,
      afterState,
      `放置拼图块 ${pieceIndex} 到网格位置 ${gridIndex}`
    )
    operationHistory.addOperation(operation)
    operationBeforeState = null // 清空临时状态
  }

  const recordSwapOperation = (pieceIndex1: number, pieceIndex2: number): void => {
    if (!operationBeforeState) {
      console.warn('操作前状态未记录，无法创建操作历史')
      return
    }
    
    const afterState = pieceManager.getSnapshot()
    const operation = operationHistory.createOperation(
      'swap',
      operationBeforeState,
      afterState,
      `交换拼图块 ${pieceIndex1} 和 ${pieceIndex2}`
    )
    operationHistory.addOperation(operation)
    operationBeforeState = null // 清空临时状态
  }

  const cancelRecordingOperation = (): void => {
    operationBeforeState = null // 清空临时状态，取消操作记录
    console.log('🚫 取消操作记录')
  }

  const resetPuzzle = () => {
    gameStateManager.resetGameState()
    clearOperationHistory()
    if (gameStateManager.currentPuzzleValue) {
      generateInitialPieces(gameStateManager.currentPuzzleValue)
    }
  }

  const setRestarting = (isRestarting: boolean) => {
    gameStateManager.setRestarting(isRestarting)
  }

  const generateInitialPieces = (puzzleData: PuzzleData): PieceStatus[] => {
    pieceManager.setPuzzleData(puzzleData)
    pieceManager.initializePieces(puzzleData.gridConfig.rows * puzzleData.gridConfig.cols)
    pieceManager.generateInitialPositions()
    pieceManager.shufflePositions()
    gameCompletionChecker.updatePieces(pieceManager.piecesValue)
    return pieceManager.piecesValue
  }

  const shufflePieces = (pieces: PieceStatus[]): PieceStatus[] => {
    clearOperationHistory()
    pieceManager.restoreFromData(pieces)
    pieceManager.shufflePositions()
    gameCompletionChecker.updatePieces(pieceManager.piecesValue)
    return pieceManager.piecesValue
  }

  // 返回所有需要的方法和状态
  return {
    // 状态
    currentPuzzle: computed(() => gameStateManager.currentPuzzleValue),
    pieces: computed(() => pieceManager.piecesValue),
    startTime: computed(() => gameTimer.startTimeValue),
    endTime: computed(() => gameTimer.endTimeValue),
    moveCount: computed(() => gameStateManager.moveCountValue),
    isCompleted: computed(() => gameStateManager.isCompletedValue),
    isGameActive: computed(() => gameStateManager.isGameActiveValue),
    isPaused: computed(() => gameStateManager.isPausedValue),
    isAutoPaused: computed(() => gameStateManager.isAutoPausedValue),
    isAutoCompleted: computed(() => gameStateManager.isAutoCompletedValue),
    gameSessionId: computed(() => gameStateManager.gameSessionIdValue),
    userStats: computed(() => gameStateManager.userStatsValue),
    isRestarting: computed(() => gameStateManager.isRestartingValue),
    draggingPieceIndex: computed(() => pieceManager.draggingPieceIndexValue),
    dragOffset: computed(() => pieceManager.dragOffsetValue),

    // 计算属性
    totalPieces,
    elapsedTime,
    completionPercentage,
    currentDifficulty,
    unplacedPieces,
    placedPieces,
    correctlyPlacedPieces,
    puzzleBoardCompletionRate,

    // 转换函数
    convertPiecePositionsToStatus,
    convertStatusToPiecePositions,

    // 游戏状态管理
    initializeNewGame,
    restoreGameState,
    pauseGameState,
    resumeGameState,
    completeGameState,
    resetGameState,
    incrementMoveCount,
    setRestarting,

    // 拼图块管理
    updatePiecePosition,
    updatePieceRotation,
    updatePieceFlip,
    updatePiecePlacement,
    initializePuzzleBoardPieces,
    updatePuzzleBoardPiecePosition,
    setPuzzleBoardPiecePlaced,
    getPuzzleBoardPiece,
    isPuzzleBoardSlotOccupied,
    getPieceAtSlot,
    swapPuzzleBoardPieces,
    resetAllPuzzleBoardPieceStates,
    recalculateAllCorrectness,
    clearPuzzleBoardPieces,
    setDraggingPiece,
    clearDragging,
    setDragOffset,
    restorePuzzleBoardPiecesFromData,
    getPuzzleBoardPiecesSnapshot,

    // 游戏完成检查
    isPuzzleBoardGameCompleted,
    checkGameCompletion,
    getCorrectPositionForPiece,
    isPieceAtPosition,
    snapPieceToGrid,

    // 持久化管理
    generateSessionId,
    saveGameState,
    loadGameState,
    clearGameState,
    loadGameSnapshot,
    resetPauseTime,
    calculateElapsedTime,

    // 拼图控制
    stopCurrentPuzzle,
    setAutoCompleted,

    // 其他方法
    generateInitialPieces,
    shufflePieces,
    resetPuzzle,

    // 撤销和重做
    undoLastOperation,
    redoLastOperation,
    canUndo,
    canRedo,
    clearOperationHistory,
    startRecordingOperation,
    recordPlaceOperation,
    recordSwapOperation,
    cancelRecordingOperation
  }
})
