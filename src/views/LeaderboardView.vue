<!--
  排行榜视图
  显示各个拼图游戏的排行榜记录
-->

<template>
  <div class="leaderboard-view">
    <!-- 顶部标题栏 -->
    <div class="leaderboard-header">
      <h1 class="leaderboard-title">🏆 游戏排行榜</h1>
      <div class="leaderboard-stats">
        <div class="stat-card">
          <div class="stat-number">{{ totalGames }}</div>
          <div class="stat-label">游戏数量</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ totalRecords }}</div>
          <div class="stat-label">总记录数</div>
        </div>
      </div>
    </div>

    <!-- 游戏列表 -->
    <div class="leaderboard-content">
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="gameLeaderboards.length === 0" class="empty-state">
        <div class="empty-icon">🏆</div>
        <h3>暂无排行榜记录</h3>
        <p>完成一些拼图游戏后，排行榜记录将显示在这里</p>
      </div>

      <div v-else class="games-grid">
        <div
          v-for="gameBoard in gameLeaderboards"
          :key="gameBoard.puzzleId"
          class="game-leaderboard-card"
        >
          <!-- 游戏信息头部 -->
          <div class="game-header">
            <div class="game-info">
              <img 
                v-if="imageUrlCache[gameBoard.gameInfo.imageUrl]"
                :src="imageUrlCache[gameBoard.gameInfo.imageUrl]" 
                :alt="gameBoard.gameInfo.name"
                class="game-icon"
                @error="handleImageError"
              />
              <div 
                v-else 
                class="image-placeholder game-icon"
                @click="loadItemImage(gameBoard.gameInfo.imageUrl)"
              >
                <div class="placeholder-content">
                  <span class="placeholder-text">📷</span>
                </div>
              </div>
              <div class="game-details">
                <h3 class="game-name">{{ gameBoard.gameInfo.name }}</h3>
                <div class="game-meta">
                  <span class="game-difficulty">
                    <span 
                      v-for="star in 5" 
                      :key="star"
                      class="difficulty-star"
                      :class="{ 'filled': star <= gameBoard.gameInfo.difficulty }"
                    >
                      ⭐
                    </span>
                  </span>
                  <span class="record-count">{{ gameBoard.records.length }} 条记录</span>
                </div>
              </div>
            </div>
            <button 
              @click="clearGameRecords(gameBoard.puzzleId, gameBoard.gameInfo.name)"
              class="clear-btn"
              title="清空记录"
            >
              🗑️
            </button>
          </div>

          <!-- 排行榜记录 -->
          <div class="leaderboard-records">
            <div v-if="gameBoard.records.length === 0" class="no-records">
              <span class="no-records-text">暂无记录</span>
            </div>
            <div v-else class="records-list">
              <div
                v-for="(record, index) in gameBoard.records.slice(0, 5)"
                :key="index"
                class="record-item"
                :class="{ 
                  'rank-1': index === 0,
                  'rank-2': index === 1,
                  'rank-3': index === 2
                }"
              >
                <div class="rank">
                  <span class="rank-number">{{ index + 1 }}</span>
                  <span v-if="index < 3" class="rank-medal">
                    {{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}
                  </span>
                </div>
                <div class="record-info">
                  <div class="completion-time">{{ formatTime(record.completionTime) }}</div>
                  <div class="record-meta">
                    <span class="move-count">{{ record.moveCount }} 步</span>
                    <span class="completed-date">{{ formatDate(record.completedAt) }}</span>
                  </div>
                </div>
              </div>
              <div v-if="gameBoard.records.length > 5" class="more-records">
                <button @click="showAllRecords(gameBoard)" class="show-more-btn">
                  查看全部 {{ gameBoard.records.length }} 条记录
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细记录模态框 -->
    <div v-if="showDetailModal" class="modal-overlay ark" @click="closeDetailModal">
      <div class="modal-dialog" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedGame?.gameInfo.name }} - 完整排行榜</h3>
          <button @click="closeDetailModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="detailed-records">
            <div
              v-for="(record, index) in selectedGame?.records"
              :key="index"
              class="detailed-record-item"
            >
              <div class="detailed-rank">{{ index + 1 }}</div>
              <div class="detailed-time">{{ formatTime(record.completionTime) }}</div>
              <div class="detailed-moves">{{ record.moveCount }} 步</div>
              <div class="detailed-date">{{ formatDate(record.completedAt) }}</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeDetailModal" class="modal-btn">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, reactive, watch } from 'vue'
