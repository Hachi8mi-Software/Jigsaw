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
      <div class="header-left">
        <h1 class="library-title">拼图素材库</h1>
        <div class="library-stats">
          <span class="stat-item">{{ filteredItems.length }} 个拼图</span>
          <span class="stat-item">{{ userItems.length }} 个自定义</span>
        </div>
      </div>
      
      <div class="header-right">
        <button @click="showUploadModal = true" class="action-btn primary">
          ➕ 添加拼图
        </button>
        <button @click="goToEditor" class="action-btn">
          ✏️ 创建拼图
        </button>
      </div>
    </div>

    <!-- 搜索和筛选栏 -->
    <div class="filter-bar">
      <div class="search-box">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索拼图名称或标签..."
          class="search-input"
        />
        <div class="search-icon">🔍</div>
      </div>
      
      <div class="filter-controls">
        <select v-model="selectedCategory" class="category-select">
          <option v-for="category in availableCategories" :key="category" :value="category">
            {{ category }}
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
          素材库为空，请添加一些拼图素材
        </p>
        <button @click="showUploadModal = true" class="empty-action-btn">
          添加第一个拼图
        </button>
      </div>
      
      <div v-else class="puzzle-grid">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="puzzle-card"
          @click="selectPuzzle(item)"
        >
          <div class="card-image">
            <img :src="item.imageUrl" :alt="item.name" />
            <div class="card-overlay">
              <div class="overlay-actions">
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
                  :class="{ 'filled': star <= item.difficulty }"
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

    <!-- 上传拼图对话框 -->
    <div v-if="showUploadModal" class="modal-overlay" @click="closeUploadModal">
      <div class="modal-dialog upload-modal" @click.stop>
        <div class="modal-header">
          <h3>添加新拼图</h3>
          <button @click="closeUploadModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="upload-form">
            <!-- 图片上传 -->
            <div class="form-group">
              <label class="form-label">选择图片</label>
              <div 
                class="upload-area"
                @click="triggerFileInput"
                @drop.prevent="handleFileDrop"
                @dragover.prevent
                @dragenter.prevent
              >
                <div v-if="!uploadPreview" class="upload-placeholder">
                  <div class="upload-icon">📷</div>
                  <p>点击或拖拽上传图片</p>
                  <p class="upload-hint">支持 JPG, PNG, BMP 格式，最大 10MB</p>
                </div>
                <div v-else class="upload-preview">
                  <img :src="uploadPreview" alt="预览" />
                  <button @click.stop="removeUploadImage" class="remove-preview-btn">×</button>
                </div>
              </div>
              <input 
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/png,image/bmp"
                @change="handleFileSelect"
                style="display: none;"
              />
            </div>

            <!-- 拼图信息 -->
            <div class="form-group">
              <label class="form-label">拼图名称</label>
              <input 
                v-model="uploadForm.name"
                type="text"
                class="form-input"
                placeholder="给你的拼图起个名字"
              />
            </div>

            <div class="form-group">
              <label class="form-label">分类</label>
              <select v-model="uploadForm.category" class="form-select">
                <option value="">选择分类</option>
                <option v-for="category in categories.slice(1)" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">标签 (用逗号分隔)</label>
              <input 
                v-model="uploadForm.tagsString"
                type="text"
                class="form-input"
                placeholder="例如: 风景, 美丽, 自然"
              />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeUploadModal" class="modal-btn">
            取消
          </button>
          <button 
            @click="handleUpload" 
            class="modal-btn primary"
            :disabled="!canUpload"
          >
            添加拼图
          </button>
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLibraryStore } from '../stores/library'
import type { LibraryItem, PuzzleData } from '../types'

// Store和路由
const libraryStore = useLibraryStore()
const router = useRouter()

// 模板引用
const fileInput = ref<HTMLInputElement>()

// 响应式状态
const showUploadModal = ref(false)
const showDeleteModal = ref(false)
const uploadPreview = ref<string | null>(null)
const uploadFile = ref<File | null>(null)
const itemToDelete = ref<LibraryItem | null>(null)

// 上传表单
const uploadForm = reactive({
  name: '',
  category: '',
  tagsString: ''
})

// 计算属性
const filteredItems = computed(() => libraryStore.filteredItems)
const userItems = computed(() => libraryStore.userItems)
const availableCategories = computed(() => libraryStore.availableCategories)
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

const canUpload = computed(() => {
  return uploadFile.value && 
         uploadForm.name.trim() && 
         uploadForm.category
})

// 方法
const goToEditor = () => {
  router.push('/editor')
}

const selectPuzzle = (item: LibraryItem) => {
  // 可以显示拼图详情或直接开始游戏
  console.log('选择拼图:', item.name)
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

// 上传相关方法
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

const handleFileDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

const processFile = (file: File) => {
  // 验证文件
  const validTypes = ['image/jpeg', 'image/png', 'image/bmp']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!validTypes.includes(file.type)) {
    alert('请选择有效的图片格式 (JPG, PNG, BMP)')
    return
  }

  if (file.size > maxSize) {
    alert('文件大小不能超过 10MB')
    return
  }

  uploadFile.value = file
  
  // 生成预览
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  // 自动填充文件名（去掉扩展名）
  if (!uploadForm.name) {
    uploadForm.name = file.name.replace(/\.[^/.]+$/, '')
  }
}

const removeUploadImage = () => {
  uploadFile.value = null
  uploadPreview.value = null
}

