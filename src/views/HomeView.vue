<!--
  主页视图
  拼图乐应用的主页，展示应用特色和快速导航
-->

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLibraryStore } from '../stores/library'
import { useSettingsStore } from '../stores/settings'

const router = useRouter()
const libraryStore = useLibraryStore()
const settingsStore = useSettingsStore()

// 响应式状态
const isLoading = ref(true)

// 计算属性
const totalPuzzles = computed(() => libraryStore.items.length)
const userPuzzles = computed(() => libraryStore.userItems.length)
const builtInPuzzles = computed(() => libraryStore.builtInItems.length)

// 快速导航卡片
const quickNavCards = [
  {
    title: '素材库',
    description: '浏览和管理拼图素材',
    icon: '📚',
    path: '/library',
    color: 'blue',
    stats: `${totalPuzzles.value} 个拼图`
  },
  {
    title: '编辑器',
    description: '创建自定义拼图',
    icon: '✏️',
    path: '/editor',
    color: 'green',
    stats: `${userPuzzles.value} 个自定义`
  },
  {
    title: '游戏',
    description: '开始拼图挑战',
    icon: '🎮',
    path: '/game',
    color: 'purple',
    stats: '开始游戏'
  },
  {
    title: '成就',
    description: '查看解锁的成就',
    icon: '🎖️',
    path: '/achievements',
    color: 'yellow',
    stats: '查看成就'
  }
]

// 应用特色
const features = [
  {
    icon: '🧩',
    title: '智能拼图',
    description: '支持自定义网格大小和难度等级，适应不同技能水平'
  },
  {
    icon: '🎨',
    title: '创意编辑器',
    description: '强大的拼图编辑器，让您轻松创建独特的拼图作品'
  },
  {
    icon: '📱',
    title: '响应式设计',
    description: '完美适配桌面和移动设备，随时随地享受拼图乐趣'
  },
  {
    icon: '🏆',
    title: '成就系统',
    description: '丰富的成就系统，记录您的拼图成长历程'
  }
]

// 方法
const navigateTo = (path: string) => {
  router.push(path)
}

const startQuickGame = () => {
  // 如果有拼图，随机选择一个开始游戏
  if (totalPuzzles.value > 0) {
    const randomPuzzle = libraryStore.items[Math.floor(Math.random() * libraryStore.items.length)]
    router.push(`/game/${randomPuzzle.id}`)
  } else {
    // 如果没有拼图，跳转到素材库
    router.push('/library')
  }
}

