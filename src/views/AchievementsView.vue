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

// Store
const libraryStore = useLibraryStore()
const gameStore = useGameStore()

// 计算属性
const achievements = computed(() => libraryStore.achievements)
const unlockedAchievements = computed(() => libraryStore.unlockedAchievements)

const unlockedCount = computed(() => unlockedAchievements.value.length)
const totalCount = computed(() => achievements.value.length)
const completionRate = computed(() => {
  return totalCount.value > 0 ? Math.round((unlockedCount.value / totalCount.value) * 100) : 0
})

// 方法
const formatDate = (date: Date): string => {
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
  libraryStore.checkAchievements(gameStore.userStats)
})
</script>

<style scoped>
.achievements-view {
  @apply min-h-screen bg-gray-50 p-6;
}

.achievements-header {
  @apply mb-8;
}

.achievements-title {
  @apply text-3xl font-bold text-center text-gray-800 mb-6;
}

.achievements-stats {
  @apply flex justify-center space-x-8;
}

.stat-card {
  @apply bg-white rounded-lg shadow-md p-6 text-center min-w-24;
}

.stat-number {
  @apply text-3xl font-bold text-blue-600 mb-2;
}

.stat-label {
  @apply text-sm text-gray-600;
}

.achievements-content {
  @apply max-w-4xl mx-auto;
}

.achievements-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.achievement-card {
  @apply bg-white rounded-lg shadow-md p-6 flex items-start space-x-4;
  @apply transition-all duration-200 hover:shadow-lg;
}

.achievement-card.unlocked {
  @apply ring-2 ring-yellow-400 bg-yellow-50;
}

.achievement-icon {
  @apply text-4xl flex-shrink-0;
}

.achievement-info {
  @apply flex-1;
}

.achievement-name {
  @apply text-lg font-semibold text-gray-800 mb-2;
}

.achievement-description {
  @apply text-gray-600 mb-3;
}

.achievement-date {
  @apply text-sm text-green-600 font-medium;
}

.achievement-locked {
  @apply text-sm text-gray-400;
}
</style>
