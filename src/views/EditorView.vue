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
    <!-- 顶部标题栏 -->
    <div class="editor-header">
      <h1 class="editor-title">拼图编辑器</h1>
      <button 
        v-if="currentImage"
        @click="clearAll"
        class="clear-btn"
        title="清空所有内容"
      >
        🗑️ 清空
      </button>
    </div>

    <!-- 初始上传状态 -->
    <div v-if="!currentImage" class="upload-state">
      <div class="upload-container">
        <div 
          class="upload-area"
          @click="triggerImageUpload"
          @drop.prevent="handleImageDrop"
          @dragover.prevent
          @dragenter.prevent
        >
          <div class="upload-icon">📷</div>
          <h2 class="upload-title">上传拼图图片</h2>
          <p class="upload-description">点击或拖拽图片到此处</p>
          <p class="upload-hint">支持 JPG, PNG, BMP 格式</p>
        </div>
        
        <div class="upload-actions">
          <button @click="openImportDialog" class="action-btn secondary">
            📁 导入拼图数据
          </button>
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

    <!-- 编辑器状态 -->
    <div v-else class="editor-state">
      <!-- 主编辑区域 - 只显示图片 -->
      <div class="editor-main">
        <div class="editor-canvas" ref="canvasRef">
          <div 
            class="image-container"
            :style="imageContainerStyle as any"
          >
            <!-- 背景图片 -->
            <img 
              :src="currentImage" 
              :alt="puzzleName"
              class="background-image"
              :style="backgroundImageStyle"
              v-if="currentImage"
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
                  :x1="(col - 1) * dynamicPieceWidth"
                  :y1="0"
                  :x2="(col - 1) * dynamicPieceWidth"
                  :y2="gridConfig.rows * dynamicPieceHeight"
                  stroke="rgba(0, 0, 0, 0.2)"
                  stroke-width="1"
                />
                <!-- 水平网格线 -->
                <line
                  v-for="row in gridRows + 1"
                  :key="`h-line-${row}`"
                  :x1="0"
                  :y1="(row - 1) * dynamicPieceHeight"
                  :x2="gridConfig.cols * dynamicPieceWidth"
                  :y2="(row - 1) * dynamicPieceHeight"
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
                  :piece-width="dynamicPieceWidth"
                  :piece-height="dynamicPieceHeight"
                  @click="selectBoundary"
                  @hover="hoverBoundary"
                  @stateChange="handleBoundaryStateChange"
                />
              </g>
            </svg>
          </div>
        </div>
        
        <!-- 移动端悬浮工具栏 -->
        <div v-if="isMobile" class="mobile-floating-toolbar">
          <!-- 悬浮球按钮 -->
          <button 
            @click="toggleFloatingToolbar"
            class="floating-ball-btn"
            :class="{ 'expanded': showFloatingToolbar }"
          >
            <span class="ball-icon">{{ showFloatingToolbar ? '✕' : '🔧' }}</span>
          </button>
          
          <!-- 展开的工具栏 -->
          <div v-if="showFloatingToolbar" class="floating-toolbar-content">
            <div class="toolbar-header">
              <h4 class="toolbar-title">边界操作</h4>
            </div>
            <div class="toolbar-buttons">
              <button 
                @click="randomizeBoundaries" 
                class="toolbar-btn" 
                :disabled="!canExport"
              >
                <span class="btn-icon">🎲</span>
                <span class="btn-text">随机化边界</span>
              </button>
              <button 
                @click="resetBoundaries" 
                class="toolbar-btn" 
                :disabled="!canExport"
              >
                <span class="btn-icon">🔄</span>
                <span class="btn-text">重置边界</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 网格配置面板 -->
      <div class="editor-config-panel">
        <h3 class="config-title">网格配置</h3>
        <div class="config-controls">
          
          <div class="config-group">
            <label>列数</label>
            <input 
              v-model.number="localGridConfig.cols"
              type="number"
              min="2"
              max="50"
              @change="updateGrid"
              class="config-input"
            />
          </div>
          <div class="config-group">
            <label>行数</label>
            <input 
              v-model.number="localGridConfig.rows"
              type="number"
              min="2"
              max="50"
              @change="updateGrid"
              class="config-input"
            />
          </div>
          <div class="config-group aspect-ratio-group">
            <label>宽高比(宽:高)</label>
            <div class="aspect-ratio-inputs">
              <input 
              v-model.number="aspectRatioConfig.width"
              type="number"
              min="1"
              max="10"
              step="0.1"
              @change="updateAspectRatio"
              class="config-input aspect-input"
              />
              <span class="ratio-separator">:</span>
              <input 
                v-model.number="aspectRatioConfig.height"
                type="number"
                min="1"
                max="10"
                step="0.1"
                @change="updateAspectRatio"
                class="config-input aspect-input"
              />
            </div>
          </div>
        </div>
        
        <!-- 边界操作区域 -->
        <div class="boundary-controls desktop-only">
          <h4 class="boundary-title">边界操作</h4>
          <div class="boundary-buttons">
            <button @click="randomizeBoundaries" class="boundary-btn" :disabled="!canExport">
              🎲 随机化边界
            </button>
            <button @click="resetBoundaries" class="boundary-btn" :disabled="!canExport">
              🔄 重置边界
            </button>
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="editor-bottom-bar">
        <div class="bottom-info">
          <span class="info-item">{{ totalPieces }} 块拼图</span>
          <span class="info-item">难度: {{ puzzleDifficulty }}</span>
          <span class="info-item" v-if="complexBoundaries > 0">
            复杂边界: {{ complexBoundaries }}/{{ totalBoundaries }}
          </span>
          <span class="info-item warning" v-if="gridConfigChangedAfterCrop">
            ⚠️ 需要重新裁剪
          </span>
        </div>
        
        <div class="bottom-actions">
          <button @click="triggerImageUpload" class="bottom-btn">
            🔄 更换图片
          </button>
          <button @click="reopenCropDialog" class="bottom-btn" v-if="currentImage">
            ✂️ 重新裁剪
          </button>
          <button @click="exportPuzzle" class="bottom-btn" :disabled="!canExport">
            📤 导出
          </button>
          <button @click="addToLibrary" class="bottom-btn primary" :disabled="!canExport">
            ➕ 添加到素材库
          </button>
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
          <div 
            class="import-drop-zone"
            @drop.prevent="handleImportDrop"
            @dragover.prevent="handleDragOver"
            @dragenter.prevent="handleDragEnter"
            @dragleave.prevent="handleDragLeave"
            :class="{ 'drag-over': isDragOver }"
          >
            <div class="drop-zone-content">
              <div class="drop-icon">📁</div>
              <h4>拖拽文件到此处</h4>
              <p class="drop-hint">或者</p>
              <button @click="triggerFileSelect" class="file-select-btn">
                选择文件
              </button>
              <p>支持 .json 和 .puzzle 格式文件</p>
            </div>
          </div>
          <input 
            ref="importFileInput"
            type="file"
            accept=".json,.puzzle"
            @change="handleFileSelect"
            style="display: none;"
          />
        </div>
        <div class="modal-footer">
          <button @click="closeImportDialog" class="modal-btn">
            取消
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

    <!-- 图片裁剪对话框 -->
    <div v-if="showCropDialog" class="modal-overlay">
      <div class="modal-dialog crop-dialog" @click.stop>
        <div class="modal-header">
          <h3>裁剪图片</h3>
          <button @click="closeCropDialog" class="close-btn">×</button>
        </div>
        <div class="modal-body crop-body">
          <div class="cropper-container">
            <div v-if="!cropImageUrl" class="loading-placeholder">
              <p>正在加载图片...</p>
            </div>
            <Cropper
              v-else
              ref="cropperRef"
              :src="cropImageUrl"
              :stencil-props="{
                aspectRatio: gridConfig.cols / gridConfig.rows
              }"
              :canvas="{
                background: false
              }"
              :background-class="'cropper-background'"
              class="cropper"
            />
          </div>
          <div class="crop-hint">
            <p>请选择要裁剪的区域，裁剪区域将按照拼图比例自动调整</p>
            <p>当前拼图比例: {{ actualPuzzleRatio }}</p>
            <p>网格配置: {{ gridConfig.cols }}列 × {{ gridConfig.rows }}行</p>
            <p v-if="cropImageUrl">图片URL: {{ cropImageUrl.substring(0, 50) }}...</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeCropDialog" class="modal-btn">
            取消
          </button>
          <button @click="confirmCrop" class="modal-btn primary">
            确认裁剪
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useEditorStore } from '../stores/editor'
import { useLibraryStore } from '../stores/library'
import { BoundaryState, PuzzleData } from '../types'
import SvgBoundary from '../components/SvgBoundary.vue'
import { Cropper } from 'vue-advanced-cropper'
import type { CropArea } from '../utils/imageStorage'
import 'vue-advanced-cropper/dist/style.css'

