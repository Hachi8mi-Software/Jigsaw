/**
 * GameTimer 功能测试
 * 测试计时器的核心功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GameTimer } from '../src/services/GameTimer'

describe('GameTimer', () => {
  let gameTimer: GameTimer

  beforeEach(() => {
    gameTimer = new GameTimer()
  })

  afterEach(() => {
    gameTimer.cleanup()
  })

  describe('基础功能', () => {
    it('应该正确开始计时', () => {
      const puzzleId = 'test-puzzle-1'
      const startTime = gameTimer.startTimer(puzzleId)
      
      expect(startTime).toBeInstanceOf(Date)
      expect(gameTimer.currentPuzzleId).toBe(puzzleId)
      expect(gameTimer.elapsedTime).toBeGreaterThanOrEqual(0)
    })

    it('应该正确暂停计时', () => {
      const puzzleId = 'test-puzzle-1'
      gameTimer.startTimer(puzzleId)
      
      // 等待一小段时间
      setTimeout(() => {
        gameTimer.pauseTimer()
        expect(gameTimer.paused).toBe(true)
      }, 100)
    })

    it('应该正确恢复计时', () => {
      const puzzleId = 'test-puzzle-1'
      gameTimer.startTimer(puzzleId)
      
      gameTimer.pauseTimer()
      expect(gameTimer.paused).toBe(true)
      
      gameTimer.resumeTimer()
      expect(gameTimer.paused).toBe(false)
    })

    it('应该正确停止当前拼图', () => {
      const puzzleId = 'test-puzzle-1'
      gameTimer.startTimer(puzzleId)
      
      gameTimer.stopCurrentPuzzle()
      expect(gameTimer.paused).toBe(false)
      expect(gameTimer.pauseStartTimeValue).toBe(null)
    })
  })

  describe('拼图独立计时', () => {
    it('应该支持不同拼图的独立计时', () => {
      const puzzleId1 = 'test-puzzle-1'
      const puzzleId2 = 'test-puzzle-2'
      
      gameTimer.startTimer(puzzleId1)
      expect(gameTimer.isForPuzzle(puzzleId1)).toBe(true)
      expect(gameTimer.isForPuzzle(puzzleId2)).toBe(false)
      
      gameTimer.startTimer(puzzleId2)
      expect(gameTimer.isForPuzzle(puzzleId1)).toBe(false)
      expect(gameTimer.isForPuzzle(puzzleId2)).toBe(true)
    })
  })

  describe('时间计算', () => {
    it('应该正确计算经过时间', () => {
      const puzzleId = 'test-puzzle-1'
      const startTime = gameTimer.startTimer(puzzleId)
      
      // 模拟经过1秒
      const endTime = new Date(startTime.getTime() + 1000)
      const elapsed = gameTimer.calculateElapsedTime(startTime, endTime)
      
      expect(elapsed).toBeCloseTo(1, 1) // 允许0.1秒误差
    })

    it('暂停时应该不计时', () => {
      const puzzleId = 'test-puzzle-1'
      const startTime = gameTimer.startTimer(puzzleId)
      
      // 立即暂停
      gameTimer.pauseTimer()
      
      // 等待一段时间
      setTimeout(() => {
        const elapsed = gameTimer.elapsedTime
        expect(elapsed).toBeCloseTo(0, 1) // 暂停时应该接近0
      }, 100)
    })
  })

  describe('状态恢复', () => {
    it('应该正确恢复计时器状态', () => {
      const puzzleId = 'test-puzzle-1'
      const startTime = new Date()
      const totalPauseTime = 5000 // 5秒
      const isPaused = true
      
      gameTimer.restoreTimerState(
        startTime,
        null,
        totalPauseTime,
        null,
        isPaused,
        puzzleId
      )
      
      expect(gameTimer.currentPuzzleId).toBe(puzzleId)
      expect(gameTimer.paused).toBe(true)
      expect(gameTimer.totalPauseTimeValue).toBe(totalPauseTime)
    })
  })

  describe('资源清理', () => {
    it('应该正确清理所有资源', () => {
      const puzzleId = 'test-puzzle-1'
      gameTimer.startTimer(puzzleId)
      
      gameTimer.cleanup()
      
      expect(gameTimer.currentPuzzleId).toBe(null)
      expect(gameTimer.paused).toBe(false)
      expect(gameTimer.startTimeValue).toBe(null)
      expect(gameTimer.endTimeValue).toBe(null)
    })
  })
})
