/**
 * 游戏状态管理Store
 * 采用Pinia + 面向对象设计模式
 */

import { defineStore } from 'pinia'
import { ref, computed, onUnmounted } from 'vue'
import type { GameState, PuzzleData, PiecePosition, UserStats } from '../types'

/**
 * 游戏管理器类
 */
class GameManager {
  private startTime: Date | null = null
  private timerInterval: number | null = null

  /**
   * 开始游戏计时
   */
  startTimer(): Date {
    this.startTime = new Date()
    return this.startTime
  }

  /**
   * 停止游戏计时
   */
  stopTimer(): Date {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
    return new Date()
  }

  /**
   * 计算经过的时间（秒）
   */
  calculateElapsedTime(startTime: Date, endTime?: Date): number {
    const end = endTime || new Date()
    return Math.floor((end.getTime() - startTime.getTime()) / 1000)
  }

  /**
   * 检查拼图是否完成
   */
  checkCompletion(pieces: PiecePosition[], totalPieces: number): boolean {
    const placedPieces = pieces.filter(piece => piece.isPlaced)
    return placedPieces.length === totalPieces
  }

  /**
   * 生成初始拼图块位置
   */
  generateInitialPieces(puzzleData: PuzzleData): PiecePosition[] {
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

  /**
   * 打乱拼图块位置
   */
  shufflePieces(pieces: PiecePosition[]): PiecePosition[] {
    return pieces.map(piece => ({
      ...piece,
      x: Math.random() * 300 + 50,
      y: Math.random() * 400 + 50,
      rotation: Math.random() * 360,
      isPlaced: false
    }))
  }
}

export const useGameStore = defineStore('game', () => {
  // 状态
  const currentPuzzle = ref<PuzzleData | null>(null)
  const pieces = ref<PiecePosition[]>([])
  const startTime = ref<Date | null>(null)
  const endTime = ref<Date | null>(null)
  const moveCount = ref(0)
  const isCompleted = ref(false)
  const isGameActive = ref(false)
  const userStats = ref<UserStats>({
    totalGamesPlayed: 0,
    totalTimeSpent: 0,
    bestTimes: {},
    achievements: []
  })

  // 实时计时器状态
  const currentTime = ref<Date>(new Date())
  const timerInterval = ref<number | null>(null)

  // 游戏管理器实例
  const gameManager = new GameManager()

  // 计算属性
  const elapsedTime = computed(() => {
    if (!startTime.value || !isGameActive.value) return 0
    return gameManager.calculateElapsedTime(startTime.value, currentTime.value)
  })

  const completionPercentage = computed(() => {
    // 如果没有拼图数据，返回0
    if (!currentPuzzle.value) return 0
    
    // 计算总拼图块数量
    const totalPieces = currentPuzzle.value.gridConfig.rows * currentPuzzle.value.gridConfig.cols
    
    // 如果没有pieces数据，尝试从currentPuzzle计算
    if (pieces.value.length === 0) {
      return 0
    }
    
    const placedPieces = pieces.value.filter(piece => piece.isPlaced)
    return Math.round((placedPieces.length / totalPieces) * 100)
  })

  const currentDifficulty = computed(() => {
    return currentPuzzle.value?.difficulty || 1
  })

  // 实时计时器
  const startRealTimeTimer = () => {
    if (timerInterval.value) return
    
    timerInterval.value = window.setInterval(() => {
      if (isGameActive.value && !isCompleted.value) {
        currentTime.value = new Date()
      }
    }, 1000) // 每秒更新一次
  }

  const stopRealTimeTimer = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
  }

  // Actions
  const startNewGame = (puzzleData: PuzzleData) => {
    currentPuzzle.value = puzzleData
    pieces.value = gameManager.generateInitialPieces(puzzleData)
    startTime.value = gameManager.startTimer()
    currentTime.value = new Date()
    endTime.value = null
    moveCount.value = 0
    isCompleted.value = false
    isGameActive.value = true
    
    // 启动实时计时器
    startRealTimeTimer()
  }

  const pauseGame = () => {
    isGameActive.value = false
    // 暂停时停止计时器更新
    stopRealTimeTimer()
  }

  const resumeGame = () => {
    isGameActive.value = true
    // 恢复时重新启动计时器
    startRealTimeTimer()
  }

  const movePiece = (pieceId: string, x: number, y: number) => {
    const piece = pieces.value.find(p => p.id === pieceId)
    if (piece && isGameActive.value) {
      piece.x = x
      piece.y = y
      moveCount.value++
    }
  }

  const rotatePiece = (pieceId: string, rotation: number) => {
    const piece = pieces.value.find(p => p.id === pieceId)
    if (piece && isGameActive.value) {
      piece.rotation = rotation
      moveCount.value++
    }
  }

  const placePiece = (pieceId: string, isPlaced: boolean) => {
    const piece = pieces.value.find(p => p.id === pieceId)
    if (piece) {
      piece.isPlaced = isPlaced
      
      // 检查游戏是否完成
      if (gameManager.checkCompletion(pieces.value, pieces.value.length)) {
        completeGame()
      }
    }
  }

  const completeGame = () => {
    if (!isCompleted.value && currentPuzzle.value) {
      endTime.value = gameManager.stopTimer()
      isCompleted.value = true
      isGameActive.value = false
      
      // 停止实时计时器
      stopRealTimeTimer()
      
      // 更新用户统计
      updateUserStats()
    }
  }

  const updateUserStats = () => {
    if (!currentPuzzle.value || !startTime.value || !endTime.value) return
    
    const gameTime = gameManager.calculateElapsedTime(startTime.value, endTime.value)
    const puzzleId = currentPuzzle.value.id
    
    userStats.value.totalGamesPlayed++
    userStats.value.totalTimeSpent += gameTime
    
    // 更新最佳时间
    if (!userStats.value.bestTimes[puzzleId] || gameTime < userStats.value.bestTimes[puzzleId]) {
      userStats.value.bestTimes[puzzleId] = gameTime
    }
  }

  const resetGame = () => {
    if (currentPuzzle.value) {
      pieces.value = gameManager.shufflePieces(pieces.value)
      startTime.value = gameManager.startTimer()
      currentTime.value = new Date()
      endTime.value = null
      moveCount.value = 0
      isCompleted.value = false
      isGameActive.value = true
      
      // 重新启动计时器
      startRealTimeTimer()
    }
  }

  const saveGame = () => {
    if (!currentPuzzle.value) return null
    
    return {
      puzzleId: currentPuzzle.value.id,
      pieces: pieces.value,
      startTime: startTime.value,
      moveCount: moveCount.value,
      savedAt: new Date()
    }
  }

  const loadGame = (gameData: any) => {
    // 实现游戏加载逻辑
    pieces.value = gameData.pieces
    startTime.value = new Date(gameData.startTime)
    currentTime.value = new Date()
    moveCount.value = gameData.moveCount
    isGameActive.value = true
    
    // 启动计时器
    startRealTimeTimer()
  }

  const getHint = () => {
    // 实现提示功能
    const unplacedPieces = pieces.value.filter(piece => !piece.isPlaced)
    if (unplacedPieces.length > 0) {
      return unplacedPieces[0] // 简单实现：返回第一个未放置的拼图块
    }
    return null
  }

  const snapPieceToGrid = (pieceId: string, gridRow: number, gridCol: number) => {
    const piece = pieces.value.find(p => p.id === pieceId)
    if (piece && currentPuzzle.value) {
      const { pieceWidth, pieceHeight } = currentPuzzle.value.gridConfig
      piece.x = gridCol * pieceWidth
      piece.y = gridRow * pieceHeight
    }
  }

  const isPieceAtPosition = (row: number, col: number, excludePieceId?: string): boolean => {
    if (!currentPuzzle.value) return false
    
    const { pieceWidth, pieceHeight } = currentPuzzle.value.gridConfig
    const targetX = col * pieceWidth
    const targetY = row * pieceHeight
    
    return pieces.value.some(piece => 
      piece.id !== excludePieceId &&
      piece.isPlaced &&
      Math.abs(piece.x - targetX) < 10 &&
      Math.abs(piece.y - targetY) < 10
    )
  }

  const getCorrectPositionForPiece = (pieceId: string): { row: number, col: number } | null => {
    const [, row, col] = pieceId.split('_').map(Number)
    if (!isNaN(row) && !isNaN(col)) {
      return { row, col }
    }
    return null
  }

  // 清理定时器
  const cleanup = () => {
    stopRealTimeTimer()
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
    userStats,
    
    // 计算属性
    elapsedTime,
    completionPercentage,
    currentDifficulty,
    
    // Actions
    startNewGame,
    pauseGame,
    resumeGame,
    movePiece,
    rotatePiece,
    placePiece,
    completeGame,
    resetGame,
    saveGame,
    loadGame,
    getHint,
    snapPieceToGrid,
    isPieceAtPosition,
    getCorrectPositionForPiece,
    
    // 清理方法
    cleanup
  }
})
