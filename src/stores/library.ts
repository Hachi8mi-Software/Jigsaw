/**
 * 素材库状态管理Store
 * 采用Pinia + 面向对象设计模式
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LibraryItem, PuzzleData, Achievement, UserStats, DateValue } from '../types'

/**
 * 获取图片资源的完整路径
 * 支持开发环境和生产环境的不同base路径
 */
function getImagePath(imageName: string): string {
  // 使用Vite定义的全局常量
  const baseUrl = __BASE_URL__ || '/Jigsaw/'
  return `${baseUrl}images/${imageName}`
}

/**
 * 素材库管理器类
 */
class LibraryManager {
  private readonly STORAGE_KEY = 'puzzle_library'
  private readonly USER_STATS_KEY = 'user_stats'
  private readonly ACHIEVEMENTS_KEY = 'puzzle_achievements'

  /**
   * 获取内置素材库数据
   */
  getBuiltInLibrary(): LibraryItem[] {
    return [
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
  }

  /**
   * 获取成就定义
   */
  getAchievements(): Achievement[] {
    return [
      {
        id: 'first_puzzle',
        name: '初试身手',
        description: '完成第一个拼图',
        icon: '🧩',
        condition: (stats) => stats.totalGamesPlayed >= 1
      },
      {
        id: 'speed_demon',
        name: '快如闪电',
        description: '10分钟内完成100块拼图',
        icon: '⚡',
        condition: (stats) => {
          return Object.values(stats.bestTimes).some(time => time <= 600)
        }
      },
      {
        id: 'persistent',
        name: '持之以恒',
        description: '完成10个拼图',
        icon: '🏆',
        condition: (stats) => stats.totalGamesPlayed >= 10
      },
      {
        id: 'master',
        name: '拼图大师',
        description: '完成1000块以上的拼图',
        icon: '👑',
        condition: (stats) => stats.totalGamesPlayed >= 1 // 简化条件，实际应检查拼图大小
      },
      {
        id: 'time_spent',
        name: '时间投入',
        description: '累计游戏时间超过10小时',
        icon: '⏰',
        condition: (stats) => stats.totalTimeSpent >= 36000 // 10小时
      }
    ]
  }

  /**
   * 获取用户统计数据
   */
  getUserStats(): UserStats {
    return {
      totalGamesPlayed: 0,
      totalTimeSpent: 0,
      bestTimes: {},
      achievements: [],
      totalSuccessMovements: 0,
    }
  }

  /**
   * 保存用户库到本地存储
   */
  saveToStorage(items: LibraryItem[]): void {
    try {
      const userItems = items.filter(item => !item.isBuiltIn)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userItems))
    } catch (error) {
      console.error('保存素材库失败:', error)
    }
  }

  /**
   * 从本地存储加载用户库
   */
  loadFromStorage(): LibraryItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('加载素材库失败:', error)
      return []
    }
  }

  /**
   * 保存成就到本地存储
   */
  saveAchievements(achievements: Achievement[]): void {
    try {
      localStorage.setItem(this.ACHIEVEMENTS_KEY, JSON.stringify(achievements))
    } catch (error) {
      console.error('保存成就失败:', error)
    }
  }

  /**
   * 从本地存储加载成就
   */
  loadAchievements(): Achievement[] {
    try {
      const stored = localStorage.getItem(this.ACHIEVEMENTS_KEY)
      return stored ? JSON.parse(stored) : this.getAchievements()
    } catch (error) {
      console.error('加载成就失败:', error)
      return this.getAchievements()
    }
  }

  /**
   * 保存用户统计数据到本地存储
   */
  saveUserStats(userStats: UserStats) {
    try {
      localStorage.setItem(this.USER_STATS_KEY, JSON.stringify(userStats))
    } catch (error) {
      console.error('保存用户统计失败:', error)
    }
  }

  /**
   * 从本地获取用户统计数据
   */
  loadUserStats(): UserStats {
    try {
      const stored = localStorage.getItem(this.USER_STATS_KEY)
      return stored ? JSON.parse(stored) : this.getUserStats()
    } catch (error) {
      console.error('加载用户统计失败:', error)
      return this.getUserStats()
    }
  }

  /**
   * 验证图片文件
   */
  validateImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/bmp']
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    return validTypes.includes(file.type) && file.size <= maxSize
  }

  /**
   * 生成缩略图
   */
  async generateThumbnail(file: File, maxWidth: number = 300): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }

      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }
}

