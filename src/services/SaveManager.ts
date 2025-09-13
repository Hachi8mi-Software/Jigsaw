/**
 * 存档管理器
 * 负责管理多个存档槽位，每个存档独立存储游戏数据
 */

import type { UserStats, LeaderboardEntry, LibraryItem, Achievement } from '../types'
import type { AppSettings } from '../stores/settings'

export interface SaveSlot {
  id: string
  name: string
  createdAt: string
  lastPlayedAt: string
  totalGamesPlayed: number
  totalTimeSpent: number
  achievementsUnlocked: number
  customPuzzlesCount: number
}

export interface SaveSlotData {
  settings: AppSettings
  userStats: UserStats
  leaderboardRecords: LeaderboardEntry[]
  customPuzzles: LibraryItem[]
  achievements: Achievement[]
  gameStates: Record<string, any> // 游戏状态数据
}

export class SaveManager {
  private readonly MAX_SAVE_SLOTS = 10
  private readonly DEFAULT_SLOT_ID = 'default'
  private readonly CURRENT_SLOT_KEY = 'current_save_slot'
  private readonly SAVE_SLOTS_KEY = 'save_slots_info'
  
  private currentSlotId: string = this.DEFAULT_SLOT_ID
  private saveSlots: SaveSlot[] = []

  constructor() {
    this.loadSaveSlotsInfo()
    this.loadCurrentSlot()
  }

  /**
   * 获取当前存档槽位ID
   */
  getCurrentSlotId(): string {
    return this.currentSlotId
  }

  /**
   * 获取存档槽位前缀
   */
  getSlotPrefix(slotId: string = this.currentSlotId): string {
    return slotId === this.DEFAULT_SLOT_ID ? '' : `save_${slotId}_`
  }

  /**
   * 生成带前缀的存储键
   */
  getStorageKey(key: string, slotId?: string): string {
    const prefix = this.getSlotPrefix(slotId)
    return `${prefix}${key}`
  }

  /**
   * 获取所有存档槽位信息
   */
  getSaveSlots(): SaveSlot[] {
    return [...this.saveSlots]
  }

  /**
   * 获取当前存档槽位信息
   */
  getCurrentSlot(): SaveSlot | null {
    return this.saveSlots.find(slot => slot.id === this.currentSlotId) || null
  }

  /**
   * 切换存档槽位
   */
  switchToSlot(slotId: string): boolean {
    if (!this.saveSlots.find(slot => slot.id === slotId)) {
      console.error(`存档槽位 ${slotId} 不存在`)
      return false
    }

    this.currentSlotId = slotId
    this.saveCurrentSlot()
    console.log(`已切换到存档槽位: ${slotId}`)
    return true
  }

  /**
   * 创建新存档槽位
   */
  createNewSlot(name: string): string | null {
    if (this.saveSlots.length >= this.MAX_SAVE_SLOTS) {
      console.error('存档槽位数量已达上限')
      return null
    }

    const slotId = `slot${Date.now()}`
    const newSlot: SaveSlot = {
      id: slotId,
      name,
      createdAt: new Date().toISOString(),
      lastPlayedAt: new Date().toISOString(),
      totalGamesPlayed: 0,
      totalTimeSpent: 0,
      achievementsUnlocked: 0,
      customPuzzlesCount: 0
    }

    this.saveSlots.push(newSlot)
    this.saveSaveSlotsInfo()
    
    // 初始化新存档的数据
    this.initializeSlotData(slotId)
    
    console.log(`创建新存档槽位: ${name} (${slotId})`)
    return slotId
  }

  /**
   * 删除存档槽位
   */
  deleteSlot(slotId: string): boolean {
    if (slotId === this.DEFAULT_SLOT_ID) {
      console.error('不能删除默认存档槽位')
      return false
    }

    const slotIndex = this.saveSlots.findIndex(slot => slot.id === slotId)
    if (slotIndex === -1) {
      console.error(`存档槽位 ${slotId} 不存在`)
      return false
    }

    // 删除该存档的所有数据
    this.clearSlotData(slotId)
    
    // 从列表中移除
    this.saveSlots.splice(slotIndex, 1)
    this.saveSaveSlotsInfo()

    // 如果删除的是当前槽位，切换到默认槽位
    if (this.currentSlotId === slotId) {
      this.switchToSlot(this.DEFAULT_SLOT_ID)
    }

    console.log(`删除存档槽位: ${slotId}`)
    return true
  }

