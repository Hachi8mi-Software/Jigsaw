/**
 * 游戏状态管理Store
 * 专注于游戏数据状态管理和核心业务逻辑
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PuzzleData, PiecePosition, UserStats, PieceStatus } from '../types'

export const useGameStore = defineStore('game', () => {
  // 基础游戏状态
  const currentPuzzle = ref<PuzzleData | null>(null)
  const pieces = ref<PieceStatus[]>([])
  const startTime = ref<Date | null>(null)
  const endTime = ref<Date | null>(null)
  const moveCount = ref(0)
  const isCompleted = ref(false)
  const isGameActive = ref(false)
  const isPaused = ref(false)
  const isAutoPaused = ref(false)
  const gameSessionId = ref<string | null>(null)
  const userStats = ref<UserStats>({
    totalGamesPlayed: 0,
    totalTimeSpent: 0,
    bestTimes: {},
    achievements: [],
    totalSuccessMovements: 0
  })
  const isRestarting = ref(true)

  const draggingPieceIndex = ref(-1)
  const dragOffset = ref({ x: 0, y: 0 })

  // 转换函数：将 PiecePosition[] 转换为 PieceStatus[]
  const convertPiecePositionsToStatus = (piecePositions: PiecePosition[]): PieceStatus[] => {
    return piecePositions.map((piece, index) => ({
      // 统一使用 x, y 坐标
      id: piece.id,
      x: piece.x,
      y: piece.y,
      rotation: piece.rotation,
      
      // PieceStatus 属性
      originalIndex: index,
      isPlaced: piece.isPlaced,
      isCorrect: undefined,
      gridPosition: undefined
    }))
  }

  // 转换函数：将 PieceStatus[] 转换为 PiecePosition[]  
  const convertStatusToPiecePositions = (pieceStatuses: PieceStatus[]): PiecePosition[] => {
    return pieceStatuses.map(piece => ({
      id: piece.id || `piece_${piece.originalIndex}`,
      x: piece.x,
      y: piece.y,
      rotation: piece.rotation || 0,
      isPlaced: piece.isPlaced
    }))
  }

  const totalPieces = computed(() => {
    if (!currentPuzzle.value) return 0
    return currentPuzzle.value.gridConfig.rows * currentPuzzle.value.gridConfig.cols
  })

  // 实时计时器状态
  const currentTime = ref<Date>(new Date())
  
  // 计时相关私有状态
  const pauseStartTime = ref<Date | null>(null)
  const totalPauseTime = ref<number>(0)

  // 计算属性
  const elapsedTime = computed(() => {
    if (!startTime.value || !currentTime.value) return 0
    const elapsed = currentTime.value.getTime() - startTime.value.getTime()
    return Math.floor(elapsed / 1000)
  })

  const completionPercentage = computed(() => {
    if (!currentPuzzle.value) return 0
    
    if (pieces.value.length === 0) {
      return 0
    }
    
    const placedPieces = pieces.value.filter(piece => piece.isPlaced)
    return Math.round((placedPieces.length / totalPieces.value) * 100)
  })

  const currentDifficulty = computed(() => {
    return currentPuzzle.value?.difficulty || 1
  })

  // 拼图板相关计算属性
  const unplacedPieces = computed(() => {
    return pieces.value.filter(piece => !piece.isPlaced)
  })

  const placedPieces = computed(() => {
    return pieces.value.filter(piece => piece.isPlaced)
  })

  const correctlyPlacedPieces = computed(() => {
    return pieces.value.filter(piece => piece.isPlaced && piece.isCorrect)
  })

  const puzzleBoardCompletionRate = computed(() => {
    if (pieces.value.length === 0) return 0
    return Math.round((correctlyPlacedPieces.value.length / pieces.value.length) * 100)
  })

  const updateCurrentTime = () => {
    if (!isCompleted.value) {
      currentTime.value = new Date()
    }
  }

  const initializeNewGame = (data: {
    puzzleData: PuzzleData
    pieces: PieceStatus[]
    startTime: Date
    gameSessionId: string
  }) => {
    currentPuzzle.value = data.puzzleData
    // 直接使用 PieceStatus[]
    pieces.value = data.pieces
    startTime.value = data.startTime
    currentTime.value = new Date()
    endTime.value = null
    moveCount.value = 0
    isCompleted.value = false
    isPaused.value = false
    isAutoPaused.value = false
    isGameActive.value = true
    gameSessionId.value = data.gameSessionId
  }

  const restoreGameState = (data: {
    puzzleData: PuzzleData
    pieces: PieceStatus[]
    startTime: Date
    moveCount: number
    isCompleted: boolean
    isPaused: boolean
    isAutoPaused: boolean
    gameSessionId: string
  }) => {
    currentPuzzle.value = data.puzzleData
    // 直接使用 PieceStatus[]
    pieces.value = data.pieces
    startTime.value = data.startTime
    currentTime.value = new Date()
    endTime.value = null
    moveCount.value = data.moveCount
    isCompleted.value = data.isCompleted
    isPaused.value = data.isPaused
    isAutoPaused.value = data.isAutoPaused
    isGameActive.value = !data.isPaused
    gameSessionId.value = data.gameSessionId
  }

  const pauseGameState = (autoPause: boolean = false) => {
    isGameActive.value = false
    isPaused.value = true
    isAutoPaused.value = autoPause
  }

  const resumeGameState = () => {
    isGameActive.value = true
    isPaused.value = false
    isAutoPaused.value = false
  }


  const updatePiecePosition = (pieceId: string, x: number, y: number) => {
    const piece = pieces.value.find(p => p.id === pieceId)
    if (piece) {
      piece.x = x
      piece.y = y
      moveCount.value++
    }
  }

  const updatePieceRotation = (pieceId: string, rotation: number) => {
    const piece = pieces.value.find(p => p.id === pieceId)
    if (piece) {
      piece.rotation = rotation
      moveCount.value++
    }
  }

  const updatePiecePlacement = (pieceId: string, isPlaced: boolean) => {
    const piece = pieces.value.find(p => p.id === pieceId)
    if (piece) {
      piece.isPlaced = isPlaced
      checkGameCompletion()
    } else {
      console.log("updatePiecePlacement 找不到拼图块:", pieceId)
    }
  }

  // 拼图板相关方法 (现在使用统一的 pieces 数组)
  const initializePuzzleBoardPieces = (totalPieces: number) => {
    pieces.value = Array.from({ length: totalPieces }, (_, i) => ({
      id: `piece_${i}`,
      x: 0,
      y: 0,
      rotation: 0,
      originalIndex: i,
      currentX: 0,
      currentY: 0,
      isPlaced: false
    }))
  }

  const updatePuzzleBoardPiecePosition = (index: number, x: number, y: number) => {
    const piece = pieces.value[index]
    if (piece) {
      piece.x = x
      piece.y = y
    }
  }

  const setPuzzleBoardPiecePlaced = (index: number, isPlaced: boolean, gridPosition?: number, isCorrect?: boolean) => {
    const piece = pieces.value[index]
    if (piece) {
      piece.isPlaced = isPlaced
      piece.gridPosition = gridPosition
      piece.isCorrect = isCorrect

      // 检查游戏是否完成
      if (isPuzzleBoardGameCompleted()) {
        isCompleted.value = true
      }
    }
  }

  const getPuzzleBoardPiece = (index: number): PieceStatus | undefined => {
    return pieces.value[index]
  }

  const isPuzzleBoardSlotOccupied = (slotIndex: number): boolean => {
    return pieces.value.some(piece => piece.isPlaced && piece.gridPosition === slotIndex)
  }

  const resetAllPuzzleBoardPieceStates = () => {
    pieces.value.forEach(piece => {
      piece.isPlaced = false
      piece.isCorrect = undefined
      piece.gridPosition = undefined
    })
  }

  const clearPuzzleBoardPieces = () => {
    pieces.value = []
    draggingPieceIndex.value = -1
    dragOffset.value = { x: 0, y: 0 }
  }

  const setDraggingPiece = (index: number) => {
    draggingPieceIndex.value = index
  }

  const clearDragging = () => {
    draggingPieceIndex.value = -1
  }

  const setDragOffset = (offset: { x: number, y: number }) => {
    dragOffset.value = offset
  }

  const restorePuzzleBoardPiecesFromData = (piecesData: PieceStatus[]) => {
    pieces.value = piecesData.map(piece => ({ ...piece }))
  }

  const getPuzzleBoardPiecesSnapshot = (): PieceStatus[] => {
    return pieces.value.map(piece => ({ ...piece }))
  }

  const isPuzzleBoardGameCompleted = (): boolean => {
    if (pieces.value.length === 0) return false
    return pieces.value.every(piece => piece.isPlaced && piece.isCorrect)
  }

  // 检查游戏完成 (两种拼图系统都支持)
  const checkGameCompletion = () => {
    // 基于 pieces (PiecePosition[]) 的检查
    const totalPieces = pieces.value.length
    if (totalPieces > 0) {
      const placedPieces = pieces.value.filter(piece => piece.isPlaced)
      if (placedPieces.length === totalPieces) {
        isCompleted.value = true
        return true
      }
    }

    // 基于 puzzleBoardPieces (PieceStatus[]) 的检查
    if (isPuzzleBoardGameCompleted()) {
      isCompleted.value = true
      return true
    }

    return false
  }

  const completeGameState = (completionTime: Date) => {
    endTime.value = completionTime
    isCompleted.value = true
    isGameActive.value = false
    isPaused.value = false
    isAutoPaused.value = false
  }

  const loadGameSnapshot = (data: {
    pieces: PieceStatus[]
    startTime: Date
    moveCount: number
  }) => {
    pieces.value = data.pieces
    startTime.value = data.startTime
    currentTime.value = new Date()
    moveCount.value = data.moveCount
    isGameActive.value = true
    isPaused.value = false
  }

  const resetGameState = () => {
    startTime.value = null
    endTime.value = null
    moveCount.value = 0
    isCompleted.value = false
    isGameActive.value = false
    isPaused.value = false
    isAutoPaused.value = false
    gameSessionId.value = null
    currentTime.value = new Date()
  }

  const incrementMoveCount = () => {
    moveCount.value++
  }

  // 核心游戏业务逻辑
  const startTimer = (): Date => {
    const start = new Date()
    startTime.value = start
    totalPauseTime.value = 0
    pauseStartTime.value = null
    return start
  }

  const pauseTimer = () => {
    if (!pauseStartTime.value) {
      pauseStartTime.value = new Date()
    }
  }

  const resumeTimer = () => {
    if (pauseStartTime.value) {
      const pauseEndTime = new Date()
      totalPauseTime.value += pauseEndTime.getTime() - pauseStartTime.value.getTime()
      pauseStartTime.value = null
    }
  }

  /**
   * 计算经过的时间（秒）
   */
  const calculateElapsedTime = (startTime: Date, endTime?: Date): number => {
    let end: Date
    if (endTime) {
      end = endTime
    } else if (pauseStartTime.value) {
      // 如果游戏暂停中，使用暂停开始时间作为结束时间
      end = pauseStartTime.value
    } else {
      end = new Date()
    }
    const actualElapsed = end.getTime() - startTime.getTime()
    const adjustedElapsed = actualElapsed - totalPauseTime.value
    return Math.floor(adjustedElapsed / 1000)
  }

  const generateInitialPieces = (puzzleData: PuzzleData): PieceStatus[] => {
    const pieces: PieceStatus[] = []
    const { rows, cols } = puzzleData.gridConfig
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = Math.random() * 300 + 50
        const y = Math.random() * 400 + 50
        pieces.push({
          id: `piece_${row}_${col}`,
          x: x,
          y: y,
          rotation: 0,
          originalIndex: row * cols + col,
          isPlaced: false
        })
      }
    }
    
    return pieces
  }

  const shufflePieces = (pieces: PieceStatus[]): PieceStatus[] => {
    return pieces.map(piece => {
      const x = Math.random() * 300 + 50
      const y = Math.random() * 400 + 50
      return {
        ...piece,
        x: x,
        y: y,
        rotation: Math.random() * 360,
        isPlaced: false
      }
    })
  }

  const getCorrectPositionForPiece = (pieceId: string): { row: number, col: number } | null => {
    const [, row, col] = pieceId.split('_').map(Number)
    if (!isNaN(row) && !isNaN(col)) {
      return { row, col }
    }
    return null
  }

  const isPieceAtPosition = (
    row: number, 
    col: number, 
    gridConfig: { pieceWidth: number; pieceHeight: number },
    excludePieceId?: string
  ): boolean => {
    const { pieceWidth, pieceHeight } = gridConfig
    const targetX = col * pieceWidth
    const targetY = row * pieceHeight
    
    return pieces.value.some(piece => 
      piece.id !== excludePieceId &&
      piece.isPlaced &&
      piece.x !== undefined && piece.y !== undefined &&
      Math.abs(piece.x - targetX) < 10 &&
      Math.abs(piece.y - targetY) < 10
    )
  }

  const snapPieceToGrid = (
    pieceId: string,
    gridRow: number, 
    gridCol: number, 
    gridConfig: { pieceWidth: number; pieceHeight: number }
  ): void => {
    const piece = pieces.value.find(p => p.id === pieceId)
    if (piece) {
      const { pieceWidth, pieceHeight } = gridConfig
      const newX = gridCol * pieceWidth
      const newY = gridRow * pieceHeight
      piece.x = newX
      piece.y = newY
    }
  }

  // 本地存储相关方法
  const generateSessionId = (): string => {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const saveGameState = (puzzleData: PuzzleData) => {
    if (!puzzleData || !gameSessionId.value) return
    
    const stateToSave = {
      sessionId: gameSessionId.value,
      puzzleId: puzzleData.id,
      pieces: pieces.value,
      startTime: startTime.value?.toISOString(),
      moveCount: moveCount.value,
      isCompleted: isCompleted.value,
      isPaused: isPaused.value,
      isAutoPaused: isAutoPaused.value,
      savedAt: new Date().toISOString()
    }
    
    localStorage.setItem(`puzzle_game_${puzzleData.id}`, JSON.stringify(stateToSave))
  }

  const loadGameState = (puzzleId: string): any | null => {
    try {
      const saved = localStorage.getItem(`puzzle_game_${puzzleId}`)
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('加载游戏状态失败:', error)
      return null
    }
  }

  const clearGameState = (puzzleId: string): void => {
    localStorage.removeItem(`puzzle_game_${puzzleId}`)
  }

  const resetPauseTime = (): void => {
    totalPauseTime.value = 0
    pauseStartTime.value = null
  }

  return {
    // 状态
    currentPuzzle,
    pieces,
    startTime,
    endTime,
    moveCount,
    isCompleted,
    isGameActive,
    isPaused,
    isAutoPaused,
    gameSessionId,
    userStats,
    isRestarting,

    // 拖拽状态
    draggingPieceIndex,
    dragOffset,

    // 计算属性
    elapsedTime,
    completionPercentage,
    currentDifficulty,
    totalPieces,
    
    // 拼图板计算属性
    unplacedPieces,
    placedPieces,
    correctlyPlacedPieces,
    puzzleBoardCompletionRate,
    
    // 基础数据操作方法
    updateCurrentTime,
    initializeNewGame,
    restoreGameState,
    pauseGameState,
    resumeGameState,
    updatePiecePosition,
    updatePieceRotation,
    updatePiecePlacement,
    completeGameState,
    loadGameSnapshot,
    resetGameState,
    incrementMoveCount,
    
    // 拼图板方法
    initializePuzzleBoardPieces,
    updatePuzzleBoardPiecePosition,
    setPuzzleBoardPiecePlaced,
    getPuzzleBoardPiece,
    isPuzzleBoardSlotOccupied,
    resetAllPuzzleBoardPieceStates,
    clearPuzzleBoardPieces,
    setDraggingPiece,
    clearDragging,
    setDragOffset,
    restorePuzzleBoardPiecesFromData,
    getPuzzleBoardPiecesSnapshot,
    isPuzzleBoardGameCompleted,
    
    // 核心业务逻辑方法
    startTimer,
    pauseTimer,
    resumeTimer,
    calculateElapsedTime,
    generateInitialPieces,
    shufflePieces,
    checkGameCompletion,
    getCorrectPositionForPiece,
    isPieceAtPosition,
    snapPieceToGrid,
    resetPauseTime,
    
    // 存储方法
    generateSessionId,
    saveGameState,
    loadGameState,
    clearGameState,

    // 转换函数
    convertPiecePositionsToStatus,
    convertStatusToPiecePositions
  }
})