// Store和路由
const editorStore = useEditorStore()
const libraryStore = useLibraryStore()
const router = useRouter()

// 模板引用
const canvasRef = ref<HTMLElement>()
const imageInput = ref<HTMLInputElement>()
const importFileInput = ref<HTMLInputElement>()

// 本地状态
const localGridConfig = reactive({
  rows: 4,
  cols: 6,
  pieceWidth: 100,
  pieceHeight: 100
})

// 高宽比设置
const aspectRatioConfig = reactive({
  width: 1,
  height: 1
})

const showImportDialog = ref(false)
const showAddToLibraryDialog = ref(false)
const libraryItemName = ref('')
const libraryItemCategory = ref('自定义')
const libraryItemTags = ref('')
const isAddingToLibrary = ref(false)
const isDragOver = ref(false)

// 移动端状态
const isMobile = ref(false)
const showFloatingToolbar = ref(false)

// 窗口尺寸状态
const windowSize = ref({
  width: window.innerWidth,
  height: window.innerHeight
})

// 裁剪相关状态
const showCropDialog = ref(false)
const cropImageUrl = ref('')
const cropArea = ref<CropArea | null>(null)
const originalImageFile = ref<File | null>(null)
const cropperRef = ref()

// 网格配置更改跟踪
const lastCropGridConfig = ref<typeof localGridConfig | null>(null)
const gridConfigChangedAfterCrop = ref(false)

// 计算属性
const currentImage = computed(() => editorStore.currentImage) // 现在直接是Blob URL
const gridConfig = computed(() => editorStore.gridConfig)
const boundaries = computed(() => editorStore.boundaries)
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

