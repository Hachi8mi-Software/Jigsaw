<!--
  成就视图
  展示用户解锁的成就和进度
-->

<template>
  <div class="achievements-view">
    <!-- 顶部标题栏 -->
    <div class="achievements-header">
      <h1 class="achievements-title">🏆 成就系统</h1>
      <div class="achievements-stats">
        <div class="stat-card">
          <div class="stat-number">{{ unlockedCount }}</div>
          <div class="stat-label">已解锁</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ totalCount }}</div>
          <div class="stat-label">总数</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ completionRate }}%</div>
          <div class="stat-label">完成度</div>
        </div>
      </div>
    </div>

    <!-- 成就分类标签 -->
    <div class="achievement-categories">
      <button 
        v-for="category in categories" 
        :key="category.id"
        class="category-btn"
        :class="{ 'active': selectedCategory === category.id }"
        @click="selectedCategory = category.id"
      >
        {{ category.icon }} {{ category.name }}
      </button>
    </div>

    <!-- 成就列表 -->
    <div class="achievements-content">
      <div class="achievements-grid">
        <div
          v-for="achievement in filteredAchievements"
          :key="achievement.id"
          class="achievement-card"
          :class="{ 'unlocked': achievement.unlockedAt }"
        >
          <div class="achievement-icon">
            {{ achievement.icon }}
          </div>
          <div class="achievement-info">
            <h3 class="achievement-name">{{ achievement.name }}</h3>
            <p class="achievement-description">{{ achievement.description }}</p>
            <div v-if="achievement.unlockedAt" class="achievement-date">
              <span class="unlock-icon">✨</span>
              解锁时间: {{ formatDate(achievement.unlockedAt) }}
            </div>
            <div v-else class="achievement-locked">
              <span class="lock-icon">🔒</span>
              未解锁
            </div>
          </div>
          <div v-if="achievement.unlockedAt" class="achievement-badge">
            <span class="badge-text">已解锁</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, ref } from 'vue'
import { useLibraryStore } from '../stores/library'
import { useGameStore } from '../stores/game'
import type { DateValue } from '../types'

// Store
const libraryStore = useLibraryStore()

// 状态
const selectedCategory = ref('all')

// 成就分类
const categories = [
  { id: 'all', name: '全部', icon: '🏆' },
  { id: 'basic', name: '基础', icon: '🧩' },
  { id: 'speed', name: '速度', icon: '⚡' },
  { id: 'time', name: '时间', icon: '⏰' },
  { id: 'skill', name: '技巧', icon: '🎯' },
  { id: 'special', name: '特殊', icon: '✨' },
  { id: 'milestone', name: '里程碑', icon: '💯' }
]

// 计算属性
const achievements = computed(() => {
  return libraryStore.achievements
})
const unlockedAchievements = computed(() => libraryStore.unlockedAchievements)

const unlockedCount = computed(() => unlockedAchievements.value.length)
const totalCount = computed(() => achievements.value.length)
const completionRate = computed(() => {
  return totalCount.value > 0 ? Math.round((unlockedCount.value / totalCount.value) * 100) : 0
})

// 过滤后的成就
const filteredAchievements = computed(() => {
  if (selectedCategory.value === 'all') {
    return achievements.value
  }
  
  return achievements.value.filter(achievement => {
    const id = achievement.id
    switch (selectedCategory.value) {
      case 'basic':
        return ['first_puzzle', 'second_puzzle', 'persistent', 'dedicated', 'master'].includes(id)
      case 'speed':
        return ['speed_demon', 'lightning_fast', 'speed_master'].includes(id)
      case 'time':
        return ['time_spent', 'time_master', 'time_legend'].includes(id)
      case 'skill':
        return ['efficient_mover', 'precision_master'].includes(id)
      case 'special':
        return ['perfectionist', 'night_owl', 'early_bird', 'weekend_warrior'].includes(id)
      case 'milestone':
        return ['century_club', 'half_century', 'decade'].includes(id)
      default:
        return true
    }
  })
})

// 方法
const formatDate = (date: DateValue): string => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// 生命周期
onMounted(() => {
  // 检查是否有新的成就可以解锁
  console.debug("[Achievements]", libraryStore.achievements)

  libraryStore.checkAchievements(libraryStore.userStats)
})

// 监听用户统计数据变化，实时检查成就
watch(() => libraryStore.userStats, (newStats) => {
  if (newStats) {
    libraryStore.checkAchievements(newStats)
  }
}, { deep: true })
</script>

<style scoped>
.achievements-view {
  @apply h-screen flex flex-col p-6;
  background-color: var(--settings-bg);
  transition: background-color 0.3s ease;
}

/* 移动端适配：为固定头部栏预留空间 */
@media (max-width: 767px) {
  .achievements-view {
    height: calc(100vh - 60px);
  }
}

.achievements-header {
  @apply mb-6;
}

.achievement-categories {
  @apply flex flex-wrap justify-center gap-2 mb-6;
}

.category-btn {
  @apply px-4 py-2 rounded-full text-sm font-medium transition-all duration-200;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
  border: 1px solid var(--settings-border);
  box-shadow: 0 2px 4px -1px var(--shadow-color);
}

.category-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px var(--shadow-color);
  border-color: var(--settings-accent);
}

.category-btn.active {
  background-color: var(--settings-accent);
  color: #1f2937;
  border-color: var(--settings-accent);
  box-shadow: 0 4px 6px -1px rgba(250, 233, 37, 0.3);
}

