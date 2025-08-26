/**
 * PuzzleBoardViewModel 核心功能测试
 * 测试监听器和基础业务逻辑
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { PuzzleBoardViewModel } from '../src/viewModels/puzzleBoardViewModel'
import type { PuzzleData } from '../src/types'

// 创建测试用的puzzle数据
const createTestPuzzleData = (): PuzzleData => ({
  id: 'test-puzzle',
  name: '测试拼图',
  imageUrl: '/test-image.jpg',
  gridConfig: {
    rows: 2,
    cols: 2,
    pieceWidth: 100,
    pieceHeight: 75
  },
  boundaries: [],
  createdAt: new Date(),
  difficulty: 1
})

describe('PuzzleBoardViewModel - 基础功能', () => {
  let app: any
  let pinia: any
  let viewModel: PuzzleBoardViewModel
  let testPuzzleData: PuzzleData

  beforeEach(() => {
    // 创建Vue应用上下文
    app = createApp({})
    pinia = createPinia()
    app.use(pinia)
    
    // 创建测试数据和ViewModel
    testPuzzleData = createTestPuzzleData()
    viewModel = new PuzzleBoardViewModel(testPuzzleData)
  })

  afterEach(() => {
    viewModel?.destroy()
  })

  describe('基础属性计算', () => {
    it('应该正确计算拼图块总数', () => {
      expect(viewModel.totalPieces).toBe(4)
    })

    it('应该正确获取网格尺寸', () => {
      expect(viewModel.gridRows).toBe(2)
      expect(viewModel.gridCols).toBe(2)
    })

    it('应该正确计算拼图块尺寸', () => {
      const size = viewModel.getPieceSize()
      expect(size.width).toBeGreaterThan(0)
      expect(size.height).toBeGreaterThan(0)
    })
  })

  describe('拼图块初始化', () => {
    it('应该正确初始化拼图块数据', () => {
      viewModel.initializePieces()
      
      expect(viewModel.pieces).toBeDefined()
      expect(viewModel.pieces.length).toBe(4)
      
      // 检查每个拼图块的基础属性
      viewModel.pieces.forEach((piece, index) => {
        expect(piece.originalIndex).toBe(index)
        expect(piece.isPlaced).toBe(false)
        expect(piece.currentX).toBeGreaterThan(0)
        expect(piece.currentY).toBeGreaterThan(0)
      })
    })
  })

  describe('样式生成', () => {
    beforeEach(() => {
      viewModel.initializePieces()
    })

    it('应该生成正确的网格样式', () => {
      const gridStyle = viewModel.getGridStyle()
      
      expect(gridStyle).toMatchObject({
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)'
      })
    })

    it('应该为拼图块生成图像样式', () => {
      const piece = viewModel.pieces[0]
      const imageStyle = viewModel.getPieceImageStyle(piece)
      
      expect(imageStyle).toHaveProperty('backgroundImage')
      expect(imageStyle).toHaveProperty('backgroundSize')
      expect(imageStyle).toHaveProperty('backgroundPosition')
    })
  })

  describe('拖拽操作', () => {
    beforeEach(() => {
      viewModel.initializePieces()
    })

    it('应该正确开始拖拽', () => {
      expect(viewModel.draggingPieceIndex).toBe(-1)
      
      viewModel.startDrag(0, 100, 100)
      
      expect(viewModel.draggingPieceIndex).toBe(0)
    })

    it('应该正确处理拖拽移动', () => {
      viewModel.startDrag(0, 100, 100)
      const initialX = viewModel.pieces[0].currentX
      
      viewModel.handleDrag(200, 200)
      
      expect(viewModel.pieces[0].currentX).not.toBe(initialX)
    })

    it('应该正确结束拖拽', () => {
      viewModel.startDrag(0, 100, 100)
      
      const mockGridRect = new DOMRect(50, 50, 400, 300)
      viewModel.stopDrag(120, 120, mockGridRect)
      
      expect(viewModel.draggingPieceIndex).toBe(-1)
    })
  })

  describe('游戏控制', () => {
    beforeEach(() => {
      viewModel.initializePieces()
    })

    it('应该能打乱拼图块', () => {
      const originalPositions = viewModel.pieces.map(piece => ({
        x: piece.currentX,
        y: piece.currentY
      }))
      
      viewModel.shufflePieces()
      
      // 验证至少有一个拼图块位置发生变化
      const hasPositionChanged = viewModel.pieces.some((piece, index) =>
        piece.currentX !== originalPositions[index].x ||
        piece.currentY !== originalPositions[index].y
      )
      expect(hasPositionChanged).toBe(true)
    })

    it('应该能重置拼图', () => {
      // 先手动设置一些状态
      viewModel.pieces[0].isPlaced = true
      
      viewModel.resetPuzzle()
      
      // 验证状态被重置
      expect(viewModel.pieces.every(piece => !piece.isPlaced)).toBe(true)
    })
  })

  describe('监听器功能', () => {
    beforeEach(() => {
      viewModel.initializePieces()
    })

    it('应该正确判断同步条件', () => {
      const oldPieces = viewModel.pieces.map(piece => ({ ...piece }))
      const newPieces = viewModel.pieces.map(piece => ({ ...piece }))
      
      // 相同数据不应同步
      expect(viewModel['shouldSyncToGameStore'](newPieces, oldPieces)).toBe(false)
      
      // 位置变化应该同步
      newPieces[0].currentX = 999
      expect(viewModel['shouldSyncToGameStore'](newPieces, oldPieces)).toBe(true)
    })
  })

  describe('状态管理', () => {
    it('应该能保存状态到localStorage', () => {
      viewModel.initializePieces()
      viewModel.saveToLocalStorage()
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        `puzzle_exact_state_${testPuzzleData.id}`,
        expect.any(String)
      )
    })

    it('应该能从localStorage恢复状态', () => {
      viewModel.initializePieces()
      
      const mockState = {
        puzzleId: testPuzzleData.id,
        pieces: viewModel.pieces,
        timestamp: Date.now()
      }
      
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(mockState))
      
      const result = viewModel.restoreFromLocalStorage()
      expect(result).toBe(true)
    })
  })

  describe('边界条件处理', () => {
    it('应该处理空puzzle数据', () => {
      const nullViewModel = new PuzzleBoardViewModel(null)
      
      expect(nullViewModel.totalPieces).toBe(0)
      expect(nullViewModel.gridRows).toBe(0)
      expect(nullViewModel.gridCols).toBe(0)
      
      nullViewModel.destroy()
    })

    it('应该正确销毁监听器', () => {
      const unwatchSpy = vi.fn()
      viewModel['unwatchPieces'] = unwatchSpy
      
      viewModel.destroy()
      
      expect(unwatchSpy).toHaveBeenCalled()
      expect(viewModel['unwatchPieces']).toBeNull()
    })
  })
})
