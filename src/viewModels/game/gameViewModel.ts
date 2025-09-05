/**
 * 游戏视图 ViewModel
 * 处理 GameView 组件的界面业务逻辑，持有 GameController 实例
 */

import { ref } from 'vue'
import type { PuzzleData, Achievement } from '../../types'
import { useLibraryStore } from '../../stores/library'
import { GameController } from './gameController'

/**
 * 游戏视图管理器
 */
export class GameViewModel {
  // 移除构造函数中的store获取，改为在需要时获取
  readonly gameController: GameController

  // 界面状态
  public showCompletionModal = ref(false)
  public showSettingsModal = ref(false)
  public newAchievements = ref<Achievement[]>([])

  // 游戏设置（界面相关）
  public gameSettings = ref({
    showBackground: true,
    showGrid: true,
    autoSnap: true,
    showTimer: true,
    soundVolume: 70
  })

  private constructor() {
    this.gameController = new GameController()
    this.loadSettings()
  }

  static instance: GameViewModel
  static getInstance() {
    if (!GameViewModel.instance) {
      GameViewModel.instance = new GameViewModel()
    }
    return GameViewModel.instance
  }

  /**
   * 获取libraryStore实例
   */
  private get libraryStore() {
    return useLibraryStore()
  }

  /**
   * 从路由加载拼图
   */
  async loadPuzzleFromRoute(puzzleId: string): Promise<void> {
    if (!puzzleId) return

    // 从素材库查找拼图
    const libraryItem = this.libraryStore.items.find(item => item.id === puzzleId)
    if (libraryItem) {
      // 创建拼图数据
      const puzzleData: PuzzleData = {
        id: libraryItem.id,
        name: libraryItem.name,
        imageUrl: libraryItem.imageUrl,
        gridConfig: {
          rows: 3,
          cols: 4,
          pieceWidth: 150,
          pieceHeight: 100
        },
        boundaries: [], // 简单的边界数据
        createdAt: new Date(),
        difficulty: libraryItem.difficulty
      }
      
      // 开始新游戏，允许恢复现有游戏状态
      console.debug("[startNewGame]", puzzleData.id, puzzleData.name)
      this.gameController.startNewGame(puzzleData, false)
    }
  }

  /**
   * 处理游戏完成事件
   */
  handleGameCompleted(): void {
    this.showCompletionModal.value = true
    
    // 检查新解锁的成就
    const hasNewAchievements = this.gameController.checkAchievements()
    if (hasNewAchievements) {
      this.newAchievements.value = this.libraryStore.unlockedAchievements.filter(
        achievement => achievement.unlockedAt && 
        Date.now() - achievement.unlockedAt < 1000
      )
    }
    
    // 播放完成音效
    if (this.gameSettings.value.soundVolume > 0) {
      this.playSound('complete')
    }
  }

  /**
   * 处理拼图块放置事件
   */
  handlePiecePlaced(pieceId: string, row: number, col: number): void {
    console.log(`拼图块 ${pieceId} 放置到 (${row}, ${col})`)
    
    // 播放放置音效
    if (this.gameSettings.value.soundVolume > 0) {
      this.playSound('place')
    }
  }

  /**
   * 再玩一次
   */
  playAgain(): void {
    if (this.gameController.currentPuzzle) {
      this.gameController.restartGame()
      this.closeCompletionModal()
    }
  }

  /**
   * 重置游戏
   */
  resetGame(): void {
    if (this.gameController.currentPuzzle) {
      this.gameController.restartGame()
      this.closeCompletionModal()
      this.closeSettingsModal()
    }
  }

  /**
   * 暂停游戏
   */
  pauseGame(): void {
    this.gameController.pauseGame()
  }

  /**
   * 恢复游戏
   */
  resumeGame(): void {
    this.gameController.resumeGame()
  }

  /**
   * 关闭完成对话框
   */
  closeCompletionModal(): void {
    this.showCompletionModal.value = false
    this.newAchievements.value = []
  }

  /**
   * 打开设置对话框
   */
  openSettingsModal(): void {
    this.showSettingsModal.value = true
  }

  /**
   * 关闭设置对话框
   */
  closeSettingsModal(): void {
    this.showSettingsModal.value = false
  }

  /**
   * 保存设置
   */
  saveSettings(): void {
    localStorage.setItem('game_settings', JSON.stringify(this.gameSettings.value))
    this.closeSettingsModal()
  }

  /**
   * 重置设置
   */
  resetSettings(): void {
    this.gameSettings.value = {
      showBackground: true,
      showGrid: true,
      autoSnap: true,
      showTimer: true,
      soundVolume: 70
    }
  }

  /**
   * 加载设置
   */
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('game_settings')
      if (saved) {
        Object.assign(this.gameSettings.value, JSON.parse(saved))
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  }

  /**
   * 播放音效
   */
  playSound(type: 'place' | 'complete'): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      const volume = this.gameSettings.value.soundVolume / 100 * 0.1
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
      
      if (type === 'place') {
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1)
      } else if (type === 'complete') {
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2)
      }
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.warn('无法播放音效:', error)
    }
  }

  /**
   * 格式化时间显示
   */
  formatTime(seconds: number): string {
    // 取整数秒数，去掉小数
    const totalSeconds = Math.floor(seconds)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * 处理路由变化时的游戏暂停逻辑
   */
  handleRouteChange(newPath: string, oldPath: string | undefined): void {
    // 如果从游戏页面切换到其他页面，且游戏正在运行，则自动暂停
    if (oldPath && oldPath.startsWith('/game') && !newPath.startsWith('/game')) {
      if (this.gameController.isGameActive && !this.gameController.isCompleted && !this.gameController.isPaused) {
        console.log('离开游戏页面，自动暂停游戏')
        this.gameController.pauseGame(true) // 标记为自动暂停
      }
    }
  }

  /**
   * 处理组件卸载时的游戏暂停逻辑
   */
  handleComponentUnmount(): void {
    // 组件卸载时自动暂停游戏
    if (this.gameController.isGameActive && !this.gameController.isCompleted && !this.gameController.isPaused) {
      console.log('组件卸载，自动暂停游戏')
      this.gameController.pauseGame(true) // 标记为自动暂停
    }
    
    this.cleanup()
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.gameController.cleanup()
  }

  /**
   * 清除当前游戏状态
   */
  clearCurrentGame(): void {
    if (this.gameController.currentPuzzle) {
      // 清除游戏控制器状态
      this.gameController.clearCurrentGame()
      
      // 关闭所有模态框
      this.showCompletionModal.value = false
      this.showSettingsModal.value = false
      this.newAchievements.value = []
      
      console.log('游戏状态已清除')
    }
  }

  // Getter方法，提供对gameController状态的访问
  get currentPuzzle() {
    return this.gameController.currentPuzzle
  }

  get pieces() {
    return this.gameController.pieces
  }

  get isGameActive() {
    return this.gameController.isGameActive
  }

  get isCompleted() {
    return this.gameController.isCompleted
  }

  get isPaused() {
    return this.gameController.isPaused
  }

  get isAutoPaused() {
    return this.gameController.isAutoPaused
  }

  get elapsedTime() {
    return this.gameController.elapsedTime
  }

  get completionPercentage() {
    return this.gameController.completionPercentage
  }

  get currentDifficulty() {
    return this.gameController.currentDifficulty
  }

  get moveCount() {
    return this.gameController.moveCount
  }
}
