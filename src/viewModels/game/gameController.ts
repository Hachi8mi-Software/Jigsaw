/**
 * 游戏核心 ViewModel
 * 处理与界面相关的游戏业务逻辑，持有 store 实例
 */

import { useGameStore } from '../../stores/game'
import { useLibraryStore } from '../../stores/library'
import type { PieceStatus, PuzzleData, UserStats } from '../../types'

/**
 * 游戏核心控制器 - 处理游戏业务逻辑，持有store实例
 */
export class GameController {
  // 移除构造函数中的store获取，改为在需要时获取
  
  // 计时器管理
  private timerInterval: number | null = null
  private visibilityChangeHandler: (() => void) | null = null

  /**
   * 获取gameStore实例
   */
  private get gameStore() {
    return useGameStore()
  }

  /**
   * 获取libraryStore实例
   */
  private get libraryStore() {
    return useLibraryStore()
  }
  
  /**
   * 开始新游戏
   */
  startNewGame(puzzleData: PuzzleData, forceNew: boolean = false): void {
    if (forceNew) {
      this.gameStore.clearGameState(puzzleData.id)
    }
    
    const existingState = this.gameStore.loadGameState(puzzleData.id)
    
    if (existingState && !forceNew && !existingState.isCompleted) {
      // 恢复现有游戏
      console.log('🎮 恢复游戏状态，puzzleData:', puzzleData)
      console.log('存储的状态:', {
        totalPauseTime: existingState.totalPauseTime,
        pauseStartTime: existingState.pauseStartTime,
        isPaused: existingState.isPaused
      })
      
      this.gameStore.restoreGameState({
        puzzleData,
        pieces: existingState.pieces,
        startTime: new Date(existingState.startTime),
        endTime: existingState.endTime ? new Date(existingState.endTime) : undefined,
        moveCount: existingState.moveCount,
        sessionId: existingState.sessionId,
        totalPauseTime: existingState.totalPauseTime || 0,
        pauseStartTime: existingState.pauseStartTime ? new Date(existingState.pauseStartTime) : null,
        isPaused: existingState.isPaused || false
      })
      
      // 不要重置暂停时间，因为我们刚刚恢复了它们
      // this.gameStore.resetPauseTime()
      
      if (!existingState.isPaused) {
        this.startRealTimeTimer()
      }
      
      console.log('✅ 恢复现有游戏状态')
      console.log('恢复后的currentPuzzle:', this.gameStore.currentPuzzle)
      console.log('恢复后的currentPuzzle.imageUrl:', this.gameStore.currentPuzzle?.imageUrl)
    } else {
      // 开始新游戏
      const initialPieces = this.gameStore.generateInitialPieces(puzzleData)
      const sessionId = this.gameStore.generateSessionId()
      
      this.gameStore.initializeNewGame({
        puzzleData,
        pieces: initialPieces,
        startTime: new Date(),
        sessionId
      })
      
      this.startRealTimeTimer()
      
      console.log('开始新游戏')
    }

    this.gameStore.setRestarting(false)
    
    // 设置页面可见性监听
    this.setupVisibilityListener()
    
    // 保存游戏状态
    this.saveGameState()
  }

  /**
   * 暂停游戏
   */
  pauseGame(autoPause: boolean = false): void {
    if (this.gameStore.isGameActive && !this.gameStore.isCompleted) {
      this.gameStore.pauseGameState(autoPause)
      this.stopRealTimeTimer()
      this.saveGameState()
      console.log(autoPause ? '游戏已自动暂停' : '游戏已暂停')
    }
  }

  /**
   * 恢复游戏
   */
  resumeGame(): void {
    if (this.gameStore.isPaused && !this.gameStore.isCompleted) {
      this.gameStore.resumeGameState()
      this.startRealTimeTimer()
      this.saveGameState()
      console.log('游戏已恢复')
    }
  }

  /**
   * 重新开始游戏
   */
  restartGame(): void {
    if (this.gameStore.currentPuzzle) {
      const currentPuzzle = this.gameStore.currentPuzzle
      // 重置游戏状态
      this.gameStore.resetGameState()
      this.startNewGame(currentPuzzle, true)
      console.log('游戏已重新开始')
    }
  }

