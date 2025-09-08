/**
 * 拼图难度计算工具函数
 * 根据拼图块数量和凹凸边界数量来确定1-5星难度
 */

import { PuzzleData, Boundary, BoundaryState, GridConfig } from '../types'

/**
 * 计算拼图难度的分段函数
 * @param puzzleData 拼图数据
 * @returns 1-5的难度等级
 */
export function calculatePuzzleDifficulty(puzzleData: PuzzleData): number {
  const { gridConfig, boundaries } = puzzleData
  return calculateDifficultyFromConfig(gridConfig, boundaries)
}

/**
 * 根据网格配置和边界数据计算难度
 * @param gridConfig 网格配置
 * @param boundaries 边界数据
 * @returns 1-5的难度等级
 */
export function calculateDifficultyFromConfig(gridConfig: GridConfig, boundaries: Boundary[]): number {
  // 计算拼图块总数
  const totalPieces = gridConfig.rows * gridConfig.cols
  
  // 计算凹凸边界数量（非平直边界）
  const complexBoundaries = boundaries.filter(boundary => 
    boundary.state === BoundaryState.CONVEX || boundary.state === BoundaryState.CONCAVE
  ).length
  
  // 计算总边界数量
  const totalBoundaries = boundaries.length
  
  // 计算凹凸边界比例
  const complexityRatio = totalBoundaries > 0 ? complexBoundaries / totalBoundaries : 0
  
  // 基础难度分数：拼图块数量权重
  let difficultyScore = 0
  
  // 拼图块数量评分（0-60分）
  if (totalPieces <= 9) {
    difficultyScore += 10 // 3x3及以下
  } else if (totalPieces <= 16) {
    difficultyScore += 20 // 4x4
  } else if (totalPieces <= 25) {
    difficultyScore += 30 // 5x5
  } else if (totalPieces <= 49) {
    difficultyScore += 40 // 7x7及以下
  } else if (totalPieces <= 100) {
    difficultyScore += 50 // 10x10及以下
  } else {
    difficultyScore += 60 // 10x10以上
  }
  
  // 凹凸边界复杂度评分（0-40分）
  if (complexityRatio <= 0.1) {
    difficultyScore += 5 // 很少凹凸边界
  } else if (complexityRatio <= 0.3) {
    difficultyScore += 15 // 少量凹凸边界
  } else if (complexityRatio <= 0.5) {
    difficultyScore += 25 // 中等凹凸边界
  } else if (complexityRatio <= 0.7) {
    difficultyScore += 35 // 较多凹凸边界
  } else {
    difficultyScore += 40 // 大量凹凸边界
  }
  
  // 将分数映射到1-5星难度
  if (difficultyScore <= 20) {
    return 1 // 1星：简单
  } else if (difficultyScore <= 40) {
    return 2 // 2星：容易
  } else if (difficultyScore <= 60) {
    return 3 // 3星：中等
  } else if (difficultyScore <= 80) {
    return 4 // 4星：困难
  } else {
    return 5 // 5星：极难
  }
}

/**
 * 为没有边界数据的拼图计算基础难度
 * @param gridConfig 网格配置
 * @returns 1-5的难度等级
 */
export function calculateBasicDifficulty(gridConfig: GridConfig): number {
  const totalPieces = gridConfig.rows * gridConfig.cols
  
  // 仅基于拼图块数量的简化难度计算
  if (totalPieces <= 9) {
    return 1 // 3x3及以下
  } else if (totalPieces <= 25) {
    return 2 // 5x5及以下
  } else if (totalPieces <= 64) {
    return 3 // 8x8及以下
  } else if (totalPieces <= 144) {
    return 4 // 12x12及以下
  } else {
    return 5 // 12x12以上
  }
}

/**
 * 获取难度描述文本
 * @param difficulty 1-5的难度等级
 * @returns 难度描述
 */
export function getDifficultyDescription(difficulty: number): string {
  switch (difficulty) {
    case 1:
      return '简单'
    case 2:
      return '容易'
    case 3:
      return '中等'
    case 4:
      return '困难'
    case 5:
      return '极难'
    default:
      return '未知'
  }
}

/**
 * 获取难度颜色类名
 * @param difficulty 1-5的难度等级
 * @returns CSS类名
 */
export function getDifficultyColorClass(difficulty: number): string {
  switch (difficulty) {
    case 1:
      return 'difficulty-easy'
    case 2:
      return 'difficulty-normal'
    case 3:
      return 'difficulty-medium'
    case 4:
      return 'difficulty-hard'
    case 5:
      return 'difficulty-extreme'
    default:
      return 'difficulty-unknown'
  }
}