// 生命周期
onMounted(async () => {
  try {
    // 确保素材库已初始化
    await libraryStore.initializeLibrary()
  } catch (error) {
    console.error('素材库初始化失败:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="home-view">
    <!-- 英雄区域 -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <div class="hero-title-container">
            <h1 class="hero-style-title">PUZZLE</h1>
            <h1 class="hero-style-title">FUN</h1>
            <h1 class="hero-title">拼图乐</h1>
            <div class="hero-subtitle">Puzzle Fun</div>
          </div>
          <p class="hero-description">
            体验最有趣的拼图游戏，挑战你的逻辑思维和空间想象力。
            创建自定义拼图，与朋友分享，享受无尽的拼图乐趣！
          </p>
          <div class="hero-actions">
            <button @click="startQuickGame" class="hero-btn primary">
              <span class="btn-icon">🎮</span>
              开始游戏
            </button>
            <button @click="navigateTo('/library')" class="hero-btn secondary">
              <span class="btn-icon">📚</span>
              浏览素材库
            </button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="puzzle-preview">
            <div class="puzzle-piece" v-for="i in 9" :key="i" :class="`piece-${i}`">
              <div class="piece-inner"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 快速导航 -->
    <section class="quick-nav-section">
      <div class="section-header">
        <h2 class="section-title">快速导航</h2>
        <p class="section-description">选择您想要的功能</p>
      </div>
      
      <div class="nav-cards">
        <div
          v-for="card in quickNavCards"
          :key="card.title"
          class="nav-card"
          :class="`card-${card.color}`"
          @click="navigateTo(card.path)"
        >
          <div class="card-icon">{{ card.icon }}</div>
          <div class="card-content">
            <h3 class="card-title">{{ card.title }}</h3>
            <p class="card-description">{{ card.description }}</p>
            <div class="card-stats">{{ card.stats }}</div>
          </div>
          <div class="card-arrow">→</div>
        </div>
      </div>
    </section>

    <!-- 应用特色 -->
    <section class="features-section">
      <div class="section-header">
        <h2 class="section-title">应用特色</h2>
        <p class="section-description">发现拼图乐的强大功能</p>
      </div>
      
      <div class="features-grid">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="feature-card"
        >
          <div class="feature-icon">{{ feature.icon }}</div>
          <div class="feature-content">
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 统计信息 -->
    <section class="stats-section">
      <div class="section-header">
        <h2 class="section-title">数据统计</h2>
        <p class="section-description">您的拼图收藏</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🧩</div>
          <div class="stat-content">
            <div class="stat-number">{{ totalPuzzles }}</div>
            <div class="stat-label">总拼图数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎨</div>
          <div class="stat-content">
            <div class="stat-number">{{ userPuzzles }}</div>
            <div class="stat-label">自定义拼图</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-content">
            <div class="stat-number">{{ builtInPuzzles }}</div>
            <div class="stat-label">内置拼图</div>
          </div>
        </div>
      </div>
    </section>


    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  @apply w-full;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

/* 英雄区域 */
.hero-section {
  @apply py-12 px-4 sm:px-6 lg:px-8;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  background: linear-gradient(0deg, #00000000, #000000ff), linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  min-height: 15rem;
  max-height: 40vh;
}

.hero-content {
  @apply max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center;
}

.hero-text {
  @apply space-y-6;
}

/* 英雄区域标题样式 */
.hero-title-container {
  --theme-color-primary: #fae925; 
  --theme-color-secondary: #e8d620;
  --font-size: 4.2rem;

  @apply flex items-baseline space-x-3;
  flex-direction: column;
  position: relative;
  width: 100%;
  margin-bottom: 1rem;
}

.hero-style-title {
  font-size: var(--font-size);
  line-height: calc(var(--font-size) * 0.9);
  font-weight: 800;
  font-family: 'Gotham Pro', sans-serif;
  background: linear-gradient(45deg,
    var(--theme-color-primary) 0 15%,
    var(--theme-color-secondary) 15% 20%,
    var(--theme-color-primary) 20% 35%,
    var(--theme-color-secondary) 35% 40%,
    var(--theme-color-primary) 40% 55%,
    var(--theme-color-secondary) 55% 60%,
    var(--theme-color-primary) 60% 75%,
    var(--theme-color-secondary) 75% 80%,
    var(--theme-color-primary) 80% 95%,
    var(--theme-color-secondary) 95% 100%);

  background-clip: text;
  color: transparent;
  -webkit-background-clip: text;
  letter-spacing: -0.02em;
}

.hero-title {
  @apply text-2xl font-bold;
  color: var(--theme-color-primary);
  background-color: #000000;
  padding: 0rem 0.5rem;

  position: absolute;
  top: calc(var(--font-size) * 0.6);
  left: min(calc(var(--font-size) * 2.6), 50vw);
}

.hero-subtitle {
  color: #ffffff;
  background-color: #000000;
  padding: 0.2rem 0.5rem;
  margin: 0.5rem 0;
  font-weight: 600;
  font-size: 1.1rem;
}

.hero-description {
  @apply text-lg leading-relaxed;
  color: var(--text-secondary);
}

.hero-actions {
  @apply flex flex-col sm:flex-row gap-4;
}

.hero-btn {
  @apply flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200;
  @apply transform hover:scale-105 active:scale-95;
}

.hero-btn.primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
  background-color: var(--settings-accent);
  color: #1f2937;
}

.hero-btn.primary:hover {
  background-color: var(--settings-accent-hover);
}

.hero-btn.secondary {
  @apply px-6 py-3 text-base font-medium rounded-lg transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
}

.hero-btn.secondary:hover {
  background-color: var(--settings-border);
}

.hero-btn.secondary:hover {
  background-color: var(--settings-border);
}

.btn-icon {
  @apply text-lg mr-2;
}

/* 拼图预览动画 */
.hero-visual {
  @apply flex justify-center items-center;
}

.puzzle-preview {
  @apply grid grid-cols-3 gap-2 p-4;
  background-color: var(--settings-card-bg);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.puzzle-piece {
  @apply w-16 h-16 relative;
  animation: float 3s ease-in-out infinite;
}

.puzzle-piece:nth-child(1) { animation-delay: 0s; }
.puzzle-piece:nth-child(2) { animation-delay: 0.2s; }
.puzzle-piece:nth-child(3) { animation-delay: 0.4s; }
.puzzle-piece:nth-child(4) { animation-delay: 0.6s; }
.puzzle-piece:nth-child(5) { animation-delay: 0.8s; }
.puzzle-piece:nth-child(6) { animation-delay: 1s; }
.puzzle-piece:nth-child(7) { animation-delay: 1.2s; }
.puzzle-piece:nth-child(8) { animation-delay: 1.4s; }
.puzzle-piece:nth-child(9) { animation-delay: 1.6s; }

.piece-inner {
  @apply w-full h-full rounded-lg;
  background: linear-gradient(45deg, #fae925, #e8d620, #d4c41a);
  opacity: 0.8;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* 通用区域样式 */
.quick-nav-section,
.features-section,
.stats-section {
  @apply py-12 px-4 sm:px-6 lg:px-8;
}

.section-header {
  @apply text-center mb-8;
}

.section-title {
  @apply text-3xl sm:text-4xl font-bold mb-4;
  color: var(--text-primary);
}

.section-description {
  @apply text-lg;
  color: var(--text-secondary);
}

/* 快速导航卡片 */
.nav-cards {
  @apply grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto;
}

.nav-card {
  @apply bg-white rounded-xl p-4 sm:p-6 cursor-pointer transition-all duration-200;
  @apply transform hover:scale-105 hover:shadow-lg;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
  border: 1px solid var(--settings-border);
}

.nav-card:hover {
  border-color: var(--settings-accent);
}

.card-icon {
  @apply text-3xl sm:text-4xl mb-3 sm:mb-4 text-center;
}

.card-content {
  @apply space-y-2 text-center;
}

.card-title {
  @apply text-lg sm:text-xl font-semibold;
}

.card-description {
  @apply text-sm;
  color: var(--settings-text-secondary);
}

.card-stats {
  @apply text-xs font-medium;
  color: var(--settings-accent);
}

.card-arrow {
  @apply text-2xl mt-4 text-center;
  color: var(--settings-text-secondary);
}

/* 特色网格 */
.features-grid {
  @apply grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto;
}

.feature-card {
  @apply bg-white rounded-xl p-4 sm:p-6 text-center;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
  border: 1px solid var(--settings-border);
}

.feature-icon {
  @apply text-3xl sm:text-4xl mb-3 sm:mb-4;
}

.feature-title {
  @apply text-base sm:text-lg font-semibold mb-2;
}

.feature-description {
  @apply text-sm;
  color: var(--settings-text-secondary);
}

/* 统计网格 */
.stats-grid {
  @apply grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto mb-8;
}

.stat-card {
  @apply bg-white rounded-xl p-4 sm:p-6 flex items-center space-x-3 sm:space-x-4;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
  border: 1px solid var(--settings-border);
}

.stat-icon {
  @apply text-2xl sm:text-3xl;
}

.stat-content {
  @apply space-y-1;
}

.stat-number {
  @apply text-xl sm:text-2xl font-bold;
  color: var(--settings-accent);
}

.stat-label {
  @apply text-sm;
  color: var(--settings-text-secondary);
}

/* 加载状态 */
.loading-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.loading-spinner {
  @apply w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4;
}

/* 移动端优化 */
@media (max-width: 767px) {
  .hero-section {
    @apply py-8;
  }
  
  .hero-title-container {
    --font-size: 3rem;
  }
  
  .hero-title {
    font-size: 1.5rem;
    left: min(calc(var(--font-size) * 2.2), 40vw);
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .hero-description {
    @apply text-base;
  }
  
  .puzzle-preview {
    @apply scale-75;
  }
  
  /* 移动端保持双栏布局 */
  .nav-cards {
    @apply grid-cols-2 gap-3;
  }
  
  .features-grid {
    @apply grid-cols-2 gap-3;
  }
  
  .stats-grid {
    @apply grid-cols-1 gap-4;
  }
}

/* 卡片颜色主题 */
.card-blue:hover {
  border-color: #fae925;
}

.card-green:hover {
  border-color: #e8d620;
}

.card-purple:hover {
  border-color: #d4c41a;
}

.card-yellow:hover {
  border-color: #fae925;
}
</style>
