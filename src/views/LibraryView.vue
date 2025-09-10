<!--
  素材库视图
  展示和管理拼图素材的主界面
-->
<!-- 
  🗑️不符合MVVM规范的代码：View直接持有Store的实例
  未来应该重写
-->
  
<template>
  <div class="library-view">
    <!-- 顶部工具栏 -->
    <div class="library-header">
      <div class="header-title-container">
        <h1 class="library-style-title">JIGSAW</h1>
        <h1 class="library-style-title">LIBRARY</h1>
        <h1 class="library-title">拼图素材库</h1>
        <div class="library-stats">
          {{ filteredItems.length }} 个拼图, {{ userItems.length }} 个自定义
        </div>
      </div>
    </div>

    <!-- 搜索和筛选栏 -->
    <div class="filter-bar">
      <div class="search-box">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索拼图名称、标签或类别..."
          class="ark"
        />
      </div>
      
      <div class="filter-controls">
        <select v-model="selectedCategory" class="category-select ark">
          <option v-for="category in availableCategories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
        
        <select v-model="selectedDifficulty" class="difficulty-select ark">
          <option :value="null">全部难度</option>
          <option v-for="difficulty in availableDifficulties" :key="difficulty" :value="difficulty">
            {{ getDifficultyLabel(difficulty) }}
          </option>
        </select>
        
        <button 
          @click="setSortBy('name')"
          class="sort-btn"
          :class="{ 'active': sortBy === 'name' }"
        >
          名称 {{ sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
        </button>
        
        <button 
          @click="setSortBy('difficulty')"
          class="sort-btn"
          :class="{ 'active': sortBy === 'difficulty' }"
        >
          难度 {{ sortBy === 'difficulty' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
        </button>
      </div>
    </div>

    <!-- 拼图网格 -->
    <div class="library-content">
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="filteredItems.length === 0" class="empty-state">
        <div class="empty-icon">🧩</div>
        <h3>没有找到拼图</h3>
        <p v-if="searchKeyword || selectedCategory !== '全部'">
          尝试调整搜索条件或筛选器
        </p>
        <p v-else>
          素材库为空
        </p>
      </div>
      
      <div v-else class="puzzle-grid">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="puzzle-card"
          @click="handleCardClick(item)"
        >
          <div class="card-image">
            <img 
              v-if="imageUrlCache[item.imageUrl]"
              :src="imageUrlCache[item.imageUrl]" 
              :alt="item.name" 
            />
            <div 
              v-else 
              class="image-placeholder"
              @click="loadItemImage(item.imageUrl)"
            >
              <div class="placeholder-content">
                <div class="placeholder-icon">🖼️</div>
                <div class="placeholder-text">加载中...</div>
              </div>
            </div>
            <div class="card-overlay">
              <div class="overlay-actions hidden md:flex">
                <button @click.stop="playPuzzle(item)" class="overlay-btn primary">
                  🎮 开始游戏
                </button>
                <button v-if="!item.isBuiltIn" @click.stop="editPuzzle(item)" class="overlay-btn">
                  ✏️ 编辑
                </button>
                <button v-if="!item.isBuiltIn" @click.stop="deletePuzzle(item)" class="overlay-btn danger">
                  🗑️ 删除
                </button>
              </div>
            </div>
          </div>
          
          <div class="card-content">
            <h3 class="card-title">{{ item.name }}</h3>
            <div class="card-meta">
              <span class="card-category">{{ item.category }}</span>
              <div class="card-difficulty">
                <span 
                  v-for="star in 5" 
                  :key="star"
                  class="difficulty-star"
                  :class="{ 
                    'filled': star <= getItemDifficulty(item),
                    [`difficulty-${getItemDifficulty(item)}`]: star <= getItemDifficulty(item)
                  }"
                >
                  ⭐
                </span>
              </div>
            </div>
            <div class="card-tags">
              <span 
                v-for="tag in item.tags.slice(0, 3)" 
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
              <span v-if="item.tags.length > 3" class="tag more">
                +{{ item.tags.length - 3 }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- 删除确认对话框 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-dialog delete-modal" @click.stop>
        <div class="modal-header">
          <h3>确认删除</h3>
          <button @click="closeDeleteModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <p>确定要删除拼图 "{{ itemToDelete?.name }}" 吗？</p>
          <p class="delete-warning">此操作无法撤销。</p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="modal-btn">
            取消
          </button>
          <button @click="confirmDelete" class="modal-btn danger">
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 移动端操作对话框 -->
    <div v-if="showMobileActions" class="modal-overlay" @click="closeMobileActionDialog">
      <div class="modal-dialog mobile-actions-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedMobileItem?.name }}</h3>
          <button @click="closeMobileActionDialog" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="mobile-action-buttons">
            <button @click="playPuzzleFromDialog" class="mobile-action-btn primary">
              <span class="action-icon">🎮</span>
              <span class="action-text">开始游戏</span>
            </button>
            
            <button 
              v-if="selectedMobileItem && !selectedMobileItem.isBuiltIn" 
              @click="editPuzzleFromDialog" 
              class="mobile-action-btn"
            >
              <span class="action-icon">✏️</span>
              <span class="action-text">编辑拼图</span>
            </button>
            
            <button 
              v-if="selectedMobileItem && !selectedMobileItem.isBuiltIn" 
              @click="deletePuzzleFromDialog" 
              class="mobile-action-btn danger"
            >
              <span class="action-icon">🗑️</span>
              <span class="action-text">删除拼图</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLibraryStore } from '../stores/library'
import { calculatePuzzleDifficulty, calculateBasicDifficulty } from '../utils/difficultyUtils'
import type { LibraryItem } from '../types'
import { imageStorage } from '../utils/imageStorage'
import "@/assets/ark.css"

// Store和路由
const libraryStore = useLibraryStore()
const router = useRouter()

// 响应式状态
const showDeleteModal = ref(false)
const itemToDelete = ref<LibraryItem | null>(null)
const showMobileActions = ref(false)
const selectedMobileItem = ref<LibraryItem | null>(null)

// 图片URL缓存
const imageUrlCache = reactive<Record<string, string>>({})

// 异步获取图片URL的函数
const getImageUrl = async (imageUrl: string): Promise<string> => {
  if (!imageUrl) return ''

  // 如果不是fs URL`，直接返回
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

// 为每个项目准备图片URL
const prepareImageUrls = async () => {
  const items = filteredItems.value
  for (const item of items) {
    if (item.imageUrl && !imageUrlCache[item.imageUrl]) {
      imageUrlCache[item.imageUrl] = await getImageUrl(item.imageUrl) // 异步加载，不等待
    }
  }
}

// 计算属性
const filteredItems = computed(() => libraryStore.filteredItems)
const userItems = computed(() => libraryStore.userItems)
const availableCategories = computed(() => libraryStore.availableCategories)
const availableDifficulties = computed(() => libraryStore.availableDifficulties)
const categories = computed(() => libraryStore.categories)
const isLoading = computed(() => libraryStore.isLoading)
const sortBy = computed(() => libraryStore.sortBy)
const sortOrder = computed(() => libraryStore.sortOrder)

const searchKeyword = computed({
  get: () => libraryStore.searchKeyword,
  set: (value) => libraryStore.setSearchKeyword(value)
})

const selectedCategory = computed({
  get: () => libraryStore.selectedCategory,
  set: (value) => libraryStore.setSelectedCategory(value)
})

const selectedDifficulty = computed({
  get: () => libraryStore.selectedDifficulty,
  set: (value) => libraryStore.setSelectedDifficulty(value)
})

// 监听filteredItems变化，预加载图片
watch(filteredItems, () => {
  prepareImageUrls()
}, { immediate: true })

// 方法

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

const selectPuzzle = (item: LibraryItem) => {
  // 可以显示拼图详情或直接开始游戏
  console.log('选择拼图:', item.name)
}

const handleCardClick = (item: LibraryItem) => {
  // 检查是否为移动端（使用简单的屏幕宽度检测）
  const isMobile = window.innerWidth < 768
  
  if (isMobile) {
    showMobileActionDialog(item)
  } else {
    selectPuzzle(item)
  }
}

const playPuzzle = (item: LibraryItem) => {
  router.push(`/game/${item.id}`)
}

const editPuzzle = (item: LibraryItem) => {
  // 如果有编辑功能，跳转到编辑器
  router.push('/editor')
}

const deletePuzzle = (item: LibraryItem) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const confirmDelete = () => {
  if (itemToDelete.value) {
    libraryStore.removeLibraryItem(itemToDelete.value.id)
    closeDeleteModal()
  }
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  itemToDelete.value = null
}

const setSortBy = (field: 'name' | 'difficulty' | 'date') => {
  libraryStore.setSortBy(field)
}

const showMobileActionDialog = (item: LibraryItem) => {
  selectedMobileItem.value = item
  showMobileActions.value = true
}

const closeMobileActionDialog = () => {
  showMobileActions.value = false
  selectedMobileItem.value = null
}

const playPuzzleFromDialog = () => {
  if (selectedMobileItem.value) {
    playPuzzle(selectedMobileItem.value)
    closeMobileActionDialog()
  }
}

const editPuzzleFromDialog = () => {
  if (selectedMobileItem.value) {
    editPuzzle(selectedMobileItem.value)
    closeMobileActionDialog()
  }
}

const deletePuzzleFromDialog = () => {
  if (selectedMobileItem.value) {
    deletePuzzle(selectedMobileItem.value)
    closeMobileActionDialog()
  }
}

const getItemDifficulty = (item: LibraryItem) => {
  // 优先使用预设的难度值
  if (item.difficulty) {
    return item.difficulty
  }
  
  // 如果没有预设难度但有puzzleData，使用完整的难度计算
  if (item.puzzleData) {
    return calculatePuzzleDifficulty(item.puzzleData)
  }
  
  // 如果都没有，使用基础难度计算（假设为3x3网格）
  const defaultGridConfig = {
    rows: 3,
    cols: 3,
    pieceWidth: 100,
    pieceHeight: 100
  }
  
  return calculateBasicDifficulty(defaultGridConfig)
}

const getDifficultyLabel = (difficulty: number) => {
  const labels = ['', '简单', '容易', '中等', '困难', '极难']
  return `${difficulty}星 ${labels[difficulty] || ''}`
}

// 生命周期
onMounted(() => {
  // 素材库已在App.vue中统一初始化，无需重复调用
  console.log('LibraryView 已加载')
  
  // 预加载当前显示的图片
  prepareImageUrls()
})
</script>

<style scoped>
.library-view {
  @apply h-screen flex flex-col;
  background-color: var(--settings-bg);
}

/* 移动端适配：为固定头部栏预留空间 */
@media (max-width: 767px) {
  .library-view {
    height: calc(100vh - 60px);
  }
}

.library-header {
  --theme-color-primary: #fae925; 
  --theme-color-secondary: #e8d620;

  --font-size: 4.2rem;

  @apply flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 shadow-sm border-b;
  background: linear-gradient(0deg, #00000000, #000000ff);
  border-bottom-color: var(--settings-border);
  min-height: 15rem;
  max-height: 40vh;
}

/* 移动端头部优化 */
@media (max-width: 640px) {
  .library-header {
    @apply space-y-3;
  }
  
  .header-left {
    @apply w-full justify-between;
  }
  
  .header-right {
    @apply w-full justify-center;
  }
}

.header-left {
  @apply flex items-center space-x-6;
}

.header-title-container {
  @apply flex items-baseline space-x-3;
  flex-direction: column;
  position: relative;
  width: 100%;
}

.library-style-title {
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

.library-title {
  @apply text-2xl font-bold;
  color: var(--theme-color-primary);
  background-color: #000000;
  padding: 0rem 0.5rem;

  position: absolute;
  top: calc(var(--font-size) * 0.6);
  left: min(calc(var(--font-size) * 2.6), 50vw);
}

.library-stats {
  color: #ffffff;
  background-color: #000000;
  padding: 0.2rem 0.5rem;
  margin: 0.5rem 0;
  font-weight: 600;
}

.stat-item {
  @apply px-3 py-1 rounded-full;
  background-color: var(--settings-hover);
}

.header-right {
  @apply flex items-center space-x-3;
}

.action-btn {
  @apply px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
}

.action-btn:hover {
  background-color: var(--settings-border);
}

.action-btn.primary {
  background-color: var(--settings-accent);
  color: #ffffff;
}

.action-btn.primary:hover {
  background-color: var(--settings-accent-hover);
}

.filter-bar {
  @apply flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b;
  background-color: var(--settings-card-bg);
  border-bottom-color: var(--settings-border);
}

/* 移动端筛选栏优化 */
@media (max-width: 640px) {
  .filter-bar {
    @apply flex-col space-y-3;
  }
  
  .search-box {
    @apply w-full max-w-none;
  }
  
  .filter-controls {
    @apply w-full justify-end;
  }
  
  .category-select,
  .difficulty-select {
    @apply mr-auto;
  }
}

.search-box {
  @apply relative flex-1 max-w-md;
}

.search-input:focus {
  border-color: var(--settings-accent);
}

.filter-controls {
  @apply flex items-center space-x-3;
  margin-left: 2rem;
}

.filter-controls > button {
  flex-shrink: 0;
}

.category-select option,
.difficulty-select option {
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
}

.sort-btn {
  @apply px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
}

.sort-btn:hover {
  background-color: var(--settings-border);
}

.sort-btn.active {
  background-color: var(--settings-accent);
  color: #ffffff;
}

.library-content {
  @apply flex-1 overflow-auto p-3 sm:p-4 md:p-6;
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
  @apply mb-6;
  color: var(--settings-text-secondary);
}


.puzzle-grid {
  @apply grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6;
}

.puzzle-card {
  @apply bg-white rounded-lg shadow-md overflow-hidden cursor-pointer;
  @apply transform transition-all duration-200 hover:scale-105 hover:shadow-lg;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
}

/* 移动端卡片优化 */
@media (max-width: 640px) {
  .puzzle-card {
    @apply shadow-sm;
  }
  
  .puzzle-card:hover {
    @apply scale-100;
  }
}

.card-image {
  @apply relative aspect-square overflow-hidden;
}

.card-image img {
  @apply w-full h-full object-cover;
}

.image-placeholder {
  @apply w-full h-full flex items-center justify-center cursor-pointer;
  background-color: var(--settings-hover);
  transition: background-color 0.2s ease;
}

.image-placeholder:hover {
  background-color: var(--settings-border);
}

.placeholder-content {
  @apply text-center;
  color: var(--settings-text-secondary);
}

.placeholder-icon {
  @apply text-2xl mb-2;
}

.placeholder-text {
  @apply text-sm;
}

.card-overlay {
  @apply absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center;
  @apply opacity-0 hover:opacity-100 transition-opacity duration-200;
}

/* 移动端overlay样式 */
.mobile-overlay {
  @apply absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center;
  @apply opacity-0 active:opacity-100 transition-opacity duration-200;
}

.mobile-overlay-hint {
  @apply text-center text-white;
}

.hint-icon {
  @apply text-2xl mb-1;
}

.hint-text {
  @apply text-sm font-medium;
}

.overlay-actions {
  @apply flex flex-col space-y-2;
  display: none;
  visibility: hidden;
}

.card-overlay:hover .overlay-actions {
  display: flex;
  visibility: visible;
}

.overlay-btn {
  @apply px-3 py-1 text-sm font-medium rounded transition-colors duration-200;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
}

.overlay-btn:hover {
  background-color: var(--settings-hover);
}

.overlay-btn.primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.overlay-btn.danger {
  @apply bg-red-500 text-white hover:bg-red-600;
}

.card-content {
  @apply p-3 sm:p-4;
}

/* 移动端卡片内容优化 */
@media (max-width: 640px) {
  .card-content {
    @apply p-2;
  }
}

.card-title {
  @apply font-semibold mb-1 sm:mb-2 truncate;
  font-size: 0.875rem;
  color: var(--settings-text-primary);
}

/* 移动端标题优化 */
@media (min-width: 640px) {
  .card-title {
    font-size: 1rem;
  }
}

.card-meta {
  @apply flex items-center justify-between mb-1 sm:mb-2;
}

/* 移动端元信息优化 */
@media (max-width: 640px) {
  .card-meta {
    @apply flex-col items-start space-y-1;
  }
}

.card-category {
  @apply text-xs px-2 py-1 rounded;
  color: var(--settings-text-secondary);
  background-color: var(--settings-hover);
}

.card-difficulty {
  @apply flex items-center;
}

.difficulty-star {
  @apply text-xs;
  opacity: 0.3;
  transition: opacity 0.2s ease;
  color: #d1d5db; /* 默认灰色 */
}

.difficulty-star.filled {
  opacity: 1;
}

/* 不同难度的颜色 */
.difficulty-star.difficulty-1.filled {
  color: #10b981; /* 绿色 - 简单 */
}

.difficulty-star.difficulty-2.filled {
  color: #84cc16; /* 浅绿色 - 容易 */
}

.difficulty-star.difficulty-3.filled {
  color: #f59e0b; /* 黄色 - 中等 */
}

.difficulty-star.difficulty-4.filled {
  color: #f97316; /* 橙色 - 困难 */
}

.difficulty-star.difficulty-5.filled {
  color: #ef4444; /* 红色 - 极难 */
}

.difficulty-star:not(.filled) {
  @apply opacity-30;
  color: var(--settings-border);
}

.card-tags {
  @apply flex flex-wrap gap-1;
}

/* 移动端标签优化 */
@media (max-width: 640px) {
  .card-tags {
    @apply gap-0.5;
  }
  
  .card-tags .tag {
    @apply text-xs px-1.5 py-0.5;
  }
}

.tag {
  @apply text-xs px-2 py-1 rounded;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
}

.tag.more {
  @apply text-xs px-2 py-1 rounded;
  background-color: var(--settings-border);
  color: var(--settings-text-secondary);
}

.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-dialog {
  @apply bg-white rounded-lg shadow-xl mx-4;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
}

.delete-modal {
  @apply w-full max-w-sm;
}

.modal-header {
  @apply flex items-center justify-between p-4 border-b;
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
  @apply p-4;
}

.modal-footer {
  @apply flex justify-end space-x-2 p-4 border-t;
}

.modal-btn {
  @apply px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
}

.modal-btn:hover {
  background-color: var(--settings-border);
}

.modal-btn.primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.modal-btn.danger {
  @apply bg-red-500 text-white hover:bg-red-600;
}

.modal-btn:disabled {
  @apply cursor-not-allowed;
  background-color: var(--settings-border);
  color: var(--settings-text-secondary);
  opacity: 0.6;
}

.delete-warning {
  @apply text-sm text-red-600 mt-2;
}

/* 移动端操作对话框样式 */
.mobile-actions-modal {
  @apply w-full max-w-xs;
}

.mobile-action-buttons {
  @apply space-y-3;
}

.mobile-action-btn {
  @apply w-full flex items-center justify-start px-4 py-3 rounded-lg;
  @apply text-left font-medium transition-all duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
}

.mobile-action-btn:hover {
  background-color: var(--settings-border);
}

.mobile-action-btn:active {
  background-color: var(--settings-border);
}

.mobile-action-btn:hover {
  background-color: var(--settings-border);
}

.mobile-action-btn.primary {
  @apply bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200;
  background-color: var(--settings-accent);
  color: #ffffff;
}

.mobile-action-btn.primary:hover {
  background-color: var(--settings-accent-hover);
}

.mobile-action-btn.danger {
  @apply bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200;
  background-color: #fef2f2;
  color: #dc2626;
}

.mobile-action-btn.danger:hover {
  background-color: #fee2e2;
}

.action-icon {
  @apply text-xl mr-3;
}

.action-text {
  @apply text-base;
}
</style>

