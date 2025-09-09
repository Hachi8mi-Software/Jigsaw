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
                  @click="selectBoundary"
                  @hover="hoverBoundary"
                  @stateChange="handleBoundaryStateChange"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>

      <!-- 网格配置面板 -->
      <div class="editor-config-panel">
        <h3 class="config-title">网格配置</h3>
        <div class="config-controls">
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
          <div class="config-group aspect-ratio-group">
            <label>高宽比(高:宽)</label>
            <div class="aspect-ratio-inputs">
              <input 
                v-model.number="aspectRatioConfig.height"
                type="number"
                min="1"
                max="10"
                step="0.1"
                @change="updateAspectRatio"
                class="config-input aspect-input"
              />
              <span class="ratio-separator">:</span>
              <input 
                v-model.number="aspectRatioConfig.width"
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
      </div>

      <!-- 底部操作栏 -->
      <div class="editor-bottom-bar">
        <div class="bottom-info">
          <span class="info-item">{{ totalPieces }} 块拼图</span>
          <span class="info-item">难度: {{ puzzleDifficulty }}</span>
          <span class="info-item" v-if="complexBoundaries > 0">
            复杂边界: {{ complexBoundaries }}/{{ totalBoundaries }}
          </span>
        </div>
        
        <div class="bottom-actions">
          <button @click="triggerImageUpload" class="bottom-btn">
            🔄 更换图片
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useEditorStore } from '../stores/editor'
import { useLibraryStore } from '../stores/library'
import { BoundaryState, PuzzleData } from '../types'
import SvgBoundary from '../components/SvgBoundary.vue'

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
  objectFit: 'contain' as const
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
    // 直接使用OPFS存储图片，使用压缩版本
    const { imageStorage } = await import('../utils/imageStorage')
    const filename = await imageStorage.storeCompressedImage(file)
    
    // 获取存储后的图片URL
    const imageUrl = await imageStorage.getImageURL(filename)

    // 创建图片对象来获取原始尺寸
    const img = new Image()
    img.onload = () => {
      // 计算图片宽高比
      const aspectRatio = img.naturalWidth / img.naturalHeight
      
      // 根据宽高比自动设置合适的行列数
      let suggestedCols, suggestedRows
      
      if (aspectRatio > 1.5) {
        // 宽图：更多列
        suggestedCols = 6
        suggestedRows = Math.round(6 / aspectRatio)
      } else if (aspectRatio < 0.75) {
        // 高图：更多行
        suggestedRows = 6
        suggestedCols = Math.round(6 * aspectRatio)
      } else {
        // 接近正方形：平衡的行列数
        suggestedCols = 4
        suggestedRows = Math.round(4 / aspectRatio)
      }
      
      // 确保最小值为2，最大值为12
      suggestedCols = Math.max(2, Math.min(12, suggestedCols))
      suggestedRows = Math.max(2, Math.min(12, suggestedRows))
      
      // 计算建议的高宽比
      const suggestedRatio = aspectRatio
      aspectRatioConfig.width = suggestedRatio >= 1 ? suggestedRatio : 1
      aspectRatioConfig.height = suggestedRatio >= 1 ? 1 : (1 / suggestedRatio)
      
      // 根据高宽比计算pieceWidth和pieceHeight
      const baseSize = 100
      const pieceWidth = suggestedRatio >= 1 ? baseSize : Math.round(baseSize * suggestedRatio)
      const pieceHeight = suggestedRatio >= 1 ? Math.round(baseSize / suggestedRatio) : baseSize
      
      // 更新本地网格配置
      Object.assign(localGridConfig, {
        rows: suggestedRows,
        cols: suggestedCols,
        pieceWidth: Math.max(50, pieceWidth),
        pieceHeight: Math.max(50, pieceHeight)
      })
      
      // 更新store中的网格配置
      editorStore.updateGridConfig(localGridConfig)
      
      console.log(`图片尺寸: ${img.naturalWidth}x${img.naturalHeight}, 宽高比: ${aspectRatio.toFixed(2)}, 建议网格: ${suggestedRows}x${suggestedCols}`)
    }

    img.onerror = () => {
      console.error('图片加载失败')
    }

    img.src = imageUrl
    
    // 存储文件名到editorStore，而不是DataURI
    await editorStore.setImage(filename, file)
  } catch (error) {
    console.error('处理图片文件失败:', error)
    alert('图片处理失败，请重试')
  }
}

const removeImage = () => {
  editorStore.setImage('')
}

const clearAll = async () => {
  if (confirm('确定要清空所有内容吗？这将删除当前图片和所有编辑内容。')) {
    await editorStore.clearEditor()
    
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

// 检查图片比例和网格比例是否匹配
const checkImageGridRatio = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!currentImage.value) {
      resolve(true)
      return
    }
    
    const img = new Image()
    img.onload = () => {
      const imageAspectRatio = img.naturalWidth / img.naturalHeight
      const gridAspectRatio = (gridConfig.value.cols * gridConfig.value.pieceWidth) / (gridConfig.value.rows * gridConfig.value.pieceHeight)
      
      // 计算比例差异（允许10%的误差）
      const ratioDifference = Math.abs(imageAspectRatio - gridAspectRatio) / imageAspectRatio
      
      if (ratioDifference > 0.1) {
        // 比例不匹配，弹出警告
        const imageRatioText = imageAspectRatio > 1 ? `${imageAspectRatio.toFixed(2)}:1 (横向)` : `1:${(1/imageAspectRatio).toFixed(2)} (纵向)`
        const gridRatioText = gridAspectRatio > 1 ? `${gridAspectRatio.toFixed(2)}:1 (横向)` : `1:${(1/gridAspectRatio).toFixed(2)} (纵向)`
        
        const message = `⚠️ 比例不匹配警告\n\n` +
          `图片原始比例: ${imageRatioText}\n` +
          `当前网格比例: ${gridRatioText}\n\n` +
          `比例不匹配可能导致图片在游戏中被裁剪或变形。\n\n` +
          `建议调整网格设置：\n` +
          `• 行数: ${gridConfig.value.rows} → ${Math.round(gridConfig.value.cols / imageAspectRatio)}\n` +
          `• 列数: ${gridConfig.value.cols}\n\n` +
          `是否仍要继续添加到素材库？`
        
        const userConfirmed = confirm(message)
        resolve(userConfirmed)
      } else {
        // 比例匹配，直接继续
        resolve(true)
      }
    }
    
    img.onerror = () => {
      console.error('无法加载图片进行比例检查')
      resolve(true) // 出错时允许继续
    }
    
    img.src = currentImage.value
  })
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
  
  // 检查图片比例和网格比例是否匹配
  const shouldCheckRatio = await checkImageGridRatio()
  if (!shouldCheckRatio) {
    return // 用户取消了操作
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
    
    // 添加到素材库，并传递自定义拼图数据和 gridConfig 进行中心裁剪
    const newItem = await libraryStore.addLibraryItem(
      editorStore.originalImageFile,
      libraryItemName.value.trim(),
      libraryItemCategory.value,
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
    editorStore.generateBoundaries()
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
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
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
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
  border-color: var(--settings-border);
}

.config-input:focus {
  border-color: var(--settings-accent);
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

.bottom-actions {
  @apply flex items-center space-x-2;
}

.bottom-btn {
  @apply px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200;
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
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
  @apply bg-gray-200 text-gray-400 cursor-not-allowed;
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
</style>
