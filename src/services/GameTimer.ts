/**
 * 游戏计时器管理类
 * 负责处理游戏时间相关的所有逻辑
 * 支持每个拼图独立计时，暂停时不计时
 */

import { ref, computed } from 'vue'

export class GameTimer {
  private startTime = ref<Date | null>(null)
  private endTime = ref<Date | null>(null)
  private pauseStartTime = ref<Date | null>(null)
  private totalPauseTime = ref<number>(0)
  private updateTrigger = ref<number>(0)
  private updateInterval: NodeJS.Timeout | null = null
  private isPaused = ref<boolean>(false)
  private puzzleId = ref<string | null>(null)

  /**
   * 开始计时
   */
  startTimer(puzzleId: string): Date {
    const now = new Date()
    this.startTime.value = now
    this.endTime.value = null
    this.totalPauseTime.value = 0
    this.pauseStartTime.value = null
    this.isPaused.value = false
    this.puzzleId.value = puzzleId
    this.startUpdateLoop()
    return now
  }

  /**
   * 暂停计时
   */
  pauseTimer() {
    if (this.startTime.value && !this.pauseStartTime.value && !this.isPaused.value) {
      this.pauseStartTime.value = new Date()
      this.isPaused.value = true
      // 暂停时停止更新循环
      this.stopUpdateLoop()
    }
  }

  /**
   * 恢复计时
   */
  resumeTimer() {
    if (this.pauseStartTime.value && this.isPaused.value) {
      const pauseDuration = Date.now() - this.pauseStartTime.value.getTime()
      this.totalPauseTime.value += pauseDuration
      this.pauseStartTime.value = null
      this.isPaused.value = false
      // 恢复时重新启动更新循环
      this.startUpdateLoop()
    }
  }

  /**
   * 计算经过时间（秒）
   */
  calculateElapsedTime(startTime: Date, endTime?: Date | null): number {
    const end = endTime || new Date()
    const totalTime = end.getTime() - startTime.getTime()
    const actualPlayTime = totalTime - this.totalPauseTime.value
    
    // 如果当前正在暂停，减去当前暂停时间
    if (this.pauseStartTime.value && this.isPaused.value) {
      const currentPauseTime = Date.now() - this.pauseStartTime.value.getTime()
      return Math.max(0, (actualPlayTime - currentPauseTime) / 1000)
    }
    
    return Math.max(0, actualPlayTime / 1000)
  }

  /**
   * 获取经过时间（秒）
   */
  get elapsedTime(): number {
    // 使用 updateTrigger 来触发响应式更新
    this.updateTrigger.value
    if (!this.startTime.value) return 0
    return this.calculateElapsedTime(this.startTime.value, this.endTime.value)
  }

  /**
   * 重置暂停时间
   */
  resetPauseTime(): void {
    this.totalPauseTime.value = 0
    this.pauseStartTime.value = null
  }

  /**
   * 获取开始时间
   */
  get startTimeValue(): Date | null {
    return this.startTime.value
  }

  /**
   * 获取结束时间
   */
  get endTimeValue(): Date | null {
    return this.endTime.value
  }

  /**
   * 获取总暂停时间
   */
  get totalPauseTimeValue(): number {
    return this.totalPauseTime.value
  }

  /**
   * 获取暂停开始时间
   */
  get pauseStartTimeValue(): Date | null {
    return this.pauseStartTime.value
  }

  /**
   * 获取当前拼图ID
   */
  get currentPuzzleId(): string | null {
    return this.puzzleId.value
  }

  /**
   * 获取暂停状态
   */
  get paused(): boolean {
    return this.isPaused.value
  }

  /**
   * 检查是否为指定拼图的计时器
   */
  isForPuzzle(puzzleId: string): boolean {
    return this.puzzleId.value === puzzleId
  }

  /**
   * 停止当前拼图的计时（退出拼图时调用）
   */
  stopCurrentPuzzle(): void {
    this.stopUpdateLoop()
    this.isPaused.value = false
    this.pauseStartTime.value = null
    // 注意：不重置 startTime 和 totalPauseTime，保持历史记录
  }

  /**
   * 设置结束时间
   */
  setEndTime(endTime: Date): void {
    this.endTime.value = endTime
    this.stopUpdateLoop()
  }

  /**
   * 恢复计时器状态（用于页面刷新后恢复）
   */
  restoreTimerState(startTime: Date, endTime?: Date | null, totalPauseTime: number = 0, pauseStartTime?: Date | null, isPaused: boolean = false, puzzleId?: string): void {
    this.startTime.value = startTime
    this.endTime.value = endTime || null
    this.totalPauseTime.value = totalPauseTime
    this.pauseStartTime.value = pauseStartTime || null
    this.isPaused.value = isPaused
    this.puzzleId.value = puzzleId || null
    
    // 如果游戏还在进行中（没有结束时间）且未暂停，启动更新循环
    if (!endTime && !isPaused) {
      this.startUpdateLoop()
    }
  }

  /**
   * 开始时间更新循环
   */
  private startUpdateLoop(): void {
    // 清除之前的定时器
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }
    
    // 每秒更新一次触发器，触发响应式更新
    // 只在游戏进行中且未暂停时更新
    this.updateInterval = setInterval(() => {
      if (this.startTime.value && !this.endTime.value && !this.isPaused.value) {
        this.updateTrigger.value = Date.now()
      }
    }, 1000)
  }

  /**
   * 停止时间更新循环
   */
  private stopUpdateLoop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.stopUpdateLoop()
    this.startTime.value = null
    this.endTime.value = null
    this.pauseStartTime.value = null
    this.totalPauseTime.value = 0
    this.isPaused.value = false
    this.puzzleId.value = null
  }
}