import { useLibraryStore } from '../stores/library'
import { useNotificationStore } from '../stores/notification'
import { imageStorage } from '../utils/imageStorage'
import type { LeaderboardEntry, LibraryItem } from '../types'

// Store
const libraryStore = useLibraryStore()
const notificationStore = useNotificationStore()

// 响应式状态
const isLoading = ref(false)
const showDetailModal = ref(false)
const selectedGame = ref<GameLeaderboard | null>(null)

// 图片URL缓存
const imageUrlCache = reactive<Record<string, string>>({})

// 游戏排行榜数据结构
interface GameLeaderboard {
  puzzleId: string
  gameInfo: LibraryItem
  records: LeaderboardEntry[]
}

// 计算属性
const gameLeaderboards = computed(() => {
  const leaderboards: GameLeaderboard[] = []
  const allRecords = libraryStore.leaderboardRecords
  
  // 按游戏ID分组记录
  const recordsByGame = new Map<string, LeaderboardEntry[]>()
  allRecords.forEach(record => {
    if (!recordsByGame.has(record.puzzleId)) {
      recordsByGame.set(record.puzzleId, [])
    }
    recordsByGame.get(record.puzzleId)!.push(record)
  })
  
  // 为每个有记录的游戏创建排行榜
  recordsByGame.forEach((records, puzzleId) => {
    const gameInfo = libraryStore.items.find(item => item.id === puzzleId)
    if (gameInfo) {
      // 按完成时间排序（从快到慢）
      const sortedRecords = [...records].sort((a, b) => a.completionTime - b.completionTime)
      leaderboards.push({
        puzzleId,
        gameInfo,
        records: sortedRecords
      })
    }
  })
  
  // 按游戏名称排序
  return leaderboards.sort((a, b) => a.gameInfo.name.localeCompare(b.gameInfo.name))
})

const totalGames = computed(() => gameLeaderboards.value.length)
const totalRecords = computed(() => 
  gameLeaderboards.value.reduce((sum, game) => sum + game.records.length, 0)
)

// 方法
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (timestamp: number): string => {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp))
}

// 异步获取图片URL的函数
const getImageUrl = async (imageUrl: string): Promise<string> => {
  if (!imageUrl) return ''

  // 如果不是fs URL，直接返回
  if (!imageUrl.startsWith('fs://')) {
    return imageUrl
  }
  const filename = imageUrl.replace('fs://', '')
  
  // 检查缓存
  if (imageUrlCache[imageUrl]) {
    return imageUrlCache[imageUrl]
  }
  
  try {
    // 获取实际的图片URL
    const blobUrl = await imageStorage.getImageURL(filename)
    imageUrlCache[imageUrl] = blobUrl
    return blobUrl
  } catch (error) {
    console.error('获取图片URL失败:', error)
    return ''
  }
}

// 为排行榜准备图片URL
const prepareImageUrls = async () => {
  const leaderboards = gameLeaderboards.value
  for (const board of leaderboards) {
    if (board.gameInfo.imageUrl && !imageUrlCache[board.gameInfo.imageUrl]) {
      const url = await getImageUrl(board.gameInfo.imageUrl)
      if (url) {
        imageUrlCache[board.gameInfo.imageUrl] = url
      }
    }
  }
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyNkM5IDI2IDkgMTQgMjAgMTRTMzEgMjYgMjAgMjZaIiBmaWxsPSIjOUI5QkEzIi8+CjwvZz4KPC9zdmc+'
}


const loadItemImage = async (imageUrl: string) => {
  if (!imageUrl || imageUrlCache[imageUrl]) return
  
  try {
    const blobUrl = await getImageUrl(imageUrl)
    if (blobUrl) {
      imageUrlCache[imageUrl] = blobUrl
    }
  } catch (error) {
    console.error('加载图片失败:', imageUrl, error)
  }
}

