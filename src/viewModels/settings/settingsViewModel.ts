import { useSettingsStore } from '@/stores/settings'
import { computed } from 'vue'
import { audioUtils } from '@/utils/audioUtils'

export class SettingsViewModel {
  private settingsStore = useSettingsStore()

  // 计算属性，绑定到View
  public gameSettings = computed({
    get: () => this.settingsStore.settings.game,
    set: (value) => { this.settingsStore.settings.game = value }
  })
  public uiSettings = computed({
    get: () => this.settingsStore.settings.ui,
    set: (value) => { this.settingsStore.settings.ui = value }
  })
  public audioSettings = computed({
    get: () => this.settingsStore.settings.audio,
    set: (value) => { this.settingsStore.settings.audio = value }
  })
  public performanceSettings = computed({
    get: () => this.settingsStore.settings.performance,
    set: (value) => { this.settingsStore.settings.performance = value }
  })

  // 当前主题计算属性
  public currentTheme = computed(() => {
    const theme = this.uiSettings.value.theme
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  })

  // 方法
  public saveSettings() {
    this.settingsStore.saveSettings()
    alert('设置已保存')
  }

  public resetToDefaults() {
    if (confirm('确定要恢复所有设置到默认值吗？')) {
      this.settingsStore.resetToDefaults()
    }
  }

  public exportData() {
    this.settingsStore.exportSettings()
  }

  public importData() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string)
            this.settingsStore.importSettings(data)
            alert('设置导入成功')
          } catch (error) {
            alert('导入失败，文件格式不正确')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  public clearData() {
    if (confirm('确定要清除所有数据吗？这将删除所有设置、游戏记录和自定义拼图！')) {
      if (confirm('此操作无法撤销，确定继续吗？')) {
        this.settingsStore.clearAllData()
        alert('所有数据已清除')
        location.reload()
      }
    }
  }

  public openGitHub() {
    window.open('https://github.com', '_blank')
  }

  public showLicenses() {
    alert('开源许可信息将在后续版本中提供')
  }

  // 主题切换方法
  public setTheme(theme: 'light' | 'dark' | 'auto') {
    // 直接修改store中的设置，这样能确保响应式更新
    this.settingsStore.settings.ui.theme = theme
    this.settingsStore.saveSettings() // 保存设置
    // 立即应用主题
    this.applyTheme()
  }

  public toggleTheme() {
    const current = this.uiSettings.value.theme
    if (current === 'light') {
      this.setTheme('dark')
    } else if (current === 'dark') {
      this.setTheme('auto')
    } else {
      this.setTheme('light')
    }
  }

  private applyTheme() {
    const theme = this.currentTheme.value
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('app-theme', theme)
    console.log('ViewModel主题已切换到:', theme, '| DOM data-theme:', document.documentElement.getAttribute('data-theme'))
  }

  // 音频试听方法
  public async playTestSound() {
    audioUtils.setMasterVolume(this.audioSettings.value.masterVolume)
    audioUtils.setSoundEffectsVolume(this.audioSettings.value.soundEffects)
    audioUtils.setEnabled(this.audioSettings.value.enableSounds)
    await audioUtils.playTestSound()
  }

  public async playPiecePlacedSound() {
    audioUtils.setMasterVolume(this.audioSettings.value.masterVolume)
    audioUtils.setSoundEffectsVolume(this.audioSettings.value.soundEffects)
    audioUtils.setEnabled(this.audioSettings.value.enableSounds)
    await audioUtils.playPiecePlaced()
  }

  public async playPuzzleCompletedSound() {
    audioUtils.setMasterVolume(this.audioSettings.value.masterVolume)
    audioUtils.setSoundEffectsVolume(this.audioSettings.value.soundEffects)
    audioUtils.setEnabled(this.audioSettings.value.enableSounds)
    await audioUtils.playPuzzleCompleted()
  }

  public async playButtonClickSound() {
    audioUtils.setMasterVolume(this.audioSettings.value.masterVolume)
    audioUtils.setSoundEffectsVolume(this.audioSettings.value.soundEffects)
    audioUtils.setEnabled(this.audioSettings.value.enableSounds)
    await audioUtils.playButtonClick()
  }
}
