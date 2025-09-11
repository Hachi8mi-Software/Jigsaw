import { LibraryItem, BoundaryState } from '../types'
import { getImagePath } from '../utils/imageUtils'
import { BoundaryManager } from '../utils/boundaryUtils'

/**
 * 拼图配置接口
 */
interface PuzzleConfig {
  id: string
  name: string
  imageFile: string
  category: string
  tags: string[]
  difficulty: number
  gridConfig: {
    rows: number
    cols: number
    pieceWidth: number
    pieceHeight: number
  }
  customBoundaries?: boolean
}

/**
 * 创建拼图数据
 */
function createPuzzleData(config: PuzzleConfig) {
  const imageUrl = getImagePath(config.imageFile)
  const boundaries = config.customBoundaries 
    ? createCustomBoundaries(config.gridConfig)
    : BoundaryManager.generateInitialBoundaries(config.gridConfig)

  return {
    id: config.id,
    name: config.name,
    imageUrl,
    gridConfig: config.gridConfig,
    boundaries,
    createdAt: new Date(),
    difficulty: config.difficulty
  }
}

/**
 * 创建库项目
 */
function createLibraryItem(config: PuzzleConfig): LibraryItem {
  return {
    id: config.id,
    name: config.name,
    imageUrl: getImagePath(config.imageFile),
    category: config.category,
    tags: config.tags,
    difficulty: config.difficulty,
    isBuiltIn: true,
    puzzleData: createPuzzleData(config)
  }
}

/**
 * 内置拼图配置
 */
const PUZZLE_CONFIGS: PuzzleConfig[] = [
  {
    id: 'builtin_1',
    name: '美丽的日落',
    imageFile: 'sunset.png',
    category: '自然风光',
    tags: ['日落', '天空', '美景'],
    difficulty: 3,
    gridConfig: {
      rows: 3,
      cols: 4,
      pieceWidth: 153,
      pieceHeight: 120
    },
    customBoundaries: true
  },
  {
    id: 'builtin_2',
    name: '城市夜景',
    imageFile: 'city-night.png',
    category: '城市建筑',
    tags: ['城市', '夜景', '灯光'],
    difficulty: 4,
    gridConfig: {
      rows: 4,
      cols: 4,
      pieceWidth: 140,
      pieceHeight: 200
    }
  },
  {
    id: 'builtin_3',
    name: '可爱的猫咪',
    imageFile: 'cat.png',
    category: '可爱动物',
    tags: ['猫', '宠物', '可爱'],
    difficulty: 2,
    gridConfig: {
      rows: 3,
      cols: 3,
      pieceWidth: 120,
      pieceHeight: 120
    }
  },
  {
    id: 'builtin_4',
    name: '空洞骑士：丝之歌',
    imageFile: 'hks.png',
    category: '游戏角色',
    tags: ['空洞骑士', '丝之歌', '动作游戏'],
    difficulty: 3,
    gridConfig: {
      rows: 3,
      cols: 5,
      pieceWidth: 100,
      pieceHeight: 100
    }
  }
]

/**
 * 内置拼图库数据
 * 包含应用预置的拼图素材
 */
export const BUILTIN_PUZZLES: LibraryItem[] = PUZZLE_CONFIGS.map(createLibraryItem)

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
function createCustomBoundaries(gridConfig: { rows: number; cols: number; pieceWidth: number; pieceHeight: number }) {
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