const clearGameRecords = async (puzzleId: string, gameName: string) => {
  const confirmed = await notificationStore.showConfirm({
    title: '清空排行榜记录',
    message: `确定要清空「${gameName}」的所有排行榜记录吗？\n\n此操作无法撤销。`,
    type: 'danger',
    confirmText: '清空',
    cancelText: '取消'
  })
  
  if (confirmed) {
    libraryStore.clearLeaderboardRecords(puzzleId)
  }
}

const showAllRecords = (gameBoard: GameLeaderboard) => {
  selectedGame.value = gameBoard
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedGame.value = null
}

// 生命周期
onMounted(() => {
  console.log('排行榜视图已加载')
  console.log('当前排行榜记录:', libraryStore.leaderboardRecords)
  console.log('排行榜记录数量:', libraryStore.leaderboardRecords.length)
  console.log('localStorage中的排行榜记录:', localStorage.getItem('puzzle_leaderboard'))
  
  // 预加载图片
  prepareImageUrls()
})

// 监听gameLeaderboards变化，预加载图片
watch(gameLeaderboards, () => {
  prepareImageUrls()
}, { immediate: true })
</script>

<style scoped>
.leaderboard-view {
  @apply h-screen flex flex-col;
  background-color: var(--settings-bg);
}

/* 移动端适配：为固定头部栏预留空间 */
@media (max-width: 767px) {
  .leaderboard-view {
    height: calc(100vh - 60px);
  }
}

.leaderboard-header {
  @apply flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 shadow-sm border-b;
  background-color: var(--settings-card-bg);
  border-bottom-color: var(--settings-border);
}

.leaderboard-title {
  @apply text-2xl font-bold;
  color: var(--settings-text-primary);
}

.leaderboard-stats {
  @apply flex items-center space-x-4;
}

.stat-card {
  @apply rounded-lg shadow-md p-4 text-center min-w-20;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
  border: 1px solid var(--settings-border);
}

.stat-number {
  @apply text-2xl font-bold mb-1;
  color: var(--settings-accent);
}

.stat-label {
  @apply text-xs;
  color: var(--settings-text-secondary);
}

.leaderboard-content {
  @apply flex-1 overflow-y-auto p-4;
}

.loading-state {
  @apply flex flex-col items-center justify-center h-64;
}

.loading-spinner {
  @apply w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4;
}

.empty-state {
  @apply flex flex-col items-center justify-center h-64 text-center;
}

.empty-icon {
  @apply text-8xl mb-4;
}

.empty-state h3 {
  @apply text-xl font-semibold mb-2;
  color: var(--settings-text-primary);
}

.empty-state p {
  color: var(--settings-text-secondary);
}

.games-grid {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}

.game-leaderboard-card {
  @apply rounded-lg shadow-md overflow-hidden;
  background-color: var(--settings-card-bg);
  border: 1px solid var(--settings-border);
}

.game-header {
  @apply flex items-center justify-between p-4 border-b;
  border-bottom-color: var(--settings-border);
}

.game-info {
  @apply flex items-center space-x-3;
}

.game-icon {
  @apply w-12 h-12 rounded-lg object-cover;
}

.image-placeholder {
  @apply w-12 h-12 rounded-lg flex items-center justify-center cursor-pointer transition-colors;
  background-color: var(--settings-hover);
}

.image-placeholder:hover {
  background-color: var(--settings-border);
}

.placeholder-content {
  @apply flex items-center justify-center w-full h-full;
}

.placeholder-text {
  @apply text-lg;
  color: var(--settings-text-secondary);
}

.game-details {
  @apply flex-1;
}

.game-name {
  @apply text-lg font-semibold mb-1;
  color: var(--settings-text-primary);
}

.game-meta {
  @apply flex items-center space-x-3 text-sm;
}

.difficulty-star {
  @apply text-xs;
  opacity: 0.3;
  color: var(--settings-text-secondary);
}