const handleUpload = async () => {
  if (!uploadFile.value || !canUpload.value) return

  try {
    const tags = uploadForm.tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    // 创建拼图数据对象
    const puzzleData: PuzzleData = {
      id: `custom_${Date.now()}`,
      name: uploadForm.name,
      imageUrl: uploadPreview.value || '',
      gridConfig: {
        rows: 3,
        cols: 4,
        pieceWidth: 150,
        pieceHeight: 100
      },
      boundaries: [], // 简单的边界数据
      createdAt: new Date(),
      difficulty: Math.ceil(Math.random() * 5) // 随机难度
    }

    // 添加到素材库，传入 gridConfig 进行中心裁剪
    const newItem = await libraryStore.addLibraryItem(
      uploadFile.value,
      uploadForm.name,
      uploadForm.category,
      tags,
      puzzleData.gridConfig
    )

    // 更新库项目，添加puzzleData
    if (newItem) {
      libraryStore.updateLibraryItem(newItem.id, {
        ...newItem,
        puzzleData: puzzleData
      })
    }

    closeUploadModal()
    alert('拼图添加成功！')
  } catch (error) {
    console.error('上传失败:', error)
    alert('上传失败，请重试')
  }
}

const closeUploadModal = () => {
  showUploadModal.value = false
  uploadPreview.value = null
  uploadFile.value = null
  Object.assign(uploadForm, {
    name: '',
    category: '',
    tagsString: ''
  })
}

// 生命周期
onMounted(() => {
  // 素材库已在App.vue中统一初始化，无需重复调用
  console.log('LibraryView 已加载')
})
</script>

<style scoped>
.library-view {
  @apply h-screen flex flex-col;
  background-color: var(--settings-bg);
}

.library-header {
  @apply flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 shadow-sm border-b;
  background-color: var(--settings-card-bg);
  border-bottom-color: var(--settings-border);
}

/* 移动端头部优化 */
@media (max-width: 640px) {
  .library-header {
    @apply flex-col space-y-3;
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

.library-title {
  @apply text-2xl font-bold;
  color: var(--settings-text-primary);
}

.library-stats {
  @apply flex items-center space-x-4 text-sm;
  color: var(--settings-text-secondary);
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
    @apply w-full justify-between;
  }
}

.search-box {
  @apply relative flex-1 max-w-md;
}

.search-input {
  @apply w-full pl-4 pr-10 py-2 border rounded-lg;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
  border-color: var(--settings-border);
}

.search-input:focus {
  border-color: var(--settings-accent);
}

.search-icon {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2;
  color: var(--settings-text-secondary);
}

.filter-controls {
  @apply flex items-center space-x-3;
}

.category-select {
  @apply px-3 py-2 border rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
  border-color: var(--settings-border);
}

.category-select:focus {
  border-color: var(--settings-accent);
}

.category-select option {
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
  @apply text-gray-600 mb-6;
  color: var(--settings-text-secondary);
}

.empty-action-btn {
  @apply px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600;
  @apply transition-colors duration-200;
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

.card-overlay {
  @apply absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center;
  @apply opacity-0 hover:opacity-100 transition-opacity duration-200;
}

.overlay-actions {
  @apply flex flex-col space-y-2;
}

.overlay-btn {
  @apply px-3 py-1 text-sm font-medium rounded transition-colors duration-200;
  @apply bg-white text-gray-700 hover:bg-gray-100;
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
  @apply font-semibold text-gray-800 mb-1 sm:mb-2 truncate;
  font-size: 0.875rem;
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
  @apply text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded;
  color: var(--settings-text-secondary);
  background-color: var(--settings-hover);
}

.card-difficulty {
  @apply flex items-center;
}

.difficulty-star {
  @apply text-xs;
}

.difficulty-star.filled {
  @apply text-yellow-400;
}

.difficulty-star:not(.filled) {
  @apply text-gray-300;
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
  @apply bg-gray-100 text-gray-600;
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

.upload-modal {
  @apply w-full max-w-md;
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
  @apply text-2xl text-gray-400 hover:text-gray-600 cursor-pointer;
}

.modal-body {
  @apply p-4;
}

.upload-form {
  @apply space-y-4;
}

.form-group {
  @apply flex flex-col;
}

.form-label {
  @apply text-sm font-medium text-gray-700 mb-1;
}

.upload-area {
  @apply border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer;
  @apply hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200;
}

.upload-placeholder {
  @apply text-center;
}

.upload-icon {
  @apply text-4xl mb-2;
}

.upload-hint {
  @apply text-xs text-gray-500 mt-1;
}

.upload-preview {
  @apply relative;
}

.upload-preview img {
  @apply w-full h-32 object-cover rounded;
}

.remove-preview-btn {
  @apply absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full;
  @apply flex items-center justify-center text-sm hover:bg-red-600;
}

.form-input, .form-select {
  @apply w-full px-3 py-2 border rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
  border-color: var(--settings-border);
}

.form-input:focus, .form-select:focus {
  border-color: var(--settings-accent);
}

.modal-footer {
  @apply flex justify-end space-x-2 p-4 border-t;
}

.modal-btn {
  @apply px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200;
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.modal-btn.primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.modal-btn.danger {
  @apply bg-red-500 text-white hover:bg-red-600;
}

.modal-btn:disabled {
  @apply bg-gray-200 text-gray-400 cursor-not-allowed;
}

.delete-warning {
  @apply text-sm text-red-600 mt-2;
}
</style>

