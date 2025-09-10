import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export interface GameSettings {
  showBackground: boolean
  showGrid: boolean
  autoSnap: boolean
  enableRotation: boolean
  showNumbers: boolean
}

export interface UiSettings {
  theme: 'light' | 'dark' | 'auto'
  language: 'zh-CN' | 'en-US'
  animations: 'full' | 'reduced' | 'none'
}

export interface AudioSettings {
  masterVolume: number
  soundEffects: number
  enableSounds: boolean
}

export interface PerformanceSettings {
  renderQuality: 'high' | 'medium' | 'low'
  maxPieces: number
}

export interface AppSettings {
  game: GameSettings
  ui: UiSettings
  audio: AudioSettings
  performance: PerformanceSettings
}

const defaultSettings: AppSettings = {
  game: {
    showBackground: true,
    showGrid: true,
    autoSnap: true,
    enableRotation: true,
    showNumbers: true
  },
  ui: {
    theme: 'light',
    language: 'zh-CN',
    animations: 'full'
  },
  audio: {
    masterVolume: 70,
    soundEffects: 80,
    enableSounds: true
  },
  performance: {
    renderQuality: 'high',
    maxPieces: 1000
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>({ ...defaultSettings })

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('app_settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        settings.value = { ...defaultSettings, ...parsed }
      }
    } catch (error) {
      console.error('加载设置失败:', error)
      settings.value = { ...defaultSettings }
    }
  }

  const saveSettings = () => {
    try {
      localStorage.setItem('app_settings', JSON.stringify(settings.value))
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  const resetToDefaults = () => {
    settings.value = { ...defaultSettings }
    saveSettings()
  }

  const exportSettings = () => {
    const data = {
      settings: settings.value,
      exportDate: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'puzzle-settings.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importSettings = (data: any) => {
    if (data.settings) {
      settings.value = { ...defaultSettings, ...data.settings }
      saveSettings()
    }
  }

  const clearAllData = () => {
    localStorage.clear()
    settings.value = { ...defaultSettings }
  }

  // 初始化时加载设置
  loadSettings()

  // 监听设置变化并自动保存
  watch(settings, () => {
    saveSettings()
  }, { deep: true })

  return {
    settings,
    loadSettings,
    saveSettings,
    resetToDefaults,
    exportSettings,
    importSettings,
    clearAllData
    }
})