  /**
   * 重命名存档槽位
   */
  renameSlot(slotId: string, newName: string): boolean {
    const slot = this.saveSlots.find(slot => slot.id === slotId)
    if (!slot) {
      console.error(`存档槽位 ${slotId} 不存在`)
      return false
    }

    slot.name = newName
    this.saveSaveSlotsInfo()
    console.log(`重命名存档槽位: ${slotId} -> ${newName}`)
    return true
  }

  /**
   * 复制存档槽位
   */
  copySlot(sourceSlotId: string, newName: string): string | null {
    if (this.saveSlots.length >= this.MAX_SAVE_SLOTS) {
      console.error('存档槽位数量已达上限')
      return null
    }

    const sourceSlot = this.saveSlots.find(slot => slot.id === sourceSlotId)
    if (!sourceSlot) {
      console.error(`源存档槽位 ${sourceSlotId} 不存在`)
      return null
    }

    const newSlotId = `slot${Date.now()}`
    const newSlot: SaveSlot = {
      id: newSlotId,
      name: newName,
      createdAt: new Date().toISOString(),
      lastPlayedAt: new Date().toISOString(),
      totalGamesPlayed: sourceSlot.totalGamesPlayed,
      totalTimeSpent: sourceSlot.totalTimeSpent,
      achievementsUnlocked: sourceSlot.achievementsUnlocked,
      customPuzzlesCount: sourceSlot.customPuzzlesCount
    }

    this.saveSlots.push(newSlot)
    this.saveSaveSlotsInfo()

    // 复制数据
    this.copySlotData(sourceSlotId, newSlotId)
    
    console.log(`复制存档槽位: ${sourceSlotId} -> ${newSlotId}`)
    return newSlotId
  }

  /**
   * 更新存档槽位统计信息
   */
  updateSlotStats(stats: Partial<SaveSlot>): void {
    const slot = this.saveSlots.find(slot => slot.id === this.currentSlotId)
    if (slot) {
      Object.assign(slot, stats)
      slot.lastPlayedAt = new Date().toISOString()
      this.saveSaveSlotsInfo()
    }
  }

  /**
   * 动态计算存档槽位的统计信息
   */
  calculateSlotStats(slotId: string): Partial<SaveSlot> {
    try {
      // 获取用户统计数据
      const userStats = this.loadSlotUserStats(slotId)
      const leaderboardRecords = this.loadSlotLeaderboardRecords(slotId)
      const achievements = this.loadSlotAchievements(slotId)
      const customPuzzles = this.loadSlotCustomPuzzles(slotId)

      // 计算游戏次数（从排行榜记录统计）
      const totalGamesPlayed = leaderboardRecords.length

      // 计算总游戏时长（从排行榜记录统计）
      const totalTimeSpent = leaderboardRecords.reduce((total, record) => total + record.completionTime, 0)

      // 计算解锁成就数量
      const achievementsUnlocked = achievements.filter(achievement => achievement.unlockedAt).length

      // 计算自定义拼图数量
      const customPuzzlesCount = customPuzzles.length

      return {
        totalGamesPlayed,
        totalTimeSpent,
        achievementsUnlocked,
        customPuzzlesCount
      }
    } catch (error) {
      console.error('计算存档统计信息失败:', error)
      return {
        totalGamesPlayed: 0,
        totalTimeSpent: 0,
        achievementsUnlocked: 0,
        customPuzzlesCount: 0
      }
    }
  }

  /**
   * 刷新所有存档槽位的统计信息
   */
  refreshAllSlotStats(): void {
    this.saveSlots.forEach(slot => {
      const stats = this.calculateSlotStats(slot.id)
      Object.assign(slot, stats)
    })
    this.saveSaveSlotsInfo()
  }