.achievements-title {
  @apply text-3xl font-bold text-center mb-6;
  color: var(--settings-text-primary);
  transition: color 0.3s ease;
}

.achievements-stats {
  @apply flex justify-center space-x-4;
}

.stat-card {
  @apply bg-white rounded-lg shadow-md p-6 text-center min-w-24;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
  border: 1px solid var(--settings-border);
  box-shadow: 0 4px 6px -1px var(--shadow-color);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 12px -1px var(--shadow-color);
}

.stat-number {
  @apply text-3xl font-bold mb-2;
  color: var(--settings-accent);
  transition: color 0.3s ease;
}

.stat-label {
  @apply text-sm;
  color: var(--settings-text-secondary);
  transition: color 0.3s ease;
}

.achievements-content {
  @apply max-w-4xl mx-auto flex-1 overflow-y-auto;
  /* 添加自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: var(--settings-border) transparent;
}

/* Webkit浏览器滚动条样式 */
.achievements-content::-webkit-scrollbar {
  width: 8px;
}

.achievements-content::-webkit-scrollbar-track {
  background: transparent;
}

.achievements-content::-webkit-scrollbar-thumb {
  background-color: var(--settings-border);
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.achievements-content::-webkit-scrollbar-thumb:hover {
  background-color: var(--settings-accent);
}

.achievements-grid {
  @apply grid grid-cols-2 gap-4 md:gap-6 pb-6;
  /* 底部添加padding，确保最后一个元素不会被遮挡 */
  /* 始终保持双排显示，移动端使用较小间距 */
}

.achievement-card {
  @apply bg-white rounded-lg shadow-md p-6 flex items-start space-x-4 relative;
  @apply transition-all duration-200 hover:shadow-lg;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
  border: 1px solid var(--settings-border);
  box-shadow: 0 4px 6px -1px var(--shadow-color);
  transition: all 0.3s ease;
  min-height: 120px;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 解锁成就的特殊动画 */
.achievement-card.unlocked {
  animation: fadeInUp 0.6s ease-out, unlockGlow 2s ease-in-out;
}

@keyframes unlockGlow {
  0%, 100% {
    box-shadow: 0 4px 6px -1px rgba(250, 233, 37, 0.3);
  }
  50% {
    box-shadow: 0 8px 16px -1px rgba(250, 233, 37, 0.6);
  }
}

.achievement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 12px -1px var(--shadow-color);
  border-color: var(--settings-accent);
}

.achievement-card.unlocked {
  @apply ring-2;
  background-color: var(--settings-accent);
  color: #1f2937;
  border-color: var(--settings-accent);
  box-shadow: 0 4px 6px -1px rgba(250, 233, 37, 0.3);
}

.achievement-card.unlocked:hover {
  background-color: var(--settings-accent-hover);
  border-color: var(--settings-accent-hover);
  box-shadow: 0 8px 12px -1px rgba(250, 233, 37, 0.4);
}

.achievement-icon {
  @apply text-4xl flex-shrink-0;
  transition: transform 0.3s ease;
}

.achievement-card:hover .achievement-icon {
  transform: scale(1.1);
}

.achievement-info {
  @apply flex-1;
}

.achievement-name {
  @apply text-lg font-semibold mb-2;
  color: var(--settings-text-primary);
  transition: color 0.3s ease;
}

.achievement-card.unlocked .achievement-name {
  color: #1f2937;
}

.achievement-description {
  @apply text-gray-600 mb-3;
  color: var(--settings-text-secondary);
  transition: color 0.3s ease;
}

.achievement-card.unlocked .achievement-description {
  color: #374151;
}

.achievement-date {
  @apply text-sm font-medium;
  color: #10b981;
  transition: color 0.3s ease;
}

.achievement-card.unlocked .achievement-date {
  color: #059669;
}

.achievement-locked {
  @apply text-sm flex items-center;
  color: var(--settings-text-secondary);
  transition: color 0.3s ease;
}

.lock-icon {
  @apply mr-1;
}

.unlock-icon {
  @apply mr-1;
}

.achievement-badge {
  @apply absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium;
  background-color: var(--settings-accent);
  color: #1f2937;
  box-shadow: 0 2px 4px -1px rgba(250, 233, 37, 0.3);
}

.badge-text {
  @apply font-semibold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .achievements-stats {
    @apply space-x-2;
  }
  
  .stat-card {
    @apply min-w-0 flex-1 p-4;
  }
  
  .stat-number {
    @apply text-2xl;
  }
  
  .achievement-categories {
    @apply gap-1 mb-4;
  }
  
  .category-btn {
    @apply px-3 py-1 text-xs;
  }
  
  .achievements-grid {
    @apply gap-3;
  }
  
  .achievement-card {
    @apply p-4 space-x-3 min-h-0;
  }
  
  .achievement-icon {
    @apply text-3xl;
  }
  
  .achievement-name {
    @apply text-base;
  }
  
  .achievement-description {
    @apply text-sm;
  }
  
  .achievement-badge {
    @apply top-1 right-1 px-1 py-0.5 text-xs;
  }
}

/* 深色模式特殊处理 */
[data-theme="dark"] .achievement-card {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .achievement-card:hover {
  box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.4);
}

[data-theme="dark"] .achievement-card.unlocked {
  box-shadow: 0 4px 6px -1px rgba(250, 233, 37, 0.4);
}

[data-theme="dark"] .achievement-card.unlocked:hover {
  box-shadow: 0 8px 12px -1px rgba(250, 233, 37, 0.5);
}
</style>
