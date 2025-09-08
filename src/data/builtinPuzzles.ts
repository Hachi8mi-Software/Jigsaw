import { LibraryItem, BoundaryState } from '../types'
import { getImagePath } from '../utils/imageUtils'
import { BoundaryManager } from '../utils/boundaryUtils'

/**
 * 内置拼图库数据
 * 包含应用预置的拼图素材
 */
export const BUILTIN_PUZZLES: LibraryItem[] = [
  {
    id: 'builtin_1',
    name: '美丽的日落',
    imageUrl: getImagePath('sunset.svg'),
    category: '自然风光',
    tags: ['日落', '天空', '美景'],
    difficulty: 3,
    isBuiltIn: true,
    puzzleData: {
      id: 'builtin_1',
      name: '美丽的日落',
      imageUrl: getImagePath('sunset.svg'),
      gridConfig: {
        rows: 3,
        cols: 4,
        pieceWidth: 150,
        pieceHeight: 100
      },
      boundaries: BoundaryManager.generateInitialBoundaries({
        rows: 3,
        cols: 4,
        pieceWidth: 150,
        pieceHeight: 100
      }),
      createdAt: new Date(),
      difficulty: 3
    }
  },
  {
    id: 'builtin_2',
    name: '城市夜景',
    imageUrl: getImagePath('city-night.svg'),
    category: '城市建筑',
    tags: ['城市', '夜景', '灯光'],
    difficulty: 4,
    isBuiltIn: true,
    puzzleData: {
      id: 'builtin_2',
      name: '城市夜景',
      imageUrl: getImagePath('city-night.svg'),
      gridConfig: {
        rows: 3,
        cols: 4,
        pieceWidth: 150,
        pieceHeight: 100
      },
      boundaries: BoundaryManager.generateInitialBoundaries({
        rows: 3,
        cols: 4,
        pieceWidth: 150,
        pieceHeight: 100
      }),
      createdAt: new Date(),
      difficulty: 4
    }
  },
  {
    id: 'builtin_3',
    name: '可爱的猫咪',
    imageUrl: getImagePath('cat.svg'),
    category: '可爱动物',
    tags: ['猫', '宠物', '可爱'],
    difficulty: 2,
    isBuiltIn: true,
    puzzleData: {
      id: 'builtin_3',
      name: '可爱的猫咪',
      imageUrl: getImagePath('cat.svg'),
      gridConfig: {
        rows: 3,
        cols: 4,
        pieceWidth: 150,
        pieceHeight: 100
      },
      boundaries: BoundaryManager.generateInitialBoundaries({
        rows: 3,
        cols: 4,
        pieceWidth: 150,
        pieceHeight: 100
      }),
      createdAt: new Date(),
      difficulty: 2
    }
  },
  {
    id: 'builtin_4',
    name: '凹凸拼图实验',
    imageUrl: getImagePath('sunset.svg'),
    category: '实验',
    tags: ['实验', '凹凸', '特殊形状'],
    difficulty: 3,
    isBuiltIn: true,
    puzzleData: {
      id: 'builtin_4',
      name: '凹凸拼图实验',
      imageUrl: getImagePath('sunset.svg'),
      gridConfig: {
        rows: 3,
        cols: 3,
        pieceWidth: 150,
        pieceHeight: 100
      },
      boundaries: createCustomBoundaries(),
      createdAt: new Date(),
      difficulty: 3
    }
  }
]

/**
 * 根据ID获取内置拼图
 */
export function getBuiltinPuzzleById(id: string): LibraryItem | undefined {
  return BUILTIN_PUZZLES.find(puzzle => puzzle.id === id)
}

/**
 * 根据分类获取内置拼图
 */
export function getBuiltinPuzzlesByCategory(category: string): LibraryItem[] {
  return BUILTIN_PUZZLES.filter(puzzle => puzzle.category === category)
}

/**
 * 根据难度获取内置拼图
 */
export function getBuiltinPuzzlesByDifficulty(difficulty: number): LibraryItem[] {
  return BUILTIN_PUZZLES.filter(puzzle => puzzle.difficulty === difficulty)
}

/**
 * 创建自定义边界数组，用于凹凸拼图实验
 * 特别设置了某两个相邻拼图块的连接形状为凹凸
 */
function createCustomBoundaries() {
  // 创建一个3x3的网格配置
  const gridConfig = {
    rows: 3,
    cols: 3,
    pieceWidth: 150,
    pieceHeight: 100
  }
  
  // 生成初始边界
  const boundaries = BoundaryManager.generateInitialBoundaries(gridConfig)
  
  // 找到中间位置的水平边界（第1行第1列的底边，连接第1行第1列和第2行第1列的拼图块）
  const horizontalBoundaryIndex = boundaries.findIndex(b => 
    b.row === 1 && b.col === 1 && b.direction === 'horizontal'
  )
  
  // 找到中间位置的垂直边界（第1行第1列的右边，连接第1行第1列和第1行第2列的拼图块）
  const verticalBoundaryIndex = boundaries.findIndex(b => 
    b.row === 1 && b.col === 1 && b.direction === 'vertical'
  )
  
  // 修改这两个边界的状态为凹凸
  if (horizontalBoundaryIndex !== -1) {
    boundaries[horizontalBoundaryIndex].state = BoundaryState.CONVEX
  }
  
  if (verticalBoundaryIndex !== -1) {
    boundaries[verticalBoundaryIndex].state = BoundaryState.CONCAVE
  }
  
  return boundaries
}