  /**
   * 刷新指定存档槽位的统计信息
   */
  refreshSlotStats(slotId: string): void {
    const slot = this.saveSlots.find(slot => slot.id === slotId)
    if (slot) {
      const stats = this.calculateSlotStats(slotId)
      Object.assign(slot, stats)
      this.saveSaveSlotsInfo()
    }
  }

  /**
   * 导出存档数据
   */
  exportSlotData(slotId: string): string | null {
    try {
      const data: SaveSlotData = {
        settings: this.loadSlotSettings(slotId),
        userStats: this.loadSlotUserStats(slotId),
        leaderboardRecords: this.loadSlotLeaderboardRecords(slotId),
        customPuzzles: this.loadSlotCustomPuzzles(slotId),
        achievements: this.loadSlotAchievements(slotId),
        gameStates: this.loadSlotGameStates(slotId)
      }

      const slot = this.saveSlots.find(slot => slot.id === slotId)
      const exportData = {
        slotInfo: slot,
        slotData: data,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      }

      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('导出存档数据失败:', error)
      return null
    }
  }

  /**
   * 导入存档数据
   */
  importSlotData(jsonData: string, slotId?: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      if (!data.slotData) {
        console.error('无效的存档数据格式')
        return false
      }

      const targetSlotId = slotId || `slot${Date.now()}`
      
      // 创建新槽位或使用现有槽位
      if (!slotId) {
        const slotName = data.slotInfo?.name || `导入存档 ${new Date().toLocaleDateString()}`
        const newSlotId = this.createNewSlot(slotName)
        if (!newSlotId) return false
        slotId = newSlotId
      }

      // 导入数据
      this.saveSlotSettings(slotId, data.slotData.settings)
      this.saveSlotUserStats(slotId, data.slotData.userStats)
      this.saveSlotLeaderboardRecords(slotId, data.slotData.leaderboardRecords)
      this.saveSlotCustomPuzzles(slotId, data.slotData.customPuzzles)
      this.saveSlotAchievements(slotId, data.slotData.achievements)
      this.saveSlotGameStates(slotId, data.slotData.gameStates)

      console.log(`导入存档数据到槽位: ${slotId}`)
      return true
    } catch (error) {
      console.error('导入存档数据失败:', error)
      return false
    }
  }

  // 私有方法

  private loadSaveSlotsInfo(): void {
    try {
      const saved = localStorage.getItem(this.SAVE_SLOTS_KEY)
      if (saved) {
        this.saveSlots = JSON.parse(saved)
      } else {
        // 初始化默认存档槽位
        this.saveSlots = [{
          id: this.DEFAULT_SLOT_ID,
          name: '默认存档',
          createdAt: new Date().toISOString(),
          lastPlayedAt: new Date().toISOString(),
          totalGamesPlayed: 0,
          totalTimeSpent: 0,
          achievementsUnlocked: 0,
          customPuzzlesCount: 0
        }]
        this.saveSaveSlotsInfo()
      }
    } catch (error) {
      console.error('加载存档槽位信息失败:', error)
      this.saveSlots = []
    }
  }

  private saveSaveSlotsInfo(): void {
    try {
      localStorage.setItem(this.SAVE_SLOTS_KEY, JSON.stringify(this.saveSlots))
    } catch (error) {
      console.error('保存存档槽位信息失败:', error)
    }
  }

  private loadCurrentSlot(): void {
    try {
      const saved = localStorage.getItem(this.CURRENT_SLOT_KEY)
      if (saved && this.saveSlots.find(slot => slot.id === saved)) {
        this.currentSlotId = saved
      }
    } catch (error) {
      console.error('加载当前存档槽位失败:', error)
    }
  }

  private saveCurrentSlot(): void {
    try {
      localStorage.setItem(this.CURRENT_SLOT_KEY, this.currentSlotId)
    } catch (error) {
      console.error('保存当前存档槽位失败:', error)
    }
  }

  private initializeSlotData(slotId: string): void {
    // 初始化默认设置
    const defaultSettings: AppSettings = {
      game: {
        showBackground: true,
        showGrid: true,
        autoSnap: true,
        enableRotation: false,
        showNumbers: true,
        difficulty: 'easy'
      },
      ui: {
        theme: 'light',
        language: 'zh-CN',
        animations: 'full'
      },
      audio: {
        masterVolume: 70,
        soundEffects: 80,
        enableSounds: true,
        enableBackgroundMusic: false,
        backgroundMusicVolume: 50
      },
      performance: {
        renderQuality: 'high',
        maxPieces: 1000
      }
    }

    const defaultUserStats: UserStats = {
      totalGamesPlayed: 0,
      totalTimeSpent: 0,
      bestTimes: {},
      achievements: [],
      totalSuccessMovements: 0
    }

    this.saveSlotSettings(slotId, defaultSettings)
    this.saveSlotUserStats(slotId, defaultUserStats)
    this.saveSlotLeaderboardRecords(slotId, [])
    this.saveSlotCustomPuzzles(slotId, [])
    this.saveSlotAchievements(slotId, [])
    this.saveSlotGameStates(slotId, {})
  }

  private clearSlotData(slotId: string): void {
    const prefix = this.getSlotPrefix(slotId)
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  private copySlotData(sourceSlotId: string, targetSlotId: string): void {
    const sourcePrefix = this.getSlotPrefix(sourceSlotId)
    const targetPrefix = this.getSlotPrefix(targetSlotId)
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(sourcePrefix)) {
        const value = localStorage.getItem(key)
        if (value) {
          const newKey = key.replace(sourcePrefix, targetPrefix)
          localStorage.setItem(newKey, value)
        }
      }
    }
  }

  // 数据加载和保存方法
  private loadSlotSettings(slotId: string): AppSettings {
    const key = this.getStorageKey('app_settings', slotId)
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : null
  }

  private saveSlotSettings(slotId: string, settings: AppSettings): void {
    const key = this.getStorageKey('app_settings', slotId)
    localStorage.setItem(key, JSON.stringify(settings))
  }

  private loadSlotUserStats(slotId: string): UserStats {
    const key = this.getStorageKey('user_stats', slotId)
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : null
  }

  private saveSlotUserStats(slotId: string, stats: UserStats): void {
    const key = this.getStorageKey('user_stats', slotId)
    localStorage.setItem(key, JSON.stringify(stats))
  }

  private loadSlotLeaderboardRecords(slotId: string): LeaderboardEntry[] {
    const key = this.getStorageKey('leaderboard_records', slotId)
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : []
  }

  private saveSlotLeaderboardRecords(slotId: string, records: LeaderboardEntry[]): void {
    const key = this.getStorageKey('leaderboard_records', slotId)
    localStorage.setItem(key, JSON.stringify(records))
  }

  private loadSlotCustomPuzzles(slotId: string): LibraryItem[] {
    const key = this.getStorageKey('custom_puzzles', slotId)
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : []
  }

  private saveSlotCustomPuzzles(slotId: string, puzzles: LibraryItem[]): void {
    const key = this.getStorageKey('custom_puzzles', slotId)
    localStorage.setItem(key, JSON.stringify(puzzles))
  }

  private loadSlotAchievements(slotId: string): Achievement[] {
    const key = this.getStorageKey('achievements', slotId)
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : []
  }

  private saveSlotAchievements(slotId: string, achievements: Achievement[]): void {
    const key = this.getStorageKey('achievements', slotId)
    localStorage.setItem(key, JSON.stringify(achievements))
  }

  private loadSlotGameStates(slotId: string): Record<string, any> {
    const prefix = this.getSlotPrefix(slotId)
    const gameStates: Record<string, any> = {}
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix) && key.includes('puzzle_game_state_')) {
        const value = localStorage.getItem(key)
        if (value) {
          const puzzleId = key.replace(prefix, '').replace('puzzle_game_state_', '')
          gameStates[puzzleId] = JSON.parse(value)
        }
      }
    }
    
    return gameStates
  }

  private saveSlotGameStates(slotId: string, gameStates: Record<string, any>): void {
    Object.entries(gameStates).forEach(([puzzleId, state]) => {
      const key = this.getStorageKey(`puzzle_game_state_${puzzleId}`, slotId)
      localStorage.setItem(key, JSON.stringify(state))
    })
  }
}

// 导出单例实例
export const saveManager = new SaveManager()
