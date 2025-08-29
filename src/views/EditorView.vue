<!--
  拼图编辑器视图
  程序化拼图创建工具的主界面
-->
<!-- 
  🗑️不符合MVVM规范的代码：View直接持有Store的实例
  未来应该重写
-->
<template>
  <div class="editor-view">
    <!-- 顶部工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <h1 class="editor-title">拼图编辑器</h1>
        <div class="puzzle-info">
          <span class="info-item">
            {{ totalPieces }} 块拼图
          </span>
          <span class="info-item">
            难度: {{ puzzleDifficulty }}
          </span>
          <span class="info-item" v-if="complexBoundaries > 0">
            复杂边界: {{ complexBoundaries }}/{{ totalBoundaries }}
          </span>
        </div>
      </div>
      
      <div class="toolbar-right">
        <button 
          @click="togglePreviewMode" 
          class="toolbar-btn"
          :class="{ 'active': isPreviewMode }"
        >
          {{ isPreviewMode ? '退出预览' : '预览模式' }}
        </button>
        <button @click="openImportDialog" class="toolbar-btn">
          导入
        </button>
        <button 
          @click="addToLibrary" 
          class="toolbar-btn success"
          :disabled="!canExport"
        >
          添加到素材库
        </button>
        <button 
          @click="exportPuzzle" 
          class="toolbar-btn primary"
          :disabled="!canExport"
        >
          导出拼图
        </button>
      </div>
    </div>

    <div class="editor-content">
      <!-- 左侧控制面板 -->
      <div class="editor-sidebar">
        <!-- 图片上传区域 -->
        <div class="control-section">
          <h3 class="section-title">图片素材</h3>
          <div class="image-upload-area">
            <div 
              v-if="!currentImage"
              class="upload-placeholder"
              @click="triggerImageUpload"
              @drop.prevent="handleImageDrop"
              @dragover.prevent
              @dragenter.prevent
            >
              <div class="upload-icon">📷</div>
              <p>点击或拖拽上传图片</p>
              <p class="upload-hint">支持 JPG, PNG, BMP 格式</p>
            </div>
            <div v-else class="uploaded-image group">
              <img :src="currentImage" alt="上传的图片" />
              <div class="image-overlay">
                <button @click="triggerImageUpload" class="overlay-btn">
                  更换图片
                </button>
                <button @click="removeImage" class="overlay-btn danger">
                  移除
                </button>
              </div>
            </div>
          </div>
          <input 
            ref="imageInput"
            type="file"
            accept="image/jpeg,image/png,image/bmp"
            @change="handleImageUpload"
            style="display: none;"
          />
        </div>

        <!-- 网格配置 -->
        <div class="control-section">
          <h3 class="section-title">网格配置</h3>
          <div class="grid-controls">
            <div class="control-group">
              <label>行数</label>
              <input 
                v-model.number="localGridConfig.rows"
                type="number"
                min="2"
                max="50"
                @change="updateGrid"
                class="number-input"
              />
            </div>
            <div class="control-group">
              <label>列数</label>
              <input 
                v-model.number="localGridConfig.cols"
                type="number"
                min="2"
                max="50"
                @change="updateGrid"
                class="number-input"
              />
            </div>
            <div class="control-group">
              <label>块宽度</label>
              <input 
                v-model.number="localGridConfig.pieceWidth"
                type="number"
                min="50"
                max="200"
                @change="updateGrid"
                class="number-input"
              />
            </div>
            <div class="control-group">
              <label>块高度</label>
              <input 
                v-model.number="localGridConfig.pieceHeight"
                type="number"
                min="50"
                max="200"
                @change="updateGrid"
                class="number-input"
              />
            </div>
          </div>
        </div>

        <!-- 边界操作 -->
        <div class="control-section">
          <h3 class="section-title">边界编辑</h3>
          <div class="boundary-controls">
            <button @click="randomizeBoundaries" class="control-btn">
              🎲 随机化边界
            </button>
            <button @click="resetBoundaries" class="control-btn">
              🔄 重置为平直
            </button>
          </div>
          
          <div v-if="selectedBoundary" class="selected-boundary-info">
            <h4>选中边界</h4>
            <p>ID: {{ selectedBoundary }}</p>
            <div class="boundary-state-controls">
              <button 
                v-for="state in boundaryStates"
                :key="state.value"
                @click="setBoundaryState(state.value)"
                class="state-btn"
                :class="{ 'active': getCurrentBoundaryState() === state.value }"
              >
                {{ state.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- 拼图信息 -->
        <div class="control-section">
          <h3 class="section-title">拼图信息</h3>
          <div class="puzzle-meta">
            <div class="control-group">
              <label>拼图名称</label>
              <input 
                v-model="puzzleName"
                type="text"
                class="text-input"
                placeholder="输入拼图名称"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 主编辑区域 -->
      <div class="editor-main">
        <div class="editor-canvas" ref="canvasRef">
          <div 
            v-if="currentImage"
            class="image-container"
            :style="imageContainerStyle as any"
          >
            <!-- 背景图片 -->
            <img 
              :src="currentImage" 
              :alt="puzzleName"
              class="background-image"
              :style="backgroundImageStyle"
            />
            
            <!-- SVG 网格覆盖层 -->
            <svg 
              class="grid-overlay"
              :width="svgWidth"
              :height="svgHeight"
              :viewBox="svgViewBox"
            >
              <!-- 网格线 -->
              <g class="grid-lines">
                <!-- 垂直网格线 -->
                <line
                  v-for="col in gridCols + 1"
                  :key="`v-line-${col}`"
                  :x1="(col - 1) * gridConfig.pieceWidth"
                  :y1="0"
                  :x2="(col - 1) * gridConfig.pieceWidth"
                  :y2="gridConfig.rows * gridConfig.pieceHeight"
                  stroke="rgba(0, 0, 0, 0.2)"
                  stroke-width="1"
                />
                <!-- 水平网格线 -->
                <line
                  v-for="row in gridRows + 1"
                  :key="`h-line-${row}`"
                  :x1="0"
                  :y1="(row - 1) * gridConfig.pieceHeight"
                  :x2="gridConfig.cols * gridConfig.pieceWidth"
                  :y2="(row - 1) * gridConfig.pieceHeight"
                  stroke="rgba(0, 0, 0, 0.2)"
                  stroke-width="1"
                />
              </g>

              <!-- 交互式边界 -->
              <g class="boundaries">
                <SvgBoundary
                  v-for="boundary in boundaries"
                  :key="boundary.id"
                  :boundary="boundary"
                  :is-selected="selectedBoundary === boundary.id"
                  :is-preview-mode="isPreviewMode"
                  @click="selectBoundary"
                  @hover="hoverBoundary"
                />
              </g>

              <!-- 预览模式下的拼图块轮廓 -->
              <g v-if="isPreviewMode" class="puzzle-pieces-preview">
                <path
                  v-for="(piece, index) in previewPieces"
                  :key="`preview-${index}`"
                  :d="piece.path"
                  fill="rgba(255, 255, 255, 0.1)"
                  :stroke="piece.color"
                  stroke-width="2"
                />
              </g>
            </svg>
          </div>
          
          <div v-else class="empty-canvas">
            <div class="empty-message">
              <div class="empty-icon">🖼️</div>
              <h3>开始创建拼图</h3>
              <p>请先上传一张图片作为拼图素材</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入对话框 -->
    <div v-if="showImportDialog" class="modal-overlay" @click="closeImportDialog">
      <div class="modal-dialog" @click.stop>
        <div class="modal-header">
          <h3>导入拼图数据</h3>
          <button @click="closeImportDialog" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <textarea
            v-model="importData"
            placeholder="粘贴拼图JSON数据..."
            class="import-textarea"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button @click="closeImportDialog" class="modal-btn">
            取消
          </button>
          <button @click="handleImport" class="modal-btn primary">
            导入
          </button>
        </div>
      </div>
    </div>

    <!-- 添加到素材库对话框 -->
    <div v-if="showAddToLibraryDialog" class="modal-overlay" @click="closeAddToLibraryDialog">
      <div class="modal-dialog" @click.stop>
        <div class="modal-header">
          <h3>添加到素材库</h3>
          <button @click="closeAddToLibraryDialog" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">拼图名称</label>
            <input
              v-model="libraryItemName"
              type="text"
              placeholder="请输入拼图名称"
              class="form-input"
              :disabled="isAddingToLibrary"
            />
          </div>
          <div class="form-group">
            <label class="form-label">分类</label>
            <select
              v-model="libraryItemCategory"
              class="form-select"
              :disabled="isAddingToLibrary"
            >
              <option value="自定义">自定义</option>
              <option value="自然风光">自然风光</option>
              <option value="城市建筑">城市建筑</option>
              <option value="艺术画作">艺术画作</option>
              <option value="可爱动物">可爱动物</option>
              <option value="卡通动漫">卡通动漫</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">标签</label>
            <input
              v-model="libraryItemTags"
              type="text"
              placeholder="请输入标签，用逗号分隔"
              class="form-input"
              :disabled="isAddingToLibrary"
            />
            <p class="form-hint">例如：风景,美丽,自然</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeAddToLibraryDialog" class="modal-btn" :disabled="isAddingToLibrary">
            取消
          </button>
          <button @click="handleAddToLibrary" class="modal-btn primary" :disabled="isAddingToLibrary">
            {{ isAddingToLibrary ? '添加中...' : '添加到素材库' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useEditorStore } from '../stores/editor'
import { useLibraryStore } from '../stores/library'
import { BoundaryState } from '../types'
import SvgBoundary from '../components/SvgBoundary.vue'
import { SvgPathGenerator } from '../utils/svgUtils'

// Store和路由
const editorStore = useEditorStore()
const libraryStore = useLibraryStore()
const router = useRouter()

// 模板引用
const canvasRef = ref<HTMLElement>()
const imageInput = ref<HTMLInputElement>()

// 本地状态
const localGridConfig = reactive({
  rows: 4,
  cols: 6,
  pieceWidth: 100,
  pieceHeight: 100
})

const showImportDialog = ref(false)
const importData = ref('')
const showAddToLibraryDialog = ref(false)
const libraryItemName = ref('')
const libraryItemCategory = ref('自定义')
const libraryItemTags = ref('')
const isAddingToLibrary = ref(false)

// 计算属性
const currentImage = computed(() => editorStore.currentImage)
const gridConfig = computed(() => editorStore.gridConfig)
const boundaries = computed(() => editorStore.boundaries)
const isPreviewMode = computed(() => editorStore.isPreviewMode)
const selectedBoundary = computed(() => editorStore.selectedBoundary)
const puzzleName = computed({
  get: () => editorStore.puzzleName,
  set: (value) => editorStore.setPuzzleName(value)
})
const totalPieces = computed(() => editorStore.totalPieces)
const totalBoundaries = computed(() => editorStore.totalBoundaries)
const complexBoundaries = computed(() => editorStore.complexBoundaries)
const puzzleDifficulty = computed(() => editorStore.puzzleDifficulty)
const canExport = computed(() => editorStore.canExport)

const svgWidth = computed(() => gridConfig.value.cols * gridConfig.value.pieceWidth)
const svgHeight = computed(() => gridConfig.value.rows * gridConfig.value.pieceHeight)
const svgViewBox = computed(() => `0 0 ${svgWidth.value} ${svgHeight.value}`)

const gridRows = computed(() => gridConfig.value.rows)
const gridCols = computed(() => gridConfig.value.cols)

const imageContainerStyle = computed(() => ({
  width: `${svgWidth.value}px`,
  height: `${svgHeight.value}px`,
  position: 'relative'
}))

const backgroundImageStyle = computed(() => ({
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const
}))

const previewPieces = computed(() => {
  if (!isPreviewMode.value || !currentImage.value) return []
  
  const pieces = []
  for (let row = 0; row < gridConfig.value.rows; row++) {
    for (let col = 0; col < gridConfig.value.cols; col++) {
      const path = SvgPathGenerator.generatePiecePath(
        row,
        col,
        gridConfig.value,
        boundaries.value
      )
      pieces.push({
        path,
        color: `hsl(${(row * gridConfig.value.cols + col) * 137.5 % 360}, 50%, 50%)`
      })
    }
  }
  return pieces
})

// 边界状态选项
const boundaryStates = [
  { value: BoundaryState.FLAT, label: '平直' },
  { value: BoundaryState.CONVEX, label: '外凸' },
  { value: BoundaryState.CONCAVE, label: '内凹' }
]

// 方法
const triggerImageUpload = () => {
  imageInput.value?.click()
}

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processImageFile(file)
  }
}

const handleImageDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    processImageFile(files[0])
  }
}