  /**
   * 移动拼图块
   */
  movePiece(pieceId: string, x: number, y: number): void {
    if (this.gameStore.isGameActive) {
      this.gameStore.updatePiecePosition(pieceId, x, y)
      this.saveGameState()
    }
  }

  /**
   * 旋转拼图块
   */
  rotatePiece(pieceId: string, rotation: number): void {
    if (this.gameStore.isGameActive) {
      this.gameStore.updatePieceRotation(pieceId, rotation)
      // 重新计算正确性状态
      this.gameStore.recalculateAllCorrectness()
      
      // 检查游戏是否完成
      const isCompleted = this.gameStore.checkGameCompletion()
      if (isCompleted) {
        this.stopRealTimeTimer()
        if (this.gameStore.startTime && this.gameStore.currentPuzzle) {
          const gameTime = this.gameStore.calculateElapsedTime(this.gameStore.startTime, new Date())
          this.updateUserStats(this.gameStore.currentPuzzle, gameTime)
        }
        this.saveGameState()
        console.log('旋转操作完成游戏！')
      }
      
      this.saveGameState()
    }
  }

  /**
   * 翻转拼图块
   */
  flipPiece(pieceId: string, flipped: boolean): void {
    if (this.gameStore.isGameActive) {
      this.gameStore.updatePieceFlip(pieceId, flipped)
      // 重新计算正确性状态
      this.gameStore.recalculateAllCorrectness()
      
      // 检查游戏是否完成
      const isCompleted = this.gameStore.checkGameCompletion()
      if (isCompleted) {
        this.stopRealTimeTimer()
        if (this.gameStore.startTime && this.gameStore.currentPuzzle) {
          const gameTime = this.gameStore.calculateElapsedTime(this.gameStore.startTime, new Date())
          this.updateUserStats(this.gameStore.currentPuzzle, gameTime)
        }
        this.saveGameState()
        console.log('翻转操作完成游戏！')
      }
      
      this.saveGameState()
    }
  }

  /**
   * 放置拼图块
   */
  placePiece(pieceId: string, isPlaced: boolean, isCorrect?: boolean): void {
    console.log('placePiece被调用:', { pieceId, isPlaced, isCorrect })
    this.gameStore.updatePiecePlacement(pieceId, isPlaced, isCorrect)
    this.saveGameState()
    
    // 检查游戏是否完成
    const isCompleted = this.gameStore.checkGameCompletion()
    console.log('游戏完成检查结果:', isCompleted)
    if (isCompleted) {
      // checkGameCompletion 已经处理了游戏完成逻辑，不需要再次调用 completeGame
      this.stopRealTimeTimer()
      
      // 更新用户统计
      console.log('准备更新用户统计:', {
        hasStartTime: !!this.gameStore.startTime,
        hasPuzzle: !!this.gameStore.currentPuzzle,
        puzzleId: this.gameStore.currentPuzzle?.id
      })
      if (this.gameStore.startTime && this.gameStore.currentPuzzle) {
        const gameTime = this.gameStore.calculateElapsedTime(this.gameStore.startTime, new Date())
        console.log('计算的游戏时间:', gameTime)
        this.updateUserStats(this.gameStore.currentPuzzle, gameTime)
      } else {
        console.log('无法更新用户统计：缺少开始时间或拼图数据')
      }
      
      this.saveGameState()
      
      console.log('游戏完成！')
    }
  }

  /**
   * 完成游戏
   */
  private completeGame(): void {
    if (!this.gameStore.isCompleted && this.gameStore.currentPuzzle) {
      const endTime = new Date()
      
      this.gameStore.completeGameState(endTime)
      this.stopRealTimeTimer()
      
      // 更新用户统计
      if (this.gameStore.startTime && endTime) {
        const gameTime = this.gameStore.calculateElapsedTime(this.gameStore.startTime, endTime)
        this.updateUserStats(this.gameStore.currentPuzzle, gameTime)
      }
      
      this.saveGameState()
      
      console.log('游戏完成！')
    }
  }

  /**
   * 更新用户统计数据
   */
  private updateUserStats(puzzleData: PuzzleData, gameTime: number): void {
    this.libraryStore.updateUserStats((userStats: UserStats) => {
      const puzzleId = puzzleData.id

      userStats.totalGamesPlayed++
      userStats.totalTimeSpent += gameTime

      // 更新最佳时间
      if (!userStats.bestTimes[puzzleId] || gameTime < userStats.bestTimes[puzzleId]) {
        userStats.bestTimes[puzzleId] = gameTime
      }
      
      return userStats
    })

    // 添加排行榜记录
    this.addLeaderboardRecord(puzzleData, gameTime)
  }

