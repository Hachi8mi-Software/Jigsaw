/**
 * 游戏状态管理Store
 * 采用Pinia + 面向对象设计模式
 */

import { defineStore } from 'pinia'
import { ref, computed, onUnmounted } from 'vue'
import type { GameState, PuzzleData, PiecePosition, UserStats } from '../types'
import { useLibraryStore } from './library'

/**
 * 游戏管理器类
 */
class GameManager {
  private startTime: Date | null = null
  private timerInterval: number | null = null
  private pauseStartTime: Date | null = null
  private totalPauseTime: number = 0

  /**
   * 开始游戏计时
   */
  startTimer(): Date {
    this.startTime = new Date()
    this.totalPauseTime = 0
    this.pauseStartTime = null
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
   * 暂停计时
   */
  pauseTimer(): void {
    if (!this.pauseStartTime) {
      this.pauseStartTime = new Date()
    }
  }

  /**
   * 恢复计时
   */
  resumeTimer(): void {
    if (this.pauseStartTime) {
      const pauseEndTime = new Date()
      this.totalPauseTime += pauseEndTime.getTime() - this.pauseStartTime.getTime()
      this.pauseStartTime = null
    }
  }

  /**
   * 计算经过的时间（秒）
   */
  calculateElapsedTime(startTime: Date, endTime?: Date): number {
    let end: Date
    if (endTime) {
      end = endTime
    } else if (this.pauseStartTime) {
      // 如果游戏暂停中，使用暂停开始时间作为结束时间
      end = this.pauseStartTime
    } else {
      end = new Date()
    }
    const actualElapsed = end.getTime() - startTime.getTime()
    const adjustedElapsed = actualElapsed - this.totalPauseTime
    return Math.floor(adjustedElapsed / 1000)
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

  /**
   * 重置暂停时间统计
   */
  resetPauseTime(): void {
    this.totalPauseTime = 0
    this.pauseStartTime = null
  }

  /**
   * 获取总暂停时间
   */
  getTotalPauseTime(): number {
    return this.totalPauseTime
  }

  /**
   * 设置总暂停时间
   */
  setTotalPauseTime(totalPauseTime: number): void {
    this.totalPauseTime = totalPauseTime
  }

  /**
   * 获取暂停开始时间
   */
  getPauseStartTime(): Date | null {
    return this.pauseStartTime
  }

  /**
   * 设置暂停开始时间
   */
  setPauseStartTime(pauseStartTime: Date | null): void {
    this.pauseStartTime = pauseStartTime
  }
}

const libraryStore = useLibraryStore()

export const useGameStore = defineStore('game', () => {
  // 状态
  const currentPuzzle = ref<PuzzleData | null>(null)
  const pieces = ref<PiecePosition[]>([])
  const startTime = ref<Date | null>(null)
  const endTime = ref<Date | null>(null)
  const moveCount = ref(0)
  const isCompleted = ref(false)
  const isPaused = ref(false)
  const pauseType = ref<'manual' | 'auto' | null>(null) // 暂停类型：手动或自动
  const gameSessionId = ref<string | null>(null)
  const userStats = ref<UserStats>({
    totalGamesPlayed: 0,
    totalTimeSpent: 0,
    bestTimes: {},
    achievements: [],
    totalSuccessMovements: 0
  })

  // 实时计时器状态
  const currentTime = ref<Date>(new Date())
  const timerInterval = ref<number | null>(null)

  // 游戏管理器实例
  const gameManager = new GameManager()

  // 计算属性
  const isGameActive = computed(() => {
    return currentPuzzle.value !== null && !isCompleted.value && !isPaused.value
  })

  const elapsedTime = computed(() => {
    if (!startTime.value) return 0
    // GameManager内部会处理暂停逻辑
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
      // 只有游戏活跃且未暂停且未完成时才更新时间
      if (isGameActive.value && !isPaused.value && !isCompleted.value) {
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

  // 生成游戏会话ID
  const generateSessionId = (): string => {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 保存游戏状态到本地存储
  const saveGameState = () => {
    if (!currentPuzzle.value || !gameSessionId.value) return
    
    const gameState = {
      sessionId: gameSessionId.value,
      puzzleId: currentPuzzle.value.id,
      pieces: pieces.value,
      startTime: startTime.value?.toISOString(),
      moveCount: moveCount.value,
      isCompleted: isCompleted.value,
      isPaused: isPaused.value,
      pauseType: pauseType.value,
      totalPauseTime: gameManager.getTotalPauseTime(),
      pauseStartTime: gameManager.getPauseStartTime()?.toISOString(),
      savedAt: new Date().toISOString()
    }
    
    localStorage.setItem(`puzzle_game_${currentPuzzle.value.id}`, JSON.stringify(gameState))
  }

  // 从本地存储加载游戏状态
  const loadGameState = (puzzleId: string): any | null => {
    try {
      const saved = localStorage.getItem(`puzzle_game_${puzzleId}`)
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('加载游戏状态失败:', error)
      return null
    }
  }

  // 清除本地存储的游戏状态
  const clearGameState = (puzzleId: string) => {
    localStorage.removeItem(`puzzle_game_${puzzleId}`)
  }

  // 检测页面可见性变化（自动暂停/恢复）
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // 页面隐藏时自动暂停
      if (isGameActive.value && !isCompleted.value) {
        console.log('页面隐藏，自动暂停游戏')
        pauseGame(true) // 标记为自动暂停
      }
    } else {
      // 页面显示时可以选择是否恢复
      // 这里可以根据用户偏好决定是否自动恢复
      console.log('页面重新可见，游戏状态:', { isActive: isGameActive.value, isPaused: isPaused.value, pauseType: pauseType.value })
    }
  }

  // Actions
  const startNewGame = (puzzleData: PuzzleData, forceNew: boolean = false) => {
    // 如果当前有正在进行的游戏且不是同一个拼图，先暂停并保存当前游戏
    if (currentPuzzle.value && 
        currentPuzzle.value.id !== puzzleData.id && 
        isGameActive.value && 
        !isCompleted.value) {
      console.log('切换拼图，暂停当前游戏:', currentPuzzle.value.name)
      pauseGame(true) // 自动暂停当前游戏
      saveGameState() // 保存当前游戏状态
    }
    
    // 停止当前的实时计时器
    stopRealTimeTimer()
    
    // 如果强制新游戏或没有现有状态，则开始新游戏
    if (forceNew) {
      clearGameState(puzzleData.id)
    }
    
    // 尝试加载现有游戏状态
    const existingState = loadGameState(puzzleData.id)
    
    if (existingState && !forceNew && !existingState.isCompleted) {
      // 恢复现有游戏
      currentPuzzle.value = puzzleData
      pieces.value = existingState.pieces
      startTime.value = new Date(existingState.startTime)
      currentTime.value = new Date()
      endTime.value = null
      moveCount.value = existingState.moveCount
      isCompleted.value = existingState.isCompleted
      isPaused.value = existingState.isPaused
      // 兼容旧的状态格式和新的状态格式
      if (existingState.pauseType !== undefined) {
        pauseType.value = existingState.pauseType
      } else {
        // 兼容旧格式
        pauseType.value = existingState.isAutoPaused ? 'auto' : (existingState.isPaused ? 'manual' : null)
      }
      gameSessionId.value = existingState.sessionId
      
      // 恢复暂停时间信息
      if (existingState.totalPauseTime !== undefined) {
        gameManager.setTotalPauseTime(existingState.totalPauseTime)
      }
      if (existingState.pauseStartTime) {
        gameManager.setPauseStartTime(new Date(existingState.pauseStartTime))
      } else {
        gameManager.setPauseStartTime(null)
      }
      
      if (isGameActive.value) {
        startRealTimeTimer()
      }
      
      console.log('恢复现有游戏状态')
    } else {
      // 开始新游戏
      currentPuzzle.value = puzzleData
      pieces.value = gameManager.generateInitialPieces(puzzleData)
      startTime.value = gameManager.startTimer()
      currentTime.value = new Date()
      endTime.value = null
      moveCount.value = 0
      isCompleted.value = false
      isPaused.value = false
      pauseType.value = null
      gameSessionId.value = generateSessionId()
      
      // 启动实时计时器
      startRealTimeTimer()
      
      console.log('开始新游戏')
    }
    
    // 清理之前的页面可见性监听器，避免重复添加
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    // 设置页面可见性监听
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  const pauseGame = (autoPause: boolean = false) => {
    if (isGameActive.value) {
      isPaused.value = true
      pauseType.value = autoPause ? 'auto' : 'manual'
      gameManager.pauseTimer()
      // 暂停时停止实时计时器，避免继续计时
      stopRealTimeTimer()
      saveGameState()
      console.log(autoPause ? '游戏已自动暂停' : '游戏已暂停')
    }
  }

  const resumeGame = () => {
    if (isPaused.value && !isCompleted.value) {
      isPaused.value = false
      pauseType.value = null
      gameManager.resumeTimer()
      // 恢复游戏时重新启动实时计时器
      startRealTimeTimer()
      saveGameState()
      console.log('游戏已恢复')
    }
  }

  const movePiece = (pieceId: string, x: number, y: number) => {
    const piece = pieces.value.find(p => p.id === pieceId)
    if (piece && isGameActive.value) {
      piece.x = x
      piece.y = y
      moveCount.value++
      saveGameState()
    }
  }

  const rotatePiece = (pieceId: string, rotation: number) => {
    const piece = pieces.value.find(p => p.id === pieceId)
    if (piece && isGameActive.value) {
      piece.rotation = rotation
      moveCount.value++
      saveGameState()
    }
  }

  const placePiece = (pieceId: string, isPlaced: boolean) => {
    const piece = pieces.value.find(p => p.id === pieceId)
    if (piece) {
      piece.isPlaced = isPlaced
      saveGameState()
      
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
      isPaused.value = false
      pauseType.value = null
      
      // 停止实时计时器
      stopRealTimeTimer()
      
      // 更新用户统计
      updateUserStats()
      
      // 保存完成状态
      saveGameState()
      
      console.log('游戏完成！')
    }
  }

  const updateUserStats = () => {
    libraryStore.updateUserStats((userStats: UserStats) => {
      if (!currentPuzzle.value || !startTime.value || !endTime.value) return

      const gameTime = gameManager.calculateElapsedTime(startTime.value, endTime.value)
      const puzzleId = currentPuzzle.value.id

      userStats.totalGamesPlayed++
      userStats.totalTimeSpent += gameTime

      // 更新最佳时间
      if (!userStats.bestTimes[puzzleId] || gameTime < userStats.bestTimes[puzzleId]) {
        userStats.bestTimes[puzzleId] = gameTime
      }
      return userStats
    })
  }

  const resetGame = () => {
    if (currentPuzzle.value) {
      // 清除现有游戏状态
      clearGameState(currentPuzzle.value.id)
      
      // 重新开始游戏
      startNewGame(currentPuzzle.value, true)
      
      console.log('游戏已重置')
    }
  }

  const restartGame = () => {
    if (currentPuzzle.value) {
      // 重新开始游戏（不清除历史记录）
      startNewGame(currentPuzzle.value, true)
      
      console.log('游戏已重新开始')
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
    isPaused.value = false
    
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

  // 清理定时器和事件监听器
  const cleanup = () => {
    stopRealTimeTimer()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
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
    pauseType,
    gameSessionId,
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
    restartGame,
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
