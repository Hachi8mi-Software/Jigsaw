/**
 * 拼图编辑器状态管理Store
 * 采用Pinia + 面向对象设计模式
 */

/**
 * 🗑️不符合MVVM规范的代码：useEditorStore直接被View持有
 * 或许存在更多不规范问题
 * 在未来应该修改
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GridConfig, Boundary, PuzzleData } from '../types'
import { BoundaryState } from '../types'
import { BoundaryManager } from '../utils/boundaryUtils'
import { calculateDifficultyFromConfig } from '../utils/difficultyUtils'
import { imageStorage } from '../utils/imageStorage'

/**
 * 编辑器管理器类
 */
class EditorViewModel {
  /**
   * 验证网格配置是否有效
   */
  validateGridConfig(config: GridConfig): boolean {
    return config.rows >= 2 && config.rows <= 50 && 
           config.cols >= 2 && config.cols <= 50
  }

  /**
   * 计算拼图难度
   */
  calculateDifficulty(gridConfig: GridConfig, boundaries: Boundary[]): number {
    // 使用统一的难度计算函数
    return calculateDifficultyFromConfig(gridConfig, boundaries)
  }

  /**
   * 生成拼图预览数据
   */
  generatePreviewData(
    imageUrl: string, 
    gridConfig: GridConfig, 
    boundaries: Boundary[]
  ): PuzzleData {
    return {
      id: `preview_${Date.now()}`,
      name: '预览拼图',
      imageUrl,
      gridConfig,
      boundaries,
      createdAt: new Date(),
      difficulty: this.calculateDifficulty(gridConfig, boundaries)
    }
  }

  /**
   * 导出拼图数据为JSON格式
   */
  exportPuzzleData(puzzleData: PuzzleData): string {
    return JSON.stringify(puzzleData, null, 2)
  }

  /**
   * 从JSON导入拼图数据
   */
  importPuzzleData(jsonString: string): PuzzleData | null {
    try {
      const data = JSON.parse(jsonString)
      // 验证数据结构
      if (data.gridConfig && data.boundaries && data.imageUrl) {
        return data as PuzzleData
      }
      return null
    } catch (error) {
      console.error('导入拼图数据失败:', error)
      return null
    }
  }
}