  /**
   * 添加排行榜记录
   */
  private addLeaderboardRecord(puzzleData: PuzzleData, gameTime: number): void {
    const leaderboardEntry = {
      playerName: '玩家', // 可以后续扩展为用户输入的名称
      puzzleId: puzzleData.id,
      completionTime: gameTime,
      moveCount: this.gameStore.moveCount,
      completedAt: Date.now()
    }

    this.libraryStore.addLeaderboardRecord(leaderboardEntry)
    console.log('排行榜记录已添加:', leaderboardEntry)
  }

  /**
   * 检查成就
   */
  checkAchievements(): boolean {
    return this.libraryStore.checkAchievements(this.libraryStore.userStats)
  }

  /**
   * 处理游戏完成（公共方法，供PuzzleBoard调用）
   */
  handleGameCompleted(): void {
    console.log('gameController: handleGameCompleted被调用')
    if (this.gameStore.startTime && this.gameStore.currentPuzzle) {
      const gameTime = this.gameStore.calculateElapsedTime(this.gameStore.startTime, new Date())
      console.log('gameController: 计算的游戏时间:', gameTime)
      this.updateUserStats(this.gameStore.currentPuzzle, gameTime)
      console.log('gameController: 用户统计和排行榜记录已更新')
    } else {
      console.log('gameController: 无法更新用户统计：缺少开始时间或拼图数据')
    }
  }

  /**
   * 保存游戏状态
   */
  private saveGameState(): void {
    if (this.gameStore.currentPuzzle) {
      this.gameStore.saveGameState(this.gameStore.currentPuzzle)
    }
  }

  /**
   * 开始实时计时器
   */
  private startRealTimeTimer(): void {
    if (this.timerInterval) return
    
    this.timerInterval = window.setInterval(() => {
      // 时间更新现在由 GameTimer 自动管理
    }, 1000)
  }

  /**
   * 停止实时计时器
   */
  private stopRealTimeTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
  }

  /**
   * 设置页面可见性监听
   */
  private setupVisibilityListener(): void {
    this.visibilityChangeHandler = () => {
      if (document.hidden) {
        if (this.gameStore.isGameActive && !this.gameStore.isCompleted) {
          console.log('页面隐藏，自动暂停游戏')
          this.pauseGame(true)
        }
      } else {
        console.log('页面重新可见')
        // 页面重新可见时，不自动恢复游戏，让用户手动恢复
        // 这样可以避免状态同步导致的拼图块位置混乱
        if (this.gameStore.isAutoPaused) {
          console.log('页面重新可见，游戏保持暂停状态，等待用户手动恢复')
        }
      }
    }
    
    document.addEventListener('visibilitychange', this.visibilityChangeHandler)
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.stopRealTimeTimer()
    
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler)
      this.visibilityChangeHandler = null
    }
  }

  /**
   * 清除当前游戏状态
   */
  clearCurrentGame(): void {
    // 停止所有计时器
    this.stopRealTimeTimer()
    
    // 重置游戏状态
    this.gameStore.resetGameState()
  }

  // Getter方法，提供对store状态的访问
  get currentPuzzle() {
    return this.gameStore.currentPuzzle
  }

  get pieces(): PieceStatus[] {
    return this.gameStore.pieces
  }

  get isGameActive() {
    return this.gameStore.isGameActive
  }

  get isCompleted() {
    return this.gameStore.isCompleted
  }

  get isPaused() {
    return this.gameStore.isPaused
  }

  get isAutoPaused() {
    return this.gameStore.isAutoPaused
  }

  get elapsedTime() {
    return this.gameStore.elapsedTime
  }

  get completionPercentage() {
    return this.gameStore.completionPercentage
  }

  get currentDifficulty() {
    return this.gameStore.currentDifficulty
  }

  get moveCount() {
    return this.gameStore.moveCount
  }

  get placedPieces() {
    return this.gameStore.placedPieces
  }

  get totalPieces() {
    return this.gameStore.totalPieces
  }
}