// 计算实际的拼图比例（考虑高宽比设置）
const actualPuzzleRatio = computed(() => {
  const totalWidth = gridConfig.value.cols * gridConfig.value.pieceWidth
  const totalHeight = gridConfig.value.rows * gridConfig.value.pieceHeight
  return `${totalWidth}:${totalHeight}`
})

// 计算容器的实际尺寸（用于SVG网格）
const containerDimensions = computed(() => {
  const aspectRatio = gridConfig.value.cols * gridConfig.value.pieceWidth / (gridConfig.value.rows * gridConfig.value.pieceHeight)
  
  // 设置固定的基准尺寸
  const baseSize = 600
  
  let containerWidth, containerHeight
  if (aspectRatio >= 1) {
    containerWidth = baseSize
    containerHeight = baseSize / aspectRatio
  } else {
    containerHeight = baseSize
    containerWidth = baseSize * aspectRatio
  }
  
  // 应用窗口大小限制 - 针对竖屏优化
  const isPortrait = windowSize.value.height > windowSize.value.width
  const maxWidthRatio = isPortrait ? 0.9 : 0.8  // 竖屏时允许更宽的容器
  const maxHeightRatio = isPortrait ? 0.5 : 0.6  // 竖屏时减少高度占用
  
  const maxWidth = Math.min(containerWidth, windowSize.value.width * maxWidthRatio)
  const maxHeight = Math.min(containerHeight, windowSize.value.height * maxHeightRatio)
  
  if (containerWidth > maxWidth) {
    containerWidth = maxWidth
    containerHeight = containerWidth / aspectRatio
  }
  
  if (containerHeight > maxHeight) {
    containerHeight = maxHeight
    containerWidth = containerHeight * aspectRatio
  }
  
  return { width: containerWidth, height: containerHeight }
})

// 基于容器尺寸计算动态的拼图块尺寸
const dynamicPieceWidth = computed(() => containerDimensions.value.width / gridConfig.value.cols)
const dynamicPieceHeight = computed(() => containerDimensions.value.height / gridConfig.value.rows)

const svgWidth = computed(() => containerDimensions.value.width)
const svgHeight = computed(() => containerDimensions.value.height)
const svgViewBox = computed(() => `0 0 ${svgWidth.value} ${svgHeight.value}`)

const gridRows = computed(() => gridConfig.value.rows)
const gridCols = computed(() => gridConfig.value.cols)

const imageContainerStyle = computed(() => {
  const { width, height } = containerDimensions.value
  
  // 与containerDimensions保持一致的屏幕方向检测
  const isPortrait = windowSize.value.height > windowSize.value.width
  const maxWidthRatio = isPortrait ? 0.9 : 0.8
  const maxHeightRatio = isPortrait ? 0.5 : 0.6
  
  return {
    width: `${width}px`,
    height: `${height}px`,
    position: 'relative',
    maxWidth: `${windowSize.value.width * maxWidthRatio}px`,
    maxHeight: `${windowSize.value.height * maxHeightRatio}px`
  }
})

const backgroundImageStyle = computed(() => ({
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const,
  objectPosition: 'center' as const
}))

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

const processImageFile = async (file: File) => {
  try {
    console.log('开始处理图片文件:', file.name, file.size)
    
    // 保存原始文件
    originalImageFile.value = file
    
    // 创建图片URL用于裁剪
    const imageUrl = URL.createObjectURL(file)
    
    // 等待图片加载完成
    await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        console.log('图片加载完成:', img.width, 'x', img.height)
        resolve(true)
      }
      img.onerror = reject
      img.src = imageUrl
    })
    
    cropImageUrl.value = imageUrl
    
    console.log('图片URL创建成功:', imageUrl)
    console.log('显示裁剪对话框')
    
    // 显示裁剪对话框
    showCropDialog.value = true
  } catch (error) {
    console.error('处理图片文件失败:', error)
    alert('图片处理失败，请重试')
  }
}

const confirmCrop = async () => {
  if (!originalImageFile.value || !cropperRef.value) {
    return
  }
  
  try {
    // 获取裁剪区域
    const cropData = cropperRef.value.getResult()
    if (!cropData) {
      alert('请选择裁剪区域')
      return
    }
    
    // 保存裁剪区域信息
    cropArea.value = {
      x: cropData.coordinates.left,
      y: cropData.coordinates.top,
      width: cropData.coordinates.width,
      height: cropData.coordinates.height
    }
    
    // 使用裁剪区域存储图片
    const { imageStorage } = await import('../utils/imageStorage')
    const filename = await imageStorage.storeCompressedImage(
      originalImageFile.value,
      localGridConfig,
      cropArea.value
    )
    
    // 获取存储后的图片URL
    const imageUrl = await imageStorage.getImageURL(filename)

    // 创建图片对象来获取原始尺寸（仅用于日志记录）
    const img = new Image()
    img.onload = () => {
      // 计算图片宽高比（仅用于日志记录）
      const aspectRatio = img.naturalWidth / img.naturalHeight
      
      // 保持用户当前设置的行列数不变，只更新store中的网格配置
      editorStore.updateGridConfig(localGridConfig)
      // 重新生成边界，使用动态尺寸
      editorStore.generateBoundaries(dynamicPieceWidth.value, dynamicPieceHeight.value)
      
      console.log(`图片尺寸: ${img.naturalWidth}x${img.naturalHeight}, 宽高比: ${aspectRatio.toFixed(2)}, 保持网格: ${localGridConfig.rows}x${localGridConfig.cols}`)
    }

    img.onerror = () => {
      console.error('图片加载失败')
    }

    img.src = imageUrl
    
    // 存储文件名到editorStore，而不是DataURI
    await editorStore.setImage(filename, originalImageFile.value)
    
    // 记录最后一次裁剪时的网格配置
    lastCropGridConfig.value = { ...localGridConfig }
    gridConfigChangedAfterCrop.value = false
    
    // 关闭裁剪对话框
    closeCropDialog()
  } catch (error) {
    console.error('裁剪图片失败:', error)
    alert('裁剪图片失败，请重试')
  }
}

