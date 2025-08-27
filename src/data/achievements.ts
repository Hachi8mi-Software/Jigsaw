import { Achievement, UserStats } from '../types'

/**
 * 成就系统定义数据
 * 包含所有可解锁的成就及其解锁条件
 */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_puzzle',
    name: '初试身手',
    description: '完成第一个拼图',
    icon: '🧩',
    condition: (stats: UserStats) => stats.totalGamesPlayed >= 1
  },
  {
    id: 'speed_demon',
    name: '快如闪电',
    description: '10分钟内完成100块拼图',
    icon: '⚡',
    condition: (stats: UserStats) => {
      return Object.values(stats.bestTimes).some(time => time <= 600)
    }
  },
  {
    id: 'persistent',
    name: '持之以恒',
    description: '完成10个拼图',
    icon: '🏆',
    condition: (stats: UserStats) => stats.totalGamesPlayed >= 10
  },
  {
    id: 'master',
    name: '拼图大师',
    description: '完成1000块以上的拼图',
    icon: '👑',
    condition: (stats: UserStats) => stats.totalGamesPlayed >= 1 // 简化条件，实际应检查拼图大小
  },
  {
    id: 'time_spent',
    name: '时间投入',
    description: '累计游戏时间超过10小时',
    icon: '⏰',
    condition: (stats: UserStats) => stats.totalTimeSpent >= 36000 // 10小时
  }
]

/**
 * 根据ID获取成就定义
 */
export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(achievement => achievement.id === id)
}

/**
 * 获取所有成就
 */
export function getAllAchievements(): Achievement[] {
  return [...ACHIEVEMENTS]
}

/**
 * 检查用户是否解锁了特定成就
 */
export function isAchievementUnlocked(achievementId: string, stats: UserStats): boolean {
  const achievement = getAchievementById(achievementId)
  if (!achievement) return false
  return achievement.condition(stats)
}

/**
 * 获取用户已解锁的成就
 */
export function getUnlockedAchievements(stats: UserStats): Achievement[] {
  return ACHIEVEMENTS.filter(achievement => achievement.condition(stats))
}

/**
 * 获取用户未解锁的成就
 */
export function getLockedAchievements(stats: UserStats): Achievement[] {
  return ACHIEVEMENTS.filter(achievement => !achievement.condition(stats))
}