const processImageFile = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const imageUrl = e.target?.result as string
    editorStore.setImage(imageUrl, file)
  }
  reader.readAsDataURL(file)
}

const removeImage = () => {
  editorStore.setImage('')
}

const updateGrid = () => {
  editorStore.updateGridConfig(localGridConfig)
}

const randomizeBoundaries = () => {
  editorStore.randomizeBoundaries()
}

const resetBoundaries = () => {
  editorStore.resetBoundaries()
}

const selectBoundary = (boundaryId: string) => {
  editorStore.selectBoundary(boundaryId)
}

const hoverBoundary = (boundaryId: string | null) => {
  // 处理边界悬停状态
}

const getCurrentBoundaryState = () => {
  if (!selectedBoundary.value) return null
  const boundary = boundaries.value.find(b => b.id === selectedBoundary.value)
  return boundary?.state
}

const setBoundaryState = (state: BoundaryState) => {
  if (selectedBoundary.value) {
    editorStore.updateBoundaryState(selectedBoundary.value, state)
  }
}

const togglePreviewMode = () => {
  editorStore.togglePreviewMode()
}

const exportPuzzle = () => {
  const puzzleJson = editorStore.exportPuzzle()
  if (puzzleJson) {
    // 创建下载链接
    const blob = new Blob([puzzleJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${puzzleName.value || '我的拼图'}.puzzle`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

const addToLibrary = () => {
  if (!canExport.value) return
  
  // 设置默认值
  libraryItemName.value = puzzleName.value || '我的拼图'
  libraryItemCategory.value = '自定义'
  libraryItemTags.value = ''
  
  showAddToLibraryDialog.value = true
}

const closeAddToLibraryDialog = () => {
  showAddToLibraryDialog.value = false
  libraryItemName.value = ''
  libraryItemCategory.value = '自定义'
  libraryItemTags.value = ''
  isAddingToLibrary.value = false
}

const handleAddToLibrary = async () => {
  if (!libraryItemName.value.trim()) {
    alert('请输入拼图名称')
    return
  }
  
  if (!currentImage.value || !editorStore.originalImageFile) {
    alert('没有找到原始图片文件')
    return
  }
  
  try {
    isAddingToLibrary.value = true
    
    // 解析标签
    const tags = libraryItemTags.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    
    // 添加到素材库
    await libraryStore.addLibraryItem(
      editorStore.originalImageFile,
      libraryItemName.value.trim(),
      libraryItemCategory.value,
      tags
    )
    
    alert('成功添加到素材库！')
    closeAddToLibraryDialog()
    
  } catch (error) {
    console.error('添加到素材库失败:', error)
    alert('添加到素材库失败，请重试')
  } finally {
    isAddingToLibrary.value = false
  }
}

const openImportDialog = () => {
  showImportDialog.value = true
}

const closeImportDialog = () => {
  showImportDialog.value = false
  importData.value = ''
}

const handleImport = () => {
  if (importData.value.trim()) {
    const success = editorStore.importPuzzle(importData.value)
    if (success) {
      closeImportDialog()
      // 同步本地网格配置
      Object.assign(localGridConfig, gridConfig.value)
    } else {
      alert('导入失败，请检查数据格式')
    }
  }
}

// 生命周期
onMounted(() => {
  // 同步网格配置
  Object.assign(localGridConfig, gridConfig.value)
  
  // 尝试加载草稿
  editorStore.loadDraft()
  
  // 生成初始边界
  if (boundaries.value.length === 0) {
    editorStore.generateBoundaries()
  }
})
</script>

<style scoped>
.editor-view {
  @apply h-screen flex flex-col;
  background-color: var(--settings-bg);
}

.editor-toolbar {
  @apply flex items-center justify-between px-6 py-4 shadow-sm border-b;
  background-color: var(--settings-card-bg);
  border-bottom-color: var(--settings-border);
}

.toolbar-left {
  @apply flex items-center space-x-6;
}

.editor-title {
  @apply text-2xl font-bold;
  color: var(--settings-text-primary);
}

.puzzle-info {
  @apply flex items-center space-x-4 text-sm text-gray-600;
}

.info-item {
  @apply px-3 py-1 bg-gray-100 rounded-full;
  background-color: var(--settings-hover);
  color: var(--settings-text-secondary);
}

.toolbar-right {
  @apply flex items-center space-x-3;
}

.toolbar-btn {
  @apply px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200;
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-secondary);
}

.toolbar-btn:hover {
  background-color: var(--settings-border);
}

.toolbar-btn.active {
  @apply bg-blue-500 text-white;
  background-color: var(--settings-accent);
  color: white;
}

.toolbar-btn.primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
  background-color: var(--settings-accent);
  color: white;
}

.toolbar-btn.primary:hover {
  background-color: var(--settings-accent-hover, #2563eb);
}

.toolbar-btn:disabled {
  @apply bg-gray-200 text-gray-400 cursor-not-allowed;
  background-color: var(--settings-border);
  color: var(--settings-text-secondary);
  opacity: 0.6;
}

.editor-content {
  @apply flex flex-1 overflow-hidden;
}

.editor-sidebar {
  @apply w-80 shadow-lg overflow-y-auto;
  background-color: var(--settings-card-bg);
}

.control-section {
  @apply p-6 border-b;
  border-bottom-color: var(--settings-border);
}

.section-title {
  @apply text-lg font-semibold mb-4;
  color: var(--settings-text-primary);
}

.image-upload-area {
  @apply relative;
}

.upload-placeholder {
  @apply w-full h-48 border-2 border-dashed rounded-lg;
  @apply flex flex-col items-center justify-center cursor-pointer;
  @apply transition-colors duration-200;
  border-color: var(--settings-border);
  background-color: var(--settings-card-bg);
}

.upload-placeholder:hover {
  border-color: var(--settings-accent);
  background-color: var(--settings-hover);
}

.upload-icon {
  @apply text-4xl mb-2;
}

.upload-hint {
  @apply text-xs mt-1;
  color: var(--settings-text-secondary);
}

.uploaded-image {
  @apply relative w-full h-48 rounded-lg overflow-hidden;
}

.uploaded-image img {
  @apply w-full h-full object-cover;
}

.image-overlay {
  @apply absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center;
  @apply opacity-0 group-hover:opacity-100 transition-opacity duration-200;
}

.overlay-btn {
  @apply px-3 py-1 text-sm text-white bg-blue-500 rounded mr-2;
  @apply hover:bg-blue-600 transition-colors duration-200;
}

.overlay-btn.danger {
  @apply bg-red-500 hover:bg-red-600;
}

.grid-controls {
  @apply space-y-4;
}

.control-group {
  @apply flex flex-col;
}

.control-group label {
  @apply text-sm font-medium mb-1;
  color: var(--settings-text-primary);
}

.number-input, .text-input {
  @apply w-full px-3 py-2 border rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
  border-color: var(--settings-border);
}

.number-input:focus, .text-input:focus {
  border-color: var(--settings-accent);
}

.boundary-controls {
  @apply space-y-2;
}

.control-btn {
  @apply w-full px-4 py-2 text-sm font-medium rounded-md;
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
}

.control-btn:hover {
  background-color: var(--settings-border);
}

.selected-boundary-info {
  @apply mt-4 p-3 rounded-lg;
  background-color: var(--settings-hover);
}

.selected-boundary-info h4 {
  @apply font-medium mb-2;
  color: var(--settings-accent);
}

.boundary-state-controls {
  @apply flex space-x-1 mt-2;
}

.state-btn {
  @apply flex-1 px-2 py-1 text-xs font-medium rounded transition-colors duration-200;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
}

.state-btn:hover {
  background-color: var(--settings-hover);
}

.state-btn.active {
  @apply bg-blue-500 text-white;
}

.editor-main {
  @apply flex-1 overflow-auto p-6;
}

.editor-canvas {
  @apply flex items-center justify-center min-h-full;
}

.image-container {
  @apply relative rounded-lg shadow-lg overflow-hidden;
  background-color: var(--settings-card-bg);
}

.background-image {
  @apply absolute inset-0 z-0;
}

.grid-overlay {
  @apply absolute inset-0 z-10;
}

.empty-canvas {
  @apply flex items-center justify-center h-96 rounded-lg shadow-lg;
  background-color: var(--settings-card-bg);
}

.empty-message {
  @apply text-center;
}

.empty-icon {
  @apply text-6xl mb-4;
}

.empty-message h3 {
  @apply text-xl font-semibold text-gray-800 mb-2;
  color: var(--settings-text-primary);
}

.empty-message p {
  @apply text-gray-600;
  color: var(--settings-text-secondary);
}

.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-dialog {
  @apply rounded-lg shadow-xl w-full max-w-md mx-4;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
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

.import-textarea {
  @apply w-full h-32 p-3 border rounded-md resize-none;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
  border-color: var(--settings-border);
}

.import-textarea:focus {
  border-color: var(--settings-accent);
}

.form-group {
  @apply mb-4;
}

.form-label {
  @apply block mb-2 font-medium;
  color: var(--settings-text-primary);
}

.form-input,
.form-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  @apply transition-colors duration-200;
}

.form-input:disabled,
.form-select:disabled {
  @apply bg-gray-100 cursor-not-allowed;
}

.form-hint {
  @apply mt-1 text-xs text-gray-500;
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

.modal-btn:disabled {
  @apply opacity-60 cursor-not-allowed;
}
</style>
