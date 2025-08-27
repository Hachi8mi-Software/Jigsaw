import { LibraryItem } from '../types'
import { getImagePath } from '../utils/imageUtils'

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
    isBuiltIn: true
  },
  {
    id: 'builtin_2',
    name: '城市夜景',
    imageUrl: getImagePath('city-night.svg'),
    category: '城市建筑',
    tags: ['城市', '夜景', '灯光'],
    difficulty: 4,
    isBuiltIn: true
  },
  {
    id: 'builtin_3',
    name: '可爱的猫咪',
    imageUrl: getImagePath('cat.svg'),
    category: '可爱动物',
    tags: ['猫', '宠物', '可爱'],
    difficulty: 2,
    isBuiltIn: true
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
