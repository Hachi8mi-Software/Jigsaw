/**
 * 游戏持久化管理类
 * 负责游戏状态的保存和加载
 */

import type { PuzzleData } from '../types'
import { saveManager } from './SaveManager'

export class GamePersistence {
  private readonly STORAGE_KEY_PREFIX = 'puzzle_game_state_'

  /**
   * 生成会话ID
   */
  generateSessionId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 保存游戏状态
   */
  saveGameState(puzzleData: PuzzleData, gameState: any): void {
    try {
      const gameStateData = {
        puzzleId: puzzleData.id,
        puzzleData,
        pieces: gameState.pieces,
        startTime: gameState.startTime,
        endTime: gameState.endTime,
        moveCount: gameState.moveCount,
        sessionId: gameState.sessionId,
        totalPauseTime: gameState.totalPauseTime || 0,
        pauseStartTime: gameState.pauseStartTime,
        isPaused: gameState.isPaused,
        savedAt: new Date().toISOString()
      }

      const key = saveManager.getStorageKey(`${this.STORAGE_KEY_PREFIX}${puzzleData.id}`)
      localStorage.setItem(key, JSON.stringify(gameStateData))
      
      console.log('游戏状态已保存:', puzzleData.id)
    } catch (error) {
      console.error('保存游戏状态失败:', error)
    }
  }

  /**
   * 加载游戏状态
   */
  loadGameState(puzzleId: string): any | null {
    try {
      const key = saveManager.getStorageKey(`${this.STORAGE_KEY_PREFIX}${puzzleId}`)
      const saved = localStorage.getItem(key)
      
      if (saved) {
        const gameStateData = JSON.parse(saved)
        
        // 检查保存时间，如果超过24小时则清除
        const savedAt = new Date(gameStateData.savedAt)
        const now = new Date()
        const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60)
        
        if (hoursDiff > 24) {
          this.clearGameState(puzzleId)
          return null
        }
        
        return gameStateData
      }
      
      return null
    } catch (error) {
      console.error('加载游戏状态失败:', error)
      return null
    }
  }

  /**
   * 清除游戏状态
   */
  clearGameState(puzzleId: string): void {
    try {
      const key = saveManager.getStorageKey(`${this.STORAGE_KEY_PREFIX}${puzzleId}`)
      localStorage.removeItem(key)
      console.log('游戏状态已清除:', puzzleId)
    } catch (error) {
      console.error('清除游戏状态失败:', error)
    }
  }

  /**
   * 加载游戏快照
   */
  loadGameSnapshot(data: {
    puzzleData: PuzzleData
    pieces: any[]
    startTime: Date
    endTime?: Date
    moveCount: number
    sessionId: string
  }): any {
    return {
      puzzleData: data.puzzleData,
      pieces: data.pieces,
      startTime: new Date(data.startTime),
      endTime: data.endTime ? new Date(data.endTime) : null,
      moveCount: data.moveCount,
      sessionId: data.sessionId
    }
  }

  /**
   * 获取所有保存的游戏状态
   */
  getAllSavedStates(): { puzzleId: string, savedAt: string }[] {
    const states: { puzzleId: string, savedAt: string }[] = []
    
    try {
      const currentPrefix = saveManager.getSlotPrefix()
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(currentPrefix) && key.includes(this.STORAGE_KEY_PREFIX)) {
          const puzzleId = key.replace(currentPrefix, '').replace(this.STORAGE_KEY_PREFIX, '')
          const saved = localStorage.getItem(key)
          
          if (saved) {
            const gameStateData = JSON.parse(saved)
            states.push({
              puzzleId,
              savedAt: gameStateData.savedAt
            })
          }
        }
      }
    } catch (error) {
      console.error('获取保存的游戏状态失败:', error)
    }
    
    return states
  }

  /**
   * 清除所有过期的游戏状态
   */
  clearExpiredStates(): void {
    try {
      const states = this.getAllSavedStates()
      const now = new Date()
      
      states.forEach(state => {
        const savedAt = new Date(state.savedAt)
        const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60)
        
        if (hoursDiff > 24) {
          this.clearGameState(state.puzzleId)
        }
      })
    } catch (error) {
      console.error('清除过期游戏状态失败:', error)
    }
  }

  /**
   * 导出游戏状态
   */
  exportGameState(puzzleId: string): string | null {
    try {
      const gameState = this.loadGameState(puzzleId)
      if (gameState) {
        return JSON.stringify(gameState, null, 2)
      }
      return null
    } catch (error) {
      console.error('导出游戏状态失败:', error)
      return null
    }
  }

  /**
   * 导入游戏状态
   */
  importGameState(jsonString: string): boolean {
    try {
      const gameState = JSON.parse(jsonString)
      
      if (gameState.puzzleData && gameState.pieces) {
        this.saveGameState(gameState.puzzleData, gameState)
        return true
      }
      
      return false
    } catch (error) {
      console.error('导入游戏状态失败:', error)
      return false
    }
  }
}