const closeCropDialog = () => {
  showCropDialog.value = false
  if (cropImageUrl.value) {
    URL.revokeObjectURL(cropImageUrl.value)
    cropImageUrl.value = ''
  }
  // 不要清空 originalImageFile，因为用户可能需要重新裁剪或添加到素材库
}

const reopenCropDialog = async () => {
  if (!originalImageFile.value) {
    alert('没有原始图片文件')
    return
  }
  
  // 重新创建图片URL
  const imageUrl = URL.createObjectURL(originalImageFile.value)
  cropImageUrl.value = imageUrl
  showCropDialog.value = true
}

const removeImage = () => {
  editorStore.setImage('')
  // 清理裁剪相关状态
  cropArea.value = null
  originalImageFile.value = null
  if (cropImageUrl.value) {
    URL.revokeObjectURL(cropImageUrl.value)
    cropImageUrl.value = ''
  }
}

const clearAll = async () => {
  if (confirm('确定要清空所有内容吗？这将删除当前图片和所有编辑内容。')) {
    await editorStore.clearEditor()
    
    // 清理裁剪相关状态
    cropArea.value = null
    originalImageFile.value = null
    if (cropImageUrl.value) {
      URL.revokeObjectURL(cropImageUrl.value)
      cropImageUrl.value = ''
    }
    
    // 重置网格配置更改跟踪
    lastCropGridConfig.value = null
    gridConfigChangedAfterCrop.value = false
    
    // 重置高宽比配置
    Object.assign(aspectRatioConfig, {
      width: 1,
      height: 1
    })
    
    // 重置本地网格配置
    Object.assign(localGridConfig, {
      rows: 4,
      cols: 6,
      pieceWidth: 100,
      pieceHeight: 100
    })
    editorStore.updateGridConfig(localGridConfig)
  }
}

const updateGrid = () => {
  editorStore.updateGridConfig(localGridConfig)
  // 重新生成边界，使用动态尺寸
  editorStore.generateBoundaries(dynamicPieceWidth.value, dynamicPieceHeight.value)
  
  // 检查网格配置是否在最后一次裁剪后被更改
  if (lastCropGridConfig.value) {
    const hasChanged = 
      lastCropGridConfig.value.rows !== localGridConfig.rows ||
      lastCropGridConfig.value.cols !== localGridConfig.cols ||
      lastCropGridConfig.value.pieceWidth !== localGridConfig.pieceWidth ||
      lastCropGridConfig.value.pieceHeight !== localGridConfig.pieceHeight
    
    if (hasChanged) {
      gridConfigChangedAfterCrop.value = true
    }
  }
}

