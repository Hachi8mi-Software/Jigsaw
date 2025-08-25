/**
 * 拼图应用核心类型定义
 * 遵循面向对象设计原则
 */

// 边界状态枚举
export enum BoundaryState {
  FLAT = 'flat',       // 平直
  CONVEX = 'convex',   // 外凸
  CONCAVE = 'concave'  // 内凹
}

// 拼图块位置信息
export interface PiecePosition {
  id: string
  x: number
  y: number
  rotation: number
  isPlaced: boolean
}

// 边界信息接口
export interface Boundary {
  id: string
  row: number
  col: number
  direction: 'horizontal' | 'vertical'
  state: BoundaryState
  startX: number
  startY: number
  endX: number
  endY: number
}

// 网格配置接口
export interface GridConfig {
  rows: number
  cols: number
  pieceWidth: number
  pieceHeight: number
}

// 拼图数据接口
export interface PuzzleData {
  id: string
  name: string
  imageUrl: string
  imagePath?: string
  gridConfig: GridConfig
  boundaries: Boundary[]
  createdAt: Date
  difficulty: number
}

// 游戏状态接口
export interface GameState {
  currentPuzzle: PuzzleData | null
  pieces: PiecePosition[]
  startTime: Date | null
  endTime: Date | null
  moveCount: number
  isCompleted: boolean
  elapsedTime: number
}

// 编辑器状态接口
export interface EditorState {
  currentImage: string | null
  gridConfig: GridConfig
  boundaries: Boundary[]
  isPreviewMode: boolean
}

// 用户统计数据接口
export interface UserStats {
  totalGamesPlayed: number
  totalTimeSpent: number
  bestTimes: Record<string, number>
  achievements: string[]
}

// 素材库项目接口
export interface LibraryItem {
  id: string
  name: string
  imageUrl: string
  category: string
  tags: string[]
  difficulty: number
  isBuiltIn: boolean
}

// 成就系统接口
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition: (stats: UserStats) => boolean
  unlockedAt?: Date
}

// 排行榜记录接口
export interface LeaderboardEntry {
  playerName: string
  puzzleId: string
  completionTime: number
  moveCount: number
  completedAt: Date
}
