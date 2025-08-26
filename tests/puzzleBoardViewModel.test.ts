/**
 * PuzzleBoardViewModel 单元测试
 * 测试监听器功能和业务逻辑
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
    rows: 3,
    cols: 3,
    pieceWidth: 100,
    pieceHeight: 75
  },
  boundaries: [],
  createdAt: new Date(),
  difficulty: 1
})

// 创建Vue应用上下文以支持Pinia
const createTestApp = () => {
  const app = createApp({})
  const pinia = createPinia()
  app.use(pinia)
  return { app, pinia }
}

describe('PuzzleBoardViewModel', () => {
  let viewModel: PuzzleBoardViewModel
  let testPuzzleData: PuzzleData
  let testApp: { app: any, pinia: any }

  beforeEach(() => {
    testApp = createTestApp()
    testPuzzleData = createTestPuzzleData()
    viewModel = new PuzzleBoardViewModel(testPuzzleData)
  })

  afterEach(() => {
    viewModel.destroy()
    testApp.app.unmount()
  })

  describe('构造函数和初始化', () => {
    it('应该正确创建ViewModel实例', () => {
      expect(viewModel).toBeDefined()
      expect(viewModel.totalPieces).toBe(9)
      expect(viewModel.gridRows).toBe(3)
      expect(viewModel.gridCols).toBe(3)
    })

    it('应该正确初始化监听器', () => {
      expect(viewModel['unwatchPieces']).toBeDefined()
    })
  })

  describe('计算属性', () => {
    it('应该正确计算总拼图块数', () => {
      expect(viewModel.totalPieces).toBe(9)
    })

    it('应该正确获取网格配置', () => {
      expect(viewModel.gridRows).toBe(3)
      expect(viewModel.gridCols).toBe(3)
    })

    it('应该返回正确的拼图块尺寸', () => {
      const size = viewModel.getPieceSize()
      expect(size.width).toBeGreaterThan(0)
      expect(size.height).toBeGreaterThan(0)
    })
  })

  describe('样式计算', () => {
    beforeEach(() => {
      viewModel.initializePieces()
    })

    it('应该生成正确的网格样式', () => {
      const gridStyle = viewModel.getGridStyle()
      expect(gridStyle).toHaveProperty('display', 'grid')
      expect(gridStyle).toHaveProperty('gridTemplateColumns', 'repeat(3, 1fr)')
      expect(gridStyle).toHaveProperty('gridTemplateRows', 'repeat(3, 1fr)')
    })

    it('应该为拼图块生成正确的图像样式', () => {
      const piece = viewModel.pieces[0]
      const imageStyle = viewModel.getPieceImageStyle(piece)
      expect(imageStyle).toHaveProperty('backgroundImage')
      expect(imageStyle).toHaveProperty('backgroundSize')
      expect(imageStyle).toHaveProperty('backgroundPosition')
    })

    it('应该为拼图块生成正确的基础样式', () => {
      const piece = viewModel.pieces[0]
      const baseStyle = viewModel.getPieceStyle(piece)
      expect(baseStyle).toHaveProperty('position', 'absolute')
      expect(baseStyle).toHaveProperty('cursor', 'grab')
    })
  })

  describe('拼图块初始化', () => {
    it('应该正确初始化拼图块', () => {
      viewModel.initializePieces()
      expect(viewModel.pieces.length).toBe(9)
      expect(viewModel.pieces.every(piece => !piece.isPlaced)).toBe(true)
    })

    it('应该正确散落拼图块', () => {
      viewModel.initializePieces()
      const pieces = viewModel.pieces
      expect(pieces.every(piece => piece.currentX > 0 && piece.currentY > 0)).toBe(true)
    })
  })

  describe('拼图块操作', () => {
    beforeEach(() => {
      viewModel.initializePieces()
    })

    it('应该正确开始拖拽', () => {
      viewModel.startDrag(0, 100, 100)
      expect(viewModel.draggingPieceIndex).toBe(0)
    })

    it('应该正确处理拖拽移动', () => {
      viewModel.startDrag(0, 100, 100)
      const initialX = viewModel.pieces[0].currentX
      const initialY = viewModel.pieces[0].currentY
      
      viewModel.handleDrag(150, 150)
      
      expect(viewModel.pieces[0].currentX).not.toBe(initialX)
      expect(viewModel.pieces[0].currentY).not.toBe(initialY)
    })

    it('应该正确结束拖拽', () => {
      viewModel.startDrag(0, 100, 100)
      viewModel.handleDrag(150, 150)
      
      const mockGridRect = new DOMRect(50, 50, 400, 300)
      viewModel.stopDrag(120, 120, mockGridRect)
      
      expect(viewModel.draggingPieceIndex).toBe(-1)
    })

    it('应该检查插槽占用状态', () => {
      expect(viewModel.isSlotOccupied(0)).toBe(false)
    })
  })

  describe('游戏控制操作', () => {
    beforeEach(() => {
      viewModel.initializePieces()
    })

    it('应该正确打乱拼图块', () => {
      const originalPositions = viewModel.pieces.map(piece => ({ x: piece.currentX, y: piece.currentY }))
      viewModel.shufflePieces()
      
      // 检查是否有位置变化（至少一个位置改变）
      const hasChanged = viewModel.pieces.some((piece, index) => 
        piece.currentX !== originalPositions[index].x || piece.currentY !== originalPositions[index].y
      )
      expect(hasChanged).toBe(true)
    })

    it('应该正确重置拼图', () => {
      // 先放置一个拼图块
      viewModel.pieces[0].isPlaced = true
      viewModel.pieces[0].gridPosition = 0
      
      viewModel.resetPuzzle()
      
      expect(viewModel.pieces.every(piece => !piece.isPlaced)).toBe(true)
    })

    it('应该正确自动解决拼图', () => {
      viewModel.autoSolve()
      
      expect(viewModel.pieces.every(piece => piece.isPlaced && piece.isCorrect)).toBe(true)
    })
  })

  describe('状态同步', () => {
    beforeEach(() => {
      viewModel.initializePieces()
    })

    it('应该正确判断是否需要同步', () => {
      const oldPieces = viewModel.pieces.map(piece => ({ ...piece }))
      const newPieces = viewModel.pieces.map(piece => ({ ...piece }))
      
      // 没有变化时不应该同步
      expect(viewModel['shouldSyncToGameStore'](newPieces, oldPieces)).toBe(false)
      
      // 有位置变化时应该同步
      newPieces[0].currentX = 999
      expect(viewModel['shouldSyncToGameStore'](newPieces, oldPieces)).toBe(true)
    })

    it('监听器应该在数据变化时被正确配置', () => {
      // 验证监听器已经被初始化
      expect(viewModel['unwatchPieces']).toBeDefined()
      expect(typeof viewModel['unwatchPieces']).toBe('function')
    })
  })

  describe('本地存储', () => {
    beforeEach(() => {
      viewModel.initializePieces()
    })

    it('应该正确保存状态到localStorage', () => {
      viewModel.saveToLocalStorage()
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        `puzzle_exact_state_${testPuzzleData.id}`,
        expect.stringContaining(testPuzzleData.id)
      )
    })

    it('应该能从localStorage恢复状态', () => {
      // 设置mock数据
      const mockStateData = {
        puzzleId: testPuzzleData.id,
        pieces: viewModel.pieces.map(piece => ({ ...piece })),
        timestamp: Date.now()
      }
      
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(mockStateData))
      
      const restored = viewModel.restoreFromLocalStorage()
      expect(restored).toBe(true)
    })

    it('无效数据时应该返回false', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('invalid-json')
      
      const restored = viewModel.restoreFromLocalStorage()
      expect(restored).toBe(false)
    })
  })

  describe('生命周期管理', () => {
    it('应该正确销毁监听器', () => {
      const unwatchSpy = vi.fn()
      viewModel['unwatchPieces'] = unwatchSpy
      
      viewModel.destroy()
      
      expect(unwatchSpy).toHaveBeenCalled()
      expect(viewModel['unwatchPieces']).toBeNull()
    })

    it('应该正确更新puzzle数据', () => {
      const newPuzzleData = createTestPuzzleData()
      newPuzzleData.id = 'new-puzzle'
      newPuzzleData.gridConfig.rows = 4
      newPuzzleData.gridConfig.cols = 4
      
      viewModel.updatePuzzleData(newPuzzleData)
      
      expect(viewModel['puzzleData']).toBe(newPuzzleData)
      expect(viewModel.totalPieces).toBe(16)
    })
  })

  describe('边界条件', () => {
    it('应该处理空puzzle数据', () => {
      const emptyViewModel = new PuzzleBoardViewModel(null)
      expect(emptyViewModel.totalPieces).toBe(0)
      expect(emptyViewModel.gridRows).toBe(0)
      expect(emptyViewModel.gridCols).toBe(0)
      emptyViewModel.destroy()
    })

    it('应该处理异常的网格配置', () => {
      const invalidPuzzle = createTestPuzzleData()
      invalidPuzzle.gridConfig.rows = 0
      invalidPuzzle.gridConfig.cols = 0
      
      const invalidViewModel = new PuzzleBoardViewModel(invalidPuzzle)
      invalidViewModel.initializePieces()
      
      expect(invalidViewModel.pieces.length).toBe(0)
      invalidViewModel.destroy()
    })
  })
})