const updateAspectRatio = () => {
  // 根据高宽比计算pieceWidth和pieceHeight
  const baseSize = 100 // 基础尺寸
  const ratio = aspectRatioConfig.width / aspectRatioConfig.height
  
  if (ratio >= 1) {
    // 宽度大于等于高度
    localGridConfig.pieceWidth = baseSize
    localGridConfig.pieceHeight = Math.round(baseSize / ratio)
  } else {
    // 高度大于宽度
    localGridConfig.pieceHeight = baseSize
    localGridConfig.pieceWidth = Math.round(baseSize * ratio)
  }
  
  // 确保最小尺寸
  localGridConfig.pieceWidth = Math.max(50, localGridConfig.pieceWidth)
  localGridConfig.pieceHeight = Math.max(50, localGridConfig.pieceHeight)
  
  editorStore.updateGridConfig(localGridConfig)
  // 重新生成边界，使用动态尺寸
  editorStore.generateBoundaries(dynamicPieceWidth.value, dynamicPieceHeight.value)
  
  // 检查网格配置是否在最后一次裁剪后被更改
  if (lastCropGridConfig.value) {
    const hasChanged = 
      lastCropGridConfig.value.rows !== localGridConfig.rows ||
      lastCropGridConfig.value.cols !== localGridConfig.cols ||
      lastCropGridConfig.value.pieceWidth !== localGridConfig.pieceWidth ||
      lastCropGridConfig.value.pieceHeight !== localGridConfig.pieceHeight
    
    if (hasChanged) {
      gridConfigChangedAfterCrop.value = true
    }
  }
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

const handleBoundaryStateChange = (boundaryId: string, newState: BoundaryState) => {
  editorStore.updateBoundaryState(boundaryId, newState)
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

// 移动端检测
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// 切换悬浮工具栏
const toggleFloatingToolbar = () => {
  showFloatingToolbar.value = !showFloatingToolbar.value
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
  
  if (!currentImage.value || !originalImageFile.value) {
    alert('没有找到原始图片文件')
    return
  }
  
  // 检查网格配置是否在最后一次裁剪后被更改
  if (gridConfigChangedAfterCrop.value) {
    const shouldRecrop = confirm(
      '检测到网格配置已更改，但图片未重新裁剪。\n\n' +
      '为了确保拼图质量，建议重新裁剪图片以匹配当前的网格配置。\n\n' +
      '是否现在重新裁剪？'
    )
    
    if (shouldRecrop) {
      closeAddToLibraryDialog()
      await reopenCropDialog()
      return
    } else {
      const proceed = confirm(
        '确定要使用旧的裁剪区域继续添加到素材库吗？\n\n' +
        '这可能导致拼图块比例不匹配。'
      )
      
      if (!proceed) {
        return
      }
    }
  }
  
  try {
    isAddingToLibrary.value = true
    
    // 解析标签
    const tags = libraryItemTags.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    
    // 创建拼图数据对象
    const puzzleData: PuzzleData = {
      id: `custom_${Date.now()}`,
      name: libraryItemName.value.trim(),
      imageUrl: currentImage.value,
      gridConfig: editorStore.gridConfig,
      boundaries: editorStore.boundaries,
      createdAt: new Date(),
      difficulty: Math.ceil(Math.random() * 5) // 随机难度，实际应根据复杂度计算
    }
    
    // 添加到素材库，使用原始文件和裁剪区域
    const newItem = await libraryStore.addLibraryItem(
      originalImageFile.value,
      libraryItemName.value.trim(),
      libraryItemCategory.value,
      tags,
      puzzleData.gridConfig,
      cropArea.value || undefined
    )
    
    // 更新库项目，添加puzzleData
    if (newItem) {
      libraryStore.updateLibraryItem(newItem.id, {
        ...newItem,
        puzzleData: puzzleData
      })
    }
    
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
  isDragOver.value = false
}

const triggerFileSelect = () => {
  importFileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processImportFile(file)
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
}

const handleImportDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    processImportFile(file)
  }
}

const processImportFile = async (file: File) => {
  // 检查文件类型
  if (file.type === 'application/json' || file.name.endsWith('.json') || file.name.endsWith('.puzzle')) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result as string
      if (content) {
        const success = await editorStore.importPuzzle(content)
        if (success) {
          // 同步本地网格配置
          Object.assign(localGridConfig, gridConfig.value)
          closeImportDialog()
          alert('拼图数据导入成功！')
        } else {
          alert('导入失败，请检查文件格式是否正确')
        }
      }
    }
    reader.readAsText(file)
  } else {
    alert('请选择 .json 或 .puzzle 格式的文件')
  }
}

// 生命周期
onMounted(async () => {
  // 同步网格配置
  Object.assign(localGridConfig, gridConfig.value)
  
  // 根据当前网格配置计算高宽比
  const currentRatio = localGridConfig.pieceWidth / localGridConfig.pieceHeight
  if (currentRatio >= 1) {
    aspectRatioConfig.width = currentRatio
    aspectRatioConfig.height = 1
  } else {
    aspectRatioConfig.width = 1
    aspectRatioConfig.height = 1 / currentRatio
  }
  
  // 尝试加载草稿
  await editorStore.loadDraft()
  
  // 生成初始边界
  if (boundaries.value.length === 0) {
    editorStore.generateBoundaries(dynamicPieceWidth.value, dynamicPieceHeight.value)
  }
  
  // 添加窗口大小变化监听器
  handleResize = () => {
    windowSize.value = {
      width: window.innerWidth,
      height: window.innerHeight
    }
    checkMobile() // 同时检测移动端状态
  }
  
  window.addEventListener('resize', handleResize)
  
  // 初始化移动端检测
  checkMobile()
})

// 窗口大小变化处理函数
let handleResize: (() => void) | null = null

// 清理函数
onUnmounted(() => {
  if (handleResize) {
    window.removeEventListener('resize', handleResize)
  }
})
</script>

<style scoped>
.editor-view {
  @apply h-screen flex flex-col;
  background-color: var(--settings-bg);
}

