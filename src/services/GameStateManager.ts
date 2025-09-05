/**
 * 游戏状态管理类
 * 负责处理游戏状态转换和生命周期管理
 */

import { ref } from 'vue'
import type { PuzzleData, UserStats } from '../types'

export class GameStateManager {
  private currentPuzzle = ref<PuzzleData | null>(null)
  private isCompleted = ref(false)
  private isGameActive = ref(false)
  private isPaused = ref(false)
  private isAutoPaused = ref(false)
  private isRestarting = ref(true)
  private gameSessionId = ref<string | null>(null)
  private userStats = ref<UserStats>({
    totalGamesPlayed: 0,
    totalTimeSpent: 0,
    bestTimes: {},
    achievements: [],
    totalSuccessMovements: 0
  })

  /**
   * 初始化新游戏
   */
  initializeNewGame(data: {
    puzzleData: PuzzleData
    pieces: any[]
    startTime: Date
    sessionId: string
  }): void {
    this.currentPuzzle.value = data.puzzleData
    this.startTime.value = data.startTime
    this.endTime.value = null
    this.isCompleted.value = false
    this.isGameActive.value = true
    this.isPaused.value = false
    this.isAutoPaused.value = false
    this.isRestarting.value = false
    this.gameSessionId.value = data.sessionId
    this.moveCount.value = 0
  }

  /**
   * 恢复游戏状态
   */
  restoreGameState(data: {
    puzzleData: PuzzleData
    pieces: any[]
    startTime: Date
    endTime?: Date
    moveCount: number
    sessionId: string
    isPaused?: boolean
  }): void {
    this.currentPuzzle.value = data.puzzleData
    this.startTime.value = data.startTime
    this.endTime.value = data.endTime || null
    this.moveCount.value = data.moveCount
    this.isCompleted.value = !!data.endTime
    this.isGameActive.value = !data.endTime
    this.isPaused.value = data.isPaused || false
    this.isAutoPaused.value = false
    this.isRestarting.value = false
    this.gameSessionId.value = data.sessionId
  }

  /**
   * 暂停游戏
   */
  pauseGame(autoPause: boolean = false): void {
    this.isPaused.value = true
    this.isAutoPaused.value = autoPause
    this.isGameActive.value = false
  }

  /**
   * 恢复游戏
   */
  resumeGame(): void {
    this.isPaused.value = false
    this.isAutoPaused.value = false
    this.isGameActive.value = true
  }

  /**
   * 完成游戏
   */
  completeGame(completionTime: Date): void {
    this.endTime.value = completionTime
    this.isCompleted.value = true
    this.isGameActive.value = false
    this.isPaused.value = false
    this.isAutoPaused.value = false
  }

  /**
   * 重置游戏状态
   */
  resetGameState(): void {
    this.currentPuzzle.value = null
    this.startTime.value = null
    this.endTime.value = null
    this.moveCount.value = 0
    this.isCompleted.value = false
    this.isGameActive.value = false
    this.isPaused.value = false
    this.isAutoPaused.value = false
    this.gameSessionId.value = null
    this.isRestarting.value = true
  }

  /**
   * 增加移动次数
   */
  incrementMoveCount(): void {
    this.moveCount.value++
  }

  /**
   * 设置重启状态
   */
  setRestarting(isRestarting: boolean): void {
    this.isRestarting.value = isRestarting
  }

  /**
   * 生成会话ID
   */
  generateSessionId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Getter 方法
  get currentPuzzleValue() {
    return this.currentPuzzle.value
  }

  get isCompletedValue() {
    return this.isCompleted.value
  }

  get isGameActiveValue() {
    return this.isGameActive.value
  }

  get isPausedValue() {
    return this.isPaused.value
  }

  get isAutoPausedValue() {
    return this.isAutoPaused.value
  }

  get isRestartingValue() {
    return this.isRestarting.value
  }

  get gameSessionIdValue() {
    return this.gameSessionId.value
  }

  get userStatsValue() {
    return this.userStats.value
  }

  get moveCountValue() {
    return this.moveCount.value
  }

  get startTimeValue() {
    return this.startTime.value
  }

  get endTimeValue() {
    return this.endTime.value
  }

  // 私有属性
  private startTime = ref<Date | null>(null)
  private endTime = ref<Date | null>(null)
  private moveCount = ref(0)
}
