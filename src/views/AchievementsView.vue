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

    <!-- 成就列表 -->
    <div class="achievements-content">
      <div class="achievements-grid">
        <div
          v-for="achievement in achievements"
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
              解锁时间: {{ formatDate(achievement.unlockedAt) }}
            </div>
            <div v-else class="achievement-locked">
              🔒 未解锁
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useLibraryStore } from '../stores/library'
import { useGameStore } from '../stores/game'
import type { DateValue } from '../types'

// Store
const libraryStore = useLibraryStore()

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
  @apply mb-8;
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
  @apply bg-white rounded-lg shadow-md p-6 flex items-start space-x-4;
  @apply transition-all duration-200 hover:shadow-lg;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
  border: 1px solid var(--settings-border);
  box-shadow: 0 4px 6px -1px var(--shadow-color);
  transition: all 0.3s ease;
}

.achievement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 12px -1px var(--shadow-color);
  border-color: var(--settings-accent);
}

.achievement-card.unlocked {
  @apply ring-2;
  background-color: var(--settings-accent);
  color: #ffffff;
  border-color: var(--settings-accent);
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
}

.achievement-card.unlocked:hover {
  background-color: var(--settings-accent-hover);
  border-color: var(--settings-accent-hover);
  box-shadow: 0 8px 12px -1px rgba(59, 130, 246, 0.4);
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
  color: #ffffff;
}

.achievement-description {
  @apply text-gray-600 mb-3;
  color: var(--settings-text-secondary);
  transition: color 0.3s ease;
}

.achievement-card.unlocked .achievement-description {
  color: rgba(255, 255, 255, 0.9);
}

.achievement-date {
  @apply text-sm font-medium;
  color: #10b981;
  transition: color 0.3s ease;
}

.achievement-card.unlocked .achievement-date {
  color: #a7f3d0;
}

.achievement-locked {
  @apply text-sm;
  color: var(--settings-text-secondary);
  transition: color 0.3s ease;
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
  
  .achievements-grid {
    @apply gap-3;
  }
  
  .achievement-card {
    @apply p-4 space-x-3;
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
}

/* 深色模式特殊处理 */
[data-theme="dark"] .achievement-card {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .achievement-card:hover {
  box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.4);
}

[data-theme="dark"] .achievement-card.unlocked {
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.4);
}

[data-theme="dark"] .achievement-card.unlocked:hover {
  box-shadow: 0 8px 12px -1px rgba(59, 130, 246, 0.5);
}
</style>