/* 移动端适配 */
@media (max-width: 767px) {
  .editor-view {
    height: calc(100vh - 60px);
    margin-top: 0;
  }
  
  /* 工具栏移动端优化 */
  .editor-toolbar {
    @apply flex-col space-y-3 px-4 py-3;
  }
  
  .toolbar-left {
    @apply w-full justify-between;
  }
  
  .toolbar-right {
    @apply w-full flex-wrap gap-2;
  }
  
  .toolbar-btn {
    @apply flex-1 min-w-0 text-xs px-2 py-1;
  }
  
  /* 内容区域移动端布局 */
  .editor-content {
    @apply flex-col;
  }
  
  .editor-sidebar {
    @apply w-full h-auto max-h-80 overflow-y-auto border-b;
  }
  
  .control-section {
    @apply p-4;
  }
  
  .section-title {
    @apply text-base mb-3;
  }
  
  .grid-controls {
    @apply grid grid-cols-2 gap-3;
  }
  
  .control-group {
    @apply flex flex-col;
  }
  
  .control-group label {
    @apply text-xs mb-1;
  }
  
  .number-input, .text-input {
    @apply text-sm py-1.5;
  }
  
  .editor-main {
    @apply flex-1 p-2 min-h-0;
  }
  
  .empty-canvas {
    @apply min-w-0 w-full h-64;
  }
  
  .image-upload-area {
    @apply h-32;
  }
  
  .upload-placeholder {
    @apply h-32;
  }
  
  .uploaded-image {
    @apply h-32;
  }
  
  /* 模态框移动端优化 */
  .modal-dialog {
    @apply w-full max-w-none mx-2;
  }
  
  .modal-body {
    @apply p-3;
  }
  
  .form-group {
    @apply mb-3;
  }
  
  .form-input, .form-select {
    @apply text-sm py-2;
  }
  
  .modal-footer {
    @apply p-3;
  }
  
  .modal-btn {
    @apply px-3 py-2 text-sm;
  }
  
  /* 导入区域移动端优化 */
  .import-drop-zone {
    @apply h-48;
  }
  
  .drop-zone-content h4 {
    @apply text-lg;
  }
  
  .file-select-btn {
    @apply px-4 py-2 text-sm;
  }
}

/* 新的布局样式 */
.editor-header {
  @apply flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 shadow-sm border-b;
  background-color: var(--settings-card-bg);
  border-bottom-color: var(--settings-border);
}

.editor-title {
  @apply text-xl sm:text-2xl font-bold;
  color: var(--settings-text-primary);
}

.clear-btn {
  @apply px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200;
  @apply bg-red-100 text-red-700 hover:bg-red-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
}

.clear-btn:hover {
  background-color: var(--settings-border);
}

/* 上传状态样式 */
.upload-state {
  @apply flex-1 flex items-center justify-center p-4;
}

.upload-container {
  @apply w-full max-w-md mx-auto text-center;
}

.upload-area {
  @apply w-full h-64 border-2 border-dashed rounded-lg;
  @apply flex flex-col items-center justify-center cursor-pointer;
  @apply transition-all duration-200 mb-6;
  border-color: var(--settings-border);
  background-color: var(--settings-card-bg);
}

.upload-area:hover {
  border-color: var(--settings-accent);
  background-color: var(--settings-hover);
}

.upload-icon {
  @apply text-6xl mb-4;
}

.upload-title {
  @apply text-2xl font-bold mb-2;
  color: var(--settings-text-primary);
}

.upload-description {
  @apply text-lg mb-2;
  color: var(--settings-text-secondary);
}

.upload-hint {
  @apply text-sm;
  color: var(--settings-text-secondary);
}

.upload-actions {
  @apply flex justify-center;
}

.action-btn {
  @apply px-6 py-3 text-base font-medium rounded-lg transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
}

.action-btn:hover {
  background-color: var(--settings-border);
}

.action-btn.secondary {
  @apply bg-blue-100 text-blue-700 hover:bg-blue-200;
  background-color: var(--settings-accent);
  color: white;
}

.action-btn.secondary:hover {
  background-color: var(--settings-accent-hover, #2563eb);
}

/* 编辑器状态样式 */
.editor-state {
  @apply flex-1 flex flex-col overflow-hidden;
}

.editor-main {
  @apply flex-1 flex items-center justify-center p-4;
}

.editor-canvas {
  @apply w-full h-full flex items-center justify-center;
}

.image-container {
  @apply relative rounded-lg shadow-lg overflow-hidden;
  @apply w-full max-w-full;
  background-color: var(--settings-card-bg);
}

.background-image {
  @apply w-full h-full object-contain;
}

.grid-overlay {
  @apply absolute inset-0 z-10;
}

/* 网格配置面板样式 */
.editor-config-panel {
  @apply px-4 sm:px-6 py-3 sm:py-4 border-t;
  background-color: var(--settings-card-bg);
  border-top-color: var(--settings-border);
}

.config-title {
  @apply text-sm font-semibold mb-3;
  color: var(--settings-text-primary);
}

.config-controls {
  @apply grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4;
}

.config-group {
  @apply flex flex-col;
}

.config-group label {
  @apply text-xs font-medium mb-1;
  color: var(--settings-text-secondary);
}

.config-input {
  @apply w-full px-2 py-1.5 text-sm border rounded-md;
  @apply focus:outline-none focus:ring-2 focus:border-transparent;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
  border-color: var(--settings-border);
}

.config-input:focus {
  border-color: var(--settings-accent);
}

/* 边界操作区域样式 */
.boundary-controls {
  @apply mt-4 pt-4 border-t;
  border-top-color: var(--settings-border);
}

/* 桌面端显示，移动端隐藏 */
.desktop-only {
  display: block;
}

@media (max-width: 767px) {
  .desktop-only {
    display: none;
  }
}

.boundary-title {
  @apply text-xs font-semibold mb-2;
  color: var(--settings-text-primary);
}

.boundary-buttons {
  @apply flex gap-3;
}

.boundary-btn {
  @apply px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
  min-width: 120px;
}

.boundary-btn:hover {
  background-color: var(--settings-border);
}

.boundary-btn:hover {
  background-color: var(--settings-border);
}

.boundary-btn:disabled {
  @apply cursor-not-allowed;
  background-color: var(--settings-border);
  color: var(--settings-text-secondary);
  opacity: 0.6;
}

/* 高宽比输入框样式 */
.aspect-ratio-group {
  @apply col-span-2;
}

.aspect-ratio-inputs {
  @apply flex items-center space-x-2;
}

.aspect-input {
  @apply flex-1;
}

.ratio-separator {
  @apply text-lg font-semibold;
  color: var(--settings-text-primary);
  min-width: 12px;
  text-align: center;
}

/* 底部操作栏样式 */
.editor-bottom-bar {
  @apply flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 shadow-sm border-t;
  background-color: var(--settings-card-bg);
  border-top-color: var(--settings-border);
}

.bottom-info {
  @apply flex items-center space-x-3 text-sm;
  color: var(--settings-text-secondary);
}

.info-item {
  @apply px-2 py-1 rounded-full;
  background-color: var(--settings-hover);
  color: var(--settings-text-secondary);
}

.info-item.warning {
  background-color: #fef3c7;
  color: #92400e;
  border: 1px solid #f59e0b;
}

.bottom-actions {
  @apply flex items-center space-x-2;
}

.bottom-btn {
  @apply px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
}

.bottom-btn:hover {
  background-color: var(--settings-border);
}

.bottom-btn:hover {
  background-color: var(--settings-border);
}

.bottom-btn.primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
  background-color: var(--settings-accent);
  color: white;
}