.difficulty-star.filled {
  opacity: 1;
  color: #f59e0b;
}

.record-count {
  color: var(--settings-text-secondary);
}

.clear-btn {
  @apply p-2 rounded-lg transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-secondary);
}

.clear-btn:hover {
  background-color: #fee2e2;
  color: #dc2626;
}

[data-theme="dark"] .clear-btn:hover {
  background-color: #7f1d1d;
  color: #fca5a5;
}

.leaderboard-records {
  @apply p-4;
}

.no-records {
  @apply text-center py-8;
}

.no-records-text {
  color: var(--settings-text-secondary);
}

.records-list {
  @apply space-y-3;
}

.record-item {
  @apply flex items-center space-x-4 p-3 rounded-lg;
  background-color: var(--settings-hover);
}

.record-item.rank-1 {
  background-color: #fef3c7;
  border: 1px solid #f59e0b;
}

[data-theme="dark"] .record-item.rank-1 {
  background-color: #451a03;
  border: 1px solid #f59e0b;
}

.record-item.rank-2 {
  background-color: #f3f4f6;
  border: 1px solid #9ca3af;
}

[data-theme="dark"] .record-item.rank-2 {
  background-color: #374151;
  border: 1px solid #6b7280;
}

.record-item.rank-3 {
  background-color: #fef2f2;
  border: 1px solid #f87171;
}

[data-theme="dark"] .record-item.rank-3 {
  background-color: #7f1d1d;
  border: 1px solid #f87171;
}

.rank {
  @apply flex items-center space-x-2 min-w-16;
}

.rank-number {
  @apply text-lg font-bold;
  color: var(--settings-text-primary);
}

.rank-medal {
  @apply text-lg;
}

.record-info {
  @apply flex-1;
}

.completion-time {
  @apply text-lg font-semibold;
  color: var(--settings-text-primary);
}

.record-meta {
  @apply flex items-center space-x-3 text-sm;
  color: var(--settings-text-secondary);
}

.more-records {
  @apply text-center mt-4;
}

.show-more-btn {
  @apply px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200;
  background-color: var(--settings-accent);
  color: #1f2937;
}

.show-more-btn:hover {
  background-color: var(--settings-accent-hover, #2563eb);
}

/* 模态框样式 */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-dialog {
  @apply rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-96;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
}

.modal-header {
  @apply flex items-center justify-between p-4 border-b;
  border-bottom-color: var(--settings-border);
}

.modal-header h3 {
  @apply text-lg font-semibold;
}

.close-btn {
  @apply text-2xl cursor-pointer;
  color: var(--settings-text-secondary);
}

.close-btn:hover {
  color: var(--settings-text-primary);
}

.modal-body {
  @apply p-4 overflow-y-auto max-h-80;
}

.detailed-records {
  @apply space-y-2;
}

.detailed-record-item {
  @apply grid grid-cols-4 gap-4 p-3 rounded-lg;
  background-color: var(--settings-hover);
}

.detailed-rank {
  @apply font-semibold;
  color: var(--settings-text-primary);
}

.detailed-time {
  @apply font-mono;
  color: var(--settings-text-primary);
}

.detailed-moves {
  color: var(--settings-text-secondary);
}

.detailed-date {
  @apply text-sm;
  color: var(--settings-text-secondary);
}

.modal-footer {
  @apply flex justify-end p-4 border-t;
  border-top-color: var(--settings-border);
}

.modal-btn {
  @apply px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
}

.modal-btn:hover {
  background-color: var(--settings-border);
}

/* 移动端适配 */
@media (max-width: 767px) {
  .leaderboard-header {
    @apply flex-col space-y-3;
  }
  
  .leaderboard-stats {
    @apply w-full justify-center;
  }
  
  .games-grid {
    @apply grid-cols-1;
  }
  
  .game-header {
    @apply flex-col space-y-3;
  }
  
  .game-info {
    @apply w-full;
  }
  
  .modal-dialog {
    @apply w-full max-w-none mx-2;
  }
  
  .detailed-record-item {
    @apply grid-cols-2 gap-2;
  }
}
</style>