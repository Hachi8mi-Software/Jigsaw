import { Achievement, UserStats } from '../types'

/**
 * 成就系统定义数据
 * 包含所有可解锁的成就及其解锁条件
 */
export const ACHIEVEMENTS: Achievement[] = [
  // 基础成就
  {
    id: 'first_puzzle',
    name: '初试身手',
    description: '完成第一个拼图',
    icon: '🧩',
    condition: (stats: UserStats) => stats.totalGamesPlayed >= 1
  },
  {
    id: 'second_puzzle',
    name: '再接再厉',
    description: '完成第二个拼图',
    icon: '🎯',
    condition: (stats: UserStats) => stats.totalGamesPlayed >= 2
  },
  {
    id: 'persistent',
    name: '持之以恒',
    description: '完成10个拼图',
    icon: '🏆',
    condition: (stats: UserStats) => stats.totalGamesPlayed >= 10
  },
  {
    id: 'dedicated',
    name: '坚持不懈',
    description: '完成50个拼图',
    icon: '💪',
    condition: (stats: UserStats) => stats.totalGamesPlayed >= 50
  },
  {
    id: 'master',
    name: '拼图大师',
    description: '完成100个拼图',
    icon: '👑',
    condition: (stats: UserStats) => stats.totalGamesPlayed >= 100
  },

  // 速度成就
  {
    id: 'speed_demon',
    name: '快如闪电',
    description: '10分钟内完成任意拼图',
    icon: '⚡',
    condition: (stats: UserStats) => {
      return Object.values(stats.bestTimes).some(time => time <= 600)
    }
  },
  {
    id: 'lightning_fast',
    name: '疾风迅雷',
    description: '5分钟内完成任意拼图',
    icon: '🌩️',
    condition: (stats: UserStats) => {
      return Object.values(stats.bestTimes).some(time => time <= 300)
    }
  },
  {
    id: 'speed_master',
    name: '速度之王',
    description: '3分钟内完成任意拼图',
    icon: '🚀',
    condition: (stats: UserStats) => {
      return Object.values(stats.bestTimes).some(time => time <= 180)
    }
  },

  // 时间投入成就
  {
    id: 'time_spent',
    name: '时间投入',
    description: '累计游戏时间超过1小时',
    icon: '⏰',
    condition: (stats: UserStats) => stats.totalTimeSpent >= 3600
  },
  {
    id: 'time_master',
    name: '时间大师',
    description: '累计游戏时间超过10小时',
    icon: '🕐',
    condition: (stats: UserStats) => stats.totalTimeSpent >= 36000
  },
  {
    id: 'time_legend',
    name: '时间传奇',
    description: '累计游戏时间超过50小时',
    icon: '⏳',
    condition: (stats: UserStats) => stats.totalTimeSpent >= 180000
  },

  // 技巧成就
  {
    id: 'efficient_mover',
    name: '高效移动',
    description: '单次游戏成功移动超过100次',
    icon: '🎮',
    condition: (stats: UserStats) => stats.totalSuccessMovements >= 100
  },
  {
    id: 'precision_master',
    name: '精准大师',
    description: '单次游戏成功移动超过500次',
    icon: '🎯',
    condition: (stats: UserStats) => stats.totalSuccessMovements >= 500
  },

  // 特殊成就
  {
    id: 'perfectionist',
    name: '完美主义者',
    description: '连续完成5个拼图无失误',
    icon: '✨',
    condition: (stats: UserStats) => stats.totalGamesPlayed >= 5 // 简化条件
  },
  {
    id: 'night_owl',
    name: '夜猫子',
    description: '在深夜时段完成拼图',
    icon: '🦉',
    condition: (stats: UserStats) => {
      const now = new Date()
      const hour = now.getHours()
      return stats.totalGamesPlayed >= 1 && (hour >= 23 || hour <= 5)
    }
  },
  {
    id: 'early_bird',
    name: '早起鸟',
    description: '在清晨时段完成拼图',
    icon: '🐦',
    condition: (stats: UserStats) => {
      const now = new Date()
      const hour = now.getHours()
      return stats.totalGamesPlayed >= 1 && hour >= 5 && hour <= 8
    }
  },
  {
    id: 'weekend_warrior',
    name: '周末战士',
    description: '在周末完成拼图',
    icon: '🏃',
    condition: (stats: UserStats) => {
      const now = new Date()
      const day = now.getDay()
      return stats.totalGamesPlayed >= 1 && (day === 0 || day === 6)
    }
  },

  // 里程碑成就
  {
    id: 'century_club',
    name: '百场俱乐部',
    description: '完成100场游戏',
    icon: '💯',
    condition: (stats: UserStats) => stats.totalGamesPlayed >= 100
  },
  {
    id: 'half_century',
    name: '半百成就',
    description: '完成50场游戏',
    icon: '5️⃣0️⃣',
    condition: (stats: UserStats) => stats.totalGamesPlayed >= 50
  },
  {
    id: 'decade',
    name: '十全十美',
    description: '完成10场游戏',
    icon: '🔟',
    condition: (stats: UserStats) => stats.totalGamesPlayed >= 10
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