.bottom-btn.primary:hover {
  background-color: var(--settings-accent-hover, #2563eb);
}

.bottom-btn:disabled {
  @apply cursor-not-allowed;
  background-color: var(--settings-border);
  color: var(--settings-text-secondary);
  opacity: 0.6;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .editor-view {
    height: calc(100vh - 60px);
    margin-top: 0;
  }
  
  .editor-header {
    @apply px-4 py-3;
  }
  
  .editor-title {
    @apply text-lg;
  }
  
  .clear-btn {
    @apply px-2 py-1 text-xs;
  }
  
  /* 上传区域移动端优化 */
  .upload-area {
    @apply h-48;
  }
  
  .upload-icon {
    @apply text-4xl mb-3;
  }
  
  .upload-title {
    @apply text-xl mb-2;
  }
  
  .upload-description {
    @apply text-base mb-1;
  }
  
  .action-btn {
    @apply px-4 py-2 text-sm;
  }
  
  /* 主编辑区域移动端优化 */
  .editor-main {
    @apply p-2;
  }
  
  .image-container {
    @apply w-full h-auto;
  }
  
  /* 配置面板移动端优化 */
  .editor-config-panel {
    @apply px-4 py-3;
  }
  
  .config-title {
    @apply text-xs mb-2;
  }
  
  .config-controls {
    @apply grid-cols-2 gap-2;
  }
  
  .config-group label {
    @apply text-xs mb-1;
  }
  
  .config-input {
    @apply px-2 py-1 text-xs;
  }
  
  /* 边界操作区域移动端优化 */
  .boundary-controls {
    @apply mt-3 pt-3;
  }
  
  .boundary-title {
    @apply text-xs mb-2;
  }
  
  .boundary-buttons {
    @apply flex-col gap-2;
  }
  
  .boundary-btn {
    @apply w-full px-3 py-2 text-sm;
    min-width: auto;
  }
  
  /* 底部操作栏移动端优化 */
  .editor-bottom-bar {
    @apply flex-col space-y-2 px-4 py-3;
  }
  
  .bottom-info {
    @apply w-full justify-center flex-wrap gap-2;
  }
  
  .bottom-actions {
    @apply w-full justify-center flex-wrap gap-2;
  }
  
  .bottom-btn {
    @apply flex-1 min-w-0 text-xs px-2 py-1;
  }
  
  /* 模态框移动端优化 */
  .modal-dialog {
    @apply w-full max-w-none mx-2;
  }
  
  .modal-body {
    @apply p-3;
  }
  
  .form-group {
    @apply mb-3;
  }
  
  .form-input, .form-select {
    @apply text-sm py-2;
  }
  
  .modal-footer {
    @apply p-3;
  }
  
  .modal-btn {
    @apply px-3 py-2 text-sm;
  }
  
  /* 导入区域移动端优化 */
  .import-drop-zone {
    @apply h-48;
  }
  
  .drop-zone-content h4 {
    @apply text-lg;
  }
  
  .file-select-btn {
    @apply px-4 py-2 text-sm;
  }
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
  @apply text-2xl cursor-pointer;
  color: var(--settings-text-secondary);
}

.close-btn:hover {
  color: var(--settings-text-primary);
}

.modal-body {
  @apply p-4;
}

.import-textarea {
  @apply w-full h-32 p-3 border rounded-md resize-none;
  @apply focus:outline-none focus:ring-2;
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
  @apply w-full px-3 py-2 border rounded-md;
  @apply focus:outline-none focus:ring-2 focus:border-transparent;
  @apply transition-colors duration-200;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
  border-color: var(--settings-border);
}

.form-input:focus,
.form-select:focus {
  border-color: var(--settings-accent);
}

.form-select option {
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
}

.form-input:disabled,
.form-select:disabled {
  @apply cursor-not-allowed;
  background-color: var(--settings-border);
}

.form-hint {
  @apply mt-1 text-xs;
  color: var(--settings-text-secondary);
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

.modal-btn:disabled {
  @apply opacity-60 cursor-not-allowed;
}

.import-drop-zone {
  @apply w-full h-64 border-2 border-dashed rounded-lg;
  @apply flex items-center justify-center cursor-pointer;
  @apply transition-all duration-200;
  border-color: var(--settings-border);
  background-color: var(--settings-card-bg);
}

.import-drop-zone:hover {
  border-color: var(--settings-accent);
  background-color: var(--settings-hover);
}

.import-drop-zone.drag-over {
  @apply border-blue-500 bg-blue-50;
  border-color: var(--settings-accent);
  background-color: var(--settings-accent);
  opacity: 0.1;
}

.drop-zone-content {
  @apply text-center space-y-3;
}

.drop-icon {
  @apply text-5xl mb-4;
}

.drop-zone-content h4 {
  @apply text-xl font-semibold mb-3;
  color: var(--settings-text-primary);
}

.drop-zone-content p {
  @apply text-sm;
  color: var(--settings-text-secondary);
}

.drop-hint {
  @apply text-sm font-medium my-4;
  color: var(--settings-text-secondary);
}

.file-select-btn {
  @apply px-6 py-3 text-base font-medium rounded-lg;
  @apply bg-blue-500 text-white hover:bg-blue-600;
  @apply transition-colors duration-200 shadow-sm;
  background-color: var(--settings-accent);
  color: white;
}

.file-select-btn:hover {
  background-color: var(--settings-accent-hover, #2563eb);
  @apply shadow-md;
}

/* 移动端悬浮工具栏样式 */
.mobile-floating-toolbar {
  @apply fixed top-20 right-6 z-50;
}

.floating-ball-btn {
  @apply w-14 h-14 rounded-full shadow-lg transition-all duration-300;
  @apply flex items-center justify-center;
  background-color: var(--settings-accent);
  color: white;
  border: none;
  cursor: pointer;
}

.floating-ball-btn:hover {
  @apply scale-110 shadow-xl;
  background-color: var(--settings-accent-hover, #2563eb);
}

.floating-ball-btn.expanded {
  @apply scale-110;
  background-color: var(--settings-accent-hover, #2563eb);
}

.ball-icon {
  @apply text-xl font-bold;
}

.floating-toolbar-content {
  @apply absolute top-16 right-0 w-64 p-4 rounded-lg shadow-xl;
  background-color: var(--settings-card-bg);
  border: 1px solid var(--settings-border);
  animation: slideDown 0.3s ease-out;
  /* 确保工具栏不会超出屏幕顶部 */
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toolbar-header {
  @apply mb-3 pb-2 border-b;
  border-bottom-color: var(--settings-border);
}

.toolbar-title {
  @apply text-sm font-semibold;
  color: var(--settings-text-primary);
}

.toolbar-buttons {
  @apply space-y-2;
}

.toolbar-btn {
  @apply w-full flex items-center px-3 py-2 rounded-md transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
  border: none;
  cursor: pointer;
}

.toolbar-btn:hover {
  background-color: var(--settings-border);
}

.toolbar-btn:hover {
  background-color: var(--settings-border);
}

.toolbar-btn:disabled {
  @apply cursor-not-allowed;
  background-color: var(--settings-border);
  color: var(--settings-text-secondary);
  opacity: 0.6;
}

.btn-icon {
  @apply text-lg mr-3;
}

.btn-text {
  @apply text-sm font-medium;
}

/* 移动端悬浮工具栏额外优化 */
@media (max-width: 767px) {
  .mobile-floating-toolbar {
    /* 确保在移动端有足够的顶部间距，避免遮住清空按钮 */
    top: 150px;
  }
  
  .floating-toolbar-content {
    /* 移动端工具栏宽度调整 */
    width: 280px;
    max-height: calc(100vh - 160px);
  }
}

/* 裁剪对话框样式 */
.crop-dialog {
  @apply w-full max-w-4xl mx-4;
  max-height: 90vh;
}

.crop-body {
  @apply p-0;
  max-height: calc(90vh - 120px);
  overflow: hidden;
}

.cropper-container {
  @apply w-full h-96 sm:h-[500px] lg:h-[600px];
  background-color: var(--settings-card-bg);
}

.cropper {
  @apply w-full h-full;
}

.cropper-background {
  background-color: var(--settings-card-bg);
}

.loading-placeholder {
  @apply w-full h-full flex items-center justify-center;
  background-color: var(--settings-card-bg);
}

.loading-placeholder p {
  @apply text-lg;
  color: var(--settings-text-secondary);
}

.crop-hint {
  @apply p-4 border-t;
  border-top-color: var(--settings-border);
  background-color: var(--settings-card-bg);
}

.crop-hint p {
  @apply text-sm mb-1;
  color: var(--settings-text-secondary);
}

.crop-hint p:last-child {
  @apply font-medium;
  color: var(--settings-text-primary);
}

/* 移动端裁剪对话框优化 */
@media (max-width: 767px) {
  .crop-dialog {
    @apply w-full max-w-none mx-2;
    max-height: 95vh;
  }
  
  .cropper-container {
    @apply h-80;
  }
  
  .crop-hint {
    @apply p-3;
  }
  
  .crop-hint p {
    @apply text-xs;
  }
}
</style>
