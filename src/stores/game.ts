/**
 * 游戏状态管理Store
 * 专注于游戏数据状态管理和核心业务逻辑
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PuzzleData, PiecePosition, UserStats } from '../types'

export const useGameStore = defineStore('game', () => {
  // 基础游戏状态
  const currentPuzzle = ref<PuzzleData | null>(null)
  const pieces = ref<PiecePosition[]>([])
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

  const updateCurrentTime = () => {
    if (!isCompleted.value) {
      currentTime.value = new Date()
    }
  }

  const initializeNewGame = (data: {
    puzzleData: PuzzleData
    pieces: PiecePosition[]
    startTime: Date
    gameSessionId: string
  }) => {
    currentPuzzle.value = data.puzzleData
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
    pieces: PiecePosition[]
    startTime: Date
    moveCount: number
    isCompleted: boolean
    isPaused: boolean
    isAutoPaused: boolean
    gameSessionId: string
  }) => {
    currentPuzzle.value = data.puzzleData
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
      // 不再自动调用checkCompletion，由PuzzleBoard组件控制完成检查
      // checkCompletion(totalPieces.value)
    } else {
      console.log("updatePiecePlacement 找不到拼图块:", pieceId)
    }
  }

  const completeGameState = (completionTime: Date) => {
    endTime.value = completionTime
    isCompleted.value = true
    isGameActive.value = false
    isPaused.value = false
    isAutoPaused.value = false
  }

  const loadGameSnapshot = (data: {
    pieces: PiecePosition[]
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

  const generateInitialPieces = (puzzleData: PuzzleData): PiecePosition[] => {
    const pieces: PiecePosition[] = []
    const { rows, cols } = puzzleData.gridConfig
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        pieces.push({
          id: `piece_${row}_${col}`,
          x: Math.random() * 300 + 50, // 随机散布在侧边栏
          y: Math.random() * 400 + 50,
          rotation: 0,
          isPlaced: false
        })
      }
    }
    
    return pieces
  }

  const shufflePieces = (pieces: PiecePosition[]): PiecePosition[] => {
    return pieces.map(piece => ({
      ...piece,
      x: Math.random() * 300 + 50,
      y: Math.random() * 400 + 50,
      rotation: Math.random() * 360,
      isPlaced: false
    }))
  }

  const checkCompletion = (totalPieces: number): boolean => {
    const placedPieces = pieces.value.filter(piece => piece.isPlaced)
    
    // 首先检查是否所有拼图块都已放置
    if (placedPieces.length !== totalPieces) {
      isCompleted.value = false
      return false
    }
    
    // 然后检查每个拼图块是否放在正确位置
    const allCorrect = pieces.value.every(piece => {
      if (!piece.isPlaced) return false
      
      // 从piece.id解析出正确的行列位置
      const [, row, col] = piece.id.split('_').map(Number)
      if (isNaN(row) || isNaN(col)) return false
      
      // 计算正确的网格索引
      const correctGridIndex = row * (currentPuzzle.value?.gridConfig.cols || 0) + col
      
      // 从piece.x, piece.y计算当前网格位置
      const gridCols = currentPuzzle.value?.gridConfig.cols || 0
      const pieceWidth = currentPuzzle.value?.gridConfig.pieceWidth || 100
      const pieceHeight = currentPuzzle.value?.gridConfig.pieceHeight || 75
      
      const currentCol = Math.floor((piece.x - 8) / (pieceWidth + 2))
      const currentRow = Math.floor((piece.y - 8) / (pieceHeight + 2))
      const currentGridIndex = currentRow * gridCols + currentCol
      
      return correctGridIndex === currentGridIndex
    })
    
    isCompleted.value = allCorrect
    console.log('游戏完成检查:', {
      已放置数量: placedPieces.length,
      总数量: totalPieces,
      全部正确: allCorrect,
      游戏完成: isCompleted.value
    })
    
    return isCompleted.value
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
      piece.x = gridCol * pieceWidth
      piece.y = gridRow * pieceHeight
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

    // 计算属性
    elapsedTime,
    completionPercentage,
    currentDifficulty,
    
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
    
    // 核心业务逻辑方法
    startTimer,
    pauseTimer,
    resumeTimer,
    calculateElapsedTime,
    generateInitialPieces,
    shufflePieces,
    checkCompletion,
    getCorrectPositionForPiece,
    isPieceAtPosition,
    snapPieceToGrid,
    resetPauseTime,
    
    // 存储方法
    generateSessionId,
    saveGameState,
    loadGameState,
    clearGameState
  }
})