export const useLibraryStore = defineStore('library', () => {
  // 状态
  const items = ref<LibraryItem[]>([])
  const categories = ref<string[]>(['全部', '自然风光', '城市建筑', '艺术画作', '可爱动物', '卡通动漫'])
  const selectedCategory = ref('全部')
  const searchKeyword = ref('')
  const sortBy = ref<'name' | 'difficulty' | 'date'>('name')
  const sortOrder = ref<'asc' | 'desc'>('asc')
  const achievements = ref<Achievement[]>([])
  const isLoading = ref(false)

  // 素材库管理器实例
  const libraryManager = new LibraryManager()

  const userStats = ref<UserStats>(libraryManager.loadUserStats())

  // 计算属性
  const filteredItems = computed(() => {
    let filtered = items.value

    // 分类过滤
    if (selectedCategory.value !== '全部') {
      filtered = filtered.filter(item => item.category === selectedCategory.value)
    }

    // 关键词搜索
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(keyword) ||
        item.tags.some(tag => tag.toLowerCase().includes(keyword))
      )
    }

    // 排序
    filtered.sort((a, b) => {
      let compareValue = 0
      
      switch (sortBy.value) {
        case 'name':
          compareValue = a.name.localeCompare(b.name)
          break
        case 'difficulty':
          compareValue = a.difficulty - b.difficulty
          break
        case 'date':
          // 假设有创建日期字段
          compareValue = 0
          break
      }

      return sortOrder.value === 'asc' ? compareValue : -compareValue
    })

    return filtered
  })

  const builtInItems = computed(() => {
    return items.value.filter(item => item.isBuiltIn)
  })

  const userItems = computed(() => {
    return items.value.filter(item => !item.isBuiltIn)
  })

  const unlockedAchievements = computed(() => {
    return achievements.value.filter(achievement => achievement.unlockedAt)
  })

  const availableCategories = computed(() => {
    const itemCategories = [...new Set(items.value.map(item => item.category))]
    return ['全部', ...itemCategories]
  })

  // Actions
  const initializeLibrary = () => {
    isLoading.value = true
    
    // 加载内置素材
    const builtIn = libraryManager.getBuiltInLibrary()
    
    // 加载用户素材
    const userLibrary = libraryManager.loadFromStorage()
    
    // 合并素材库
    items.value = [...builtIn, ...userLibrary]
    
    // 加载成就
    achievements.value = libraryManager.loadAchievements()

    // 加载统计数据
    userStats.value = libraryManager.loadUserStats()

    isLoading.value = false
  }

  const addLibraryItem = async (file: File, name: string, category: string, tags: string[]) => {
    if (!libraryManager.validateImageFile(file)) {
      throw new Error('无效的图片文件')
    }

    try {
      isLoading.value = true
      
      // 生成缩略图
      const thumbnail = await libraryManager.generateThumbnail(file)
      
      // 创建新的库项目
      const newItem: LibraryItem = {
        id: `user_${Date.now()}`,
        name,
        imageUrl: thumbnail,
        category,
        tags,
        difficulty: Math.ceil(Math.random() * 5), // 随机难度，实际应根据复杂度计算
        isBuiltIn: false
      }

      items.value.push(newItem)
      libraryManager.saveToStorage(items.value)
      
      return newItem
    } catch (error) {
      console.error('添加素材失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const removeLibraryItem = (itemId: string) => {
    const index = items.value.findIndex(item => item.id === itemId)
    if (index !== -1 && !items.value[index].isBuiltIn) {
      items.value.splice(index, 1)
      libraryManager.saveToStorage(items.value)
    }
  }

  const updateLibraryItem = (itemId: string, updates: Partial<LibraryItem>) => {
    const item = items.value.find(item => item.id === itemId)
    if (item && !item.isBuiltIn) {
      Object.assign(item, updates)
      libraryManager.saveToStorage(items.value)
    }
  }

  const setSelectedCategory = (category: string) => {
    selectedCategory.value = category
  }

  const setSearchKeyword = (keyword: string) => {
    searchKeyword.value = keyword
  }

  const setSortBy = (sortField: 'name' | 'difficulty' | 'date') => {
    if (sortBy.value === sortField) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = sortField
      sortOrder.value = 'asc'
    }
  }

  const checkAchievements = (userStats: UserStats) => {
    let newAchievements = false
    
    achievements.value.forEach(achievement => {
      if (!achievement.unlockedAt && achievement.condition(userStats)) {
        achievement.unlockedAt = Date.now() as DateValue
        newAchievements = true
      }
    })

    if (newAchievements) {
      libraryManager.saveAchievements(achievements.value)
    }

    return newAchievements
  }

  const exportLibrary = (): string => {
    const exportData = {
      userItems: userItems.value,
      achievements: achievements.value,
      exportedAt: new Date()
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  const importLibrary = (jsonString: string): boolean => {
    try {
      const importData = JSON.parse(jsonString)
      
      if (importData.userItems && Array.isArray(importData.userItems)) {
        // 合并用户素材（避免重复）
        importData.userItems.forEach((item: LibraryItem) => {
          if (!items.value.find(existing => existing.id === item.id)) {
            items.value.push(item)
          }
        })
        
        libraryManager.saveToStorage(items.value)
        return true
      }
      
      return false
    } catch (error) {
      console.error('导入素材库失败:', error)
      return false
    }
  }

  const updateUserStats = (modifier: (userStats: UserStats) => UserStats | undefined) => {
    const newStats = modifier(userStats.value)
    if (newStats) {
      userStats.value = newStats
      libraryManager.saveUserStats(userStats.value)
    }
  }

  const clearUserLibrary = () => {
    items.value = items.value.filter(item => item.isBuiltIn)
    libraryManager.saveToStorage(items.value)
  }

  return {
    // 状态
    items,
    categories,
    selectedCategory,
    searchKeyword,
    sortBy,
    sortOrder,
    achievements,
    isLoading,
    userStats,
    
    // 计算属性
    filteredItems,
    builtInItems,
    userItems,
    unlockedAchievements,
    availableCategories,
    
    // Actions
    initializeLibrary,
    addLibraryItem,
    removeLibraryItem,
    updateLibraryItem,
    setSelectedCategory,
    setSearchKeyword,
    setSortBy,
    checkAchievements,
    exportLibrary,
    importLibrary,
    updateUserStats,
    clearUserLibrary
  }
})