export const useEditorStore = defineStore('editor', () => {
  // 状态
  const currentImage = ref<string | null>(null) // 存储Blob URL，可直接用于img元素
  const currentImageFilename = ref<string | null>(null) // 存储OPFS文件名用于管理
  const originalImageFile = ref<File | null>(null)
  const gridConfig = ref<GridConfig>({
    rows: 4,
    cols: 6,
    pieceWidth: 100,
    pieceHeight: 100
  })
  const boundaries = ref<Boundary[]>([])
  const isPreviewMode = ref(false)
  const selectedBoundary = ref<string | null>(null)
  const puzzleName = ref('我的拼图')
  const isModified = ref(false)

  // 编辑器管理器实例
  const editorManager = new EditorViewModel()

  // 计算属性
  const totalPieces = computed(() => {
    return gridConfig.value.rows * gridConfig.value.cols
  })

  const totalBoundaries = computed(() => {
    return boundaries.value.length
  })

  const complexBoundaries = computed(() => {
    return boundaries.value.filter(b => b.state !== 'flat').length
  })

  const puzzleDifficulty = computed(() => {
    return editorManager.calculateDifficulty(gridConfig.value, boundaries.value)
  })

  const canExport = computed(() => {
    return currentImage.value !== null && boundaries.value.length > 0
  })

  // 获取当前图片的显示URL
  const getCurrentImageURL = async (): Promise<string | null> => {
    return currentImage.value
  }

  const imageAspectRatio = computed(() => {
    if (!gridConfig.value.pieceWidth || !gridConfig.value.pieceHeight) return 1
    return gridConfig.value.pieceWidth / gridConfig.value.pieceHeight
  })

  // Actions
  const setImage = async (imageFilename: string, imageFile?: File) => {
    // 存储文件名用于管理
    currentImageFilename.value = imageFilename
    
    // 获取Blob URL并存储到currentImage
    try {
      const blobURL = await imageStorage.getImageURL(imageFilename)
      currentImage.value = blobURL
    } catch (error) {
      console.error('获取图片URL失败:', error)
      currentImage.value = null
    }
    
    if (imageFile) {
      originalImageFile.value = imageFile
    }
    isModified.value = true
  }

  const updateGridConfig = (newConfig: Partial<GridConfig>) => {
    const updatedConfig = { ...gridConfig.value, ...newConfig }
    
    if (editorManager.validateGridConfig(updatedConfig)) {
      gridConfig.value = updatedConfig
      // 重新生成边界
      generateBoundaries()
      isModified.value = true
    }
  }

  const generateBoundaries = () => {
    boundaries.value = BoundaryManager.generateInitialBoundaries(gridConfig.value)
    isModified.value = true
  }

  const updateBoundaryState = (boundaryId: string, newState: BoundaryState) => {
    boundaries.value = BoundaryManager.updateBoundaryState(
      boundaries.value, 
      boundaryId, 
      newState
    )
    isModified.value = true
  }

  const cycleBoundaryState = (boundaryId: string) => {
    const boundary = boundaries.value.find(b => b.id === boundaryId)
    if (!boundary) return

    let nextState: BoundaryState
    switch (boundary.state) {
      case 'flat':
        nextState = BoundaryState.CONVEX
        break
      case 'convex':
        nextState = BoundaryState.CONCAVE
        break
      case 'concave':
        nextState = BoundaryState.FLAT
        break
      default:
        nextState = BoundaryState.FLAT
    }

    updateBoundaryState(boundaryId, nextState)
  }

  const randomizeBoundaries = () => {
    boundaries.value = BoundaryManager.randomizeBoundaries(boundaries.value)
    isModified.value = true
  }

  const resetBoundaries = () => {
    boundaries.value = boundaries.value.map(boundary => ({
      ...boundary,
      state: BoundaryState.FLAT
    }))
    isModified.value = true
  }

  const selectBoundary = (boundaryId: string | null) => {
    selectedBoundary.value = boundaryId
  }

  const togglePreviewMode = () => {
    isPreviewMode.value = !isPreviewMode.value
  }

  const setPuzzleName = (name: string) => {
    puzzleName.value = name
    isModified.value = true
  }

  const generatePreview = (): PuzzleData | null => {
    if (!currentImage.value) return null
    
    return editorManager.generatePreviewData(
      currentImage.value,
      gridConfig.value,
      boundaries.value
    )
  }

  const exportPuzzle = (): string | null => {
    if (!canExport.value) return null
    
    const puzzleData: PuzzleData = {
      id: `puzzle_${Date.now()}`,
      name: puzzleName.value,
      imageUrl: `fs://${currentImageFilename.value!}`,
      gridConfig: gridConfig.value,
      boundaries: boundaries.value,
      createdAt: new Date(),
      difficulty: puzzleDifficulty.value
    }

    return editorManager.exportPuzzleData(puzzleData)
  }

  const importPuzzle = async (jsonString: string): Promise<boolean> => {
    const puzzleData = editorManager.importPuzzleData(jsonString)
    if (puzzleData) {
      // 如果导入的数据包含DataURI，需要迁移到OPFS
      let imageFilename = puzzleData.imageUrl
      
      if (puzzleData.imageUrl.startsWith('data:')) {
        try {
          console.log('检测到DataURI，正在迁移到OPFS...')
          imageFilename = await imageStorage.migrateFromDataURI(puzzleData.imageUrl)
          console.log('DataURI迁移成功:', imageFilename)
        } catch (error) {
          console.error('DataURI迁移失败:', error)
          return false
        }
      }
      
      // 设置文件名和获取Blob URL
      currentImageFilename.value = imageFilename
      try {
        const blobURL = await imageStorage.getImageURL(imageFilename)
        currentImage.value = blobURL
      } catch (error) {
        console.error('获取图片URL失败:', error)
        currentImage.value = null
      }
      
      gridConfig.value = puzzleData.gridConfig
      boundaries.value = puzzleData.boundaries
      puzzleName.value = puzzleData.name
      isModified.value = false
      return true
    }
    return false
  }

  const clearEditor = async () => {
    // 清理OPFS中的图片文件
    if (currentImageFilename.value) {
      try {
        await imageStorage.deleteImage(currentImageFilename.value)
      } catch (error) {
        console.warn('清理图片文件失败:', error)
      }
    }
    
    // 释放Blob URL
    if (currentImage.value && currentImage.value.startsWith('blob:')) {
      URL.revokeObjectURL(currentImage.value)
    }
    
    currentImage.value = null
    currentImageFilename.value = null
    originalImageFile.value = null
    gridConfig.value = {
      rows: 4,
      cols: 6,
      pieceWidth: 100,
      pieceHeight: 100
    }
    boundaries.value = []
    selectedBoundary.value = null
    puzzleName.value = '我的拼图'
    isPreviewMode.value = false
    isModified.value = false
  }

  const saveDraft = () => {
    const draft = {
      currentImage: currentImageFilename.value, // 保存文件名而不是Blob URL
      gridConfig: gridConfig.value,
      boundaries: boundaries.value,
      puzzleName: puzzleName.value,
      savedAt: new Date()
    }
    
    localStorage.setItem('puzzle_editor_draft', JSON.stringify(draft))
    isModified.value = false
  }

  const loadDraft = async (): Promise<boolean> => {
    try {
      const draftString = localStorage.getItem('puzzle_editor_draft')
      if (draftString) {
        const draft = JSON.parse(draftString)
        
        // 如果草稿中的图片是DataURI，需要迁移到OPFS
        if (draft.currentImage && draft.currentImage.startsWith('data:')) {
          try {
            console.log('检测到草稿中的DataURI，正在迁移到OPFS...')
            const filename = await imageStorage.migrateFromDataURI(draft.currentImage)
            draft.currentImage = filename
            console.log('草稿DataURI迁移成功:', filename)
          } catch (error) {
            console.error('草稿DataURI迁移失败:', error)
            return false
          }
        }
        
        // 设置文件名和获取Blob URL
        currentImageFilename.value = draft.currentImage
        if (draft.currentImage) {
          try {
            const blobURL = await imageStorage.getImageURL(draft.currentImage)
            currentImage.value = blobURL
          } catch (error) {
            console.error('获取草稿图片URL失败:', error)
            currentImage.value = null
          }
        } else {
          currentImage.value = null
        }
        
        gridConfig.value = draft.gridConfig
        boundaries.value = draft.boundaries
        puzzleName.value = draft.puzzleName
        isModified.value = false
        return true
      }
      return false
    } catch (error) {
      console.error('加载草稿失败:', error)
      return false
    }
  }

  return {
    // 状态
    currentImage, // 现在直接存储可用的Blob URL
    currentImageFilename, // OPFS文件名，用于管理
    originalImageFile,
    gridConfig,
    boundaries,
    isPreviewMode,
    selectedBoundary,
    puzzleName,
    isModified,
    
    // 计算属性
    totalPieces,
    totalBoundaries,
    complexBoundaries,
    puzzleDifficulty,
    canExport,
    imageAspectRatio,
    
    // 方法
    getCurrentImageURL,
    
    // Actions
    setImage,
    updateGridConfig,
    generateBoundaries,
    updateBoundaryState,
    cycleBoundaryState,
    randomizeBoundaries,
    resetBoundaries,
    selectBoundary,
    togglePreviewMode,
    setPuzzleName,
    generatePreview,
    exportPuzzle,
    importPuzzle,
    clearEditor,
    saveDraft,
    loadDraft
  }
})
