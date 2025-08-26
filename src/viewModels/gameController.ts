/**
 * 游戏核心 ViewModel
 * 处理与界面相关的游戏业务逻辑，持有 store 实例
 */

import { useGameStore } from '../stores/game'
import { useLibraryStore } from '../stores/library'
import type { PiecePosition, PuzzleData, UserStats } from '../types'

/**
 * 游戏核心控制器 - 处理游戏业务逻辑，持有store实例
 */
export class GameController {
  // Store实例
  private gameStore = useGameStore()
  private libraryStore = useLibraryStore()
  
  // 计时器管理
  private timerInterval: number | null = null
  private visibilityChangeHandler: (() => void) | null = null

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
      this.gameStore.restoreGameState({
        puzzleData,
        pieces: existingState.pieces,
        startTime: new Date(existingState.startTime),
        moveCount: existingState.moveCount,
        isCompleted: existingState.isCompleted,
        isPaused: existingState.isPaused,
        isAutoPaused: existingState.isAutoPaused || false,
        gameSessionId: existingState.sessionId
      })
      
      this.gameStore.resetPauseTime()
      
      if (!existingState.isPaused) {
        this.startRealTimeTimer()
      }
      
      console.log('恢复现有游戏状态')
    } else {
      // 开始新游戏
      const initialPieces = this.gameStore.generateInitialPieces(puzzleData)
      const startTime = this.gameStore.startTimer()
      const sessionId = this.gameStore.generateSessionId()
      
      this.gameStore.initializeNewGame({
        puzzleData,
        pieces: initialPieces,
        startTime,
        gameSessionId: sessionId
      })
      
      this.startRealTimeTimer()
      
      console.log('开始新游戏')
    }

    this.gameStore.isRestarting = false;
    
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
      this.gameStore.pauseTimer()
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
      this.gameStore.resumeTimer()
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
      // 重置游戏状态
      this.gameStore.resetGameState()
      this.startNewGame(this.gameStore.currentPuzzle, true)
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
      this.saveGameState()
    }
  }

  /**
   * 放置拼图块
   */
  placePiece(pieceId: string, isPlaced: boolean): void {
    this.gameStore.updatePiecePlacement(pieceId, isPlaced)
    this.saveGameState()
    
    // 检查游戏是否完成
    if (this.gameStore.checkCompletion(this.gameStore.pieces.length)) {
      this.completeGame()
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
   * 获取拼图块的正确位置
   */
  getCorrectPositionForPiece(pieceId: string): { row: number, col: number } | null {
    return this.gameStore.getCorrectPositionForPiece(pieceId)
  }

  /**
   * 检查指定位置是否有拼图块
   */
  isPieceAtPosition(row: number, col: number, excludePieceId?: string): boolean {
    if (!this.gameStore.currentPuzzle) return false
    
    return this.gameStore.isPieceAtPosition(
      row, 
      col, 
      this.gameStore.currentPuzzle.gridConfig, 
      excludePieceId
    )
  }

  /**
   * 拼图块吸附到网格
   */
  snapPieceToGrid(pieceId: string, gridRow: number, gridCol: number): void {
    if (this.gameStore.currentPuzzle) {
      this.gameStore.snapPieceToGrid(
        pieceId, 
        gridRow, 
        gridCol, 
        this.gameStore.currentPuzzle.gridConfig
      )
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
  }

  /**
   * 检查成就
   */
  checkAchievements(): boolean {
    return this.libraryStore.checkAchievements(this.libraryStore.userStats)
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
      this.gameStore.updateCurrentTime()
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

  // Getter方法，提供对store状态的访问
  get currentPuzzle() {
    return this.gameStore.currentPuzzle
  }

  get pieces(): PiecePosition[] {
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
}
