import { useSettingsStore } from '@/stores/settings'
import { useNotificationStore } from '@/stores/notification'
import { computed, ref } from 'vue'
import { audioUtils } from '@/utils/audioUtils'
import { saveManager, type SaveSlot } from '@/services/SaveManager'

export class SettingsViewModel {
  private settingsStore = useSettingsStore()
  private notificationStore = useNotificationStore()
  
  // 响应式状态
  private saveSlotsState = ref<SaveSlot[]>([])
  private currentSlotState = ref<string>('default')

  // 难度设置计算属性
  public difficulty = computed({
    get: () => this.settingsStore.settings.game.difficulty,
    set: (value: 'easy' | 'medium' | 'hard') => {
      this.settingsStore.settings.game.difficulty = value
      // 根据难度自动设置旋转和数字显示
      switch (value) {
        case 'easy':
          this.settingsStore.settings.game.showNumbers = true
          this.settingsStore.settings.game.enableRotation = false
          break
        case 'medium':
          this.settingsStore.settings.game.showNumbers = false
          this.settingsStore.settings.game.enableRotation = false
          break
        case 'hard':
          this.settingsStore.settings.game.showNumbers = false
          this.settingsStore.settings.game.enableRotation = true
          break
      }
    }
  })
  
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

  // 存档管理相关计算属性
  public saveSlots = computed(() => this.saveSlotsState.value)
  public currentSlot = computed(() => this.saveSlotsState.value.find(slot => slot.id === this.currentSlotState.value) || null)
  public currentSlotId = computed(() => this.currentSlotState.value)

  // 初始化方法
  constructor() {
    this.refreshSaveData()
  }

  // 刷新存档数据
  private refreshSaveData() {
    // 先刷新所有存档的统计信息
    saveManager.refreshAllSlotStats()
    this.saveSlotsState.value = saveManager.getSaveSlots()
    this.currentSlotState.value = saveManager.getCurrentSlotId()
  }

  // 方法
  public saveSettings() {
    this.settingsStore.saveSettings()
    this.notificationStore.success('设置已保存')
  }

  public async resetToDefaults() {
    const confirmed = await this.notificationStore.showConfirm({
      title: '恢复默认设置',
      message: '确定要恢复所有设置到默认值吗？',
      type: 'warning',
      confirmText: '恢复',
      cancelText: '取消'
    })
    
    if (confirmed) {
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
            this.notificationStore.success('设置导入成功')
          } catch (error) {
            this.notificationStore.error('导入失败', '文件格式不正确')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  public async clearData() {
    const firstConfirmed = await this.notificationStore.showConfirm({
      title: '清除所有数据',
      message: '确定要清除所有数据吗？这将删除所有设置、游戏记录和自定义拼图！',
      type: 'danger',
      confirmText: '继续',
      cancelText: '取消'
    })
    
    if (firstConfirmed) {
      const secondConfirmed = await this.notificationStore.showConfirm({
        title: '最终确认',
        message: '此操作无法撤销，确定继续吗？',
        type: 'danger',
        confirmText: '确定清除',
        cancelText: '取消'
      })
      
      if (secondConfirmed) {
        this.settingsStore.clearAllData()
        this.notificationStore.success('所有数据已清除')
        location.reload()
      }
    }
  }

  public openGitHub() {
    window.open('https://github.com', '_blank')
  }

  public showLicenses() {
    this.notificationStore.info('开源许可信息将在后续版本中提供')
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

  // 存档管理方法
  public async createNewSlot(name: string): Promise<boolean> {
    if (!name.trim()) {
      this.notificationStore.error('存档名称不能为空')
      return false
    }

    const slotId = saveManager.createNewSlot(name.trim())
    if (slotId) {
      // 刷新新创建存档的统计信息
      saveManager.refreshSlotStats(slotId)
      this.refreshSaveData() // 刷新数据
      this.notificationStore.success(`存档槽位 "${name}" 创建成功`)
      return true
    } else {
      this.notificationStore.error('创建存档槽位失败，可能已达到最大数量限制')
      return false
    }
  }

  public async switchToSlot(slotId: string): Promise<boolean> {
    const success = saveManager.switchToSlot(slotId)
    if (success) {
      // 刷新当前存档的统计信息
      saveManager.refreshSlotStats(slotId)
      this.refreshSaveData() // 刷新数据
      this.notificationStore.success(`已切换到存档: ${saveManager.getCurrentSlot()?.name}`)
      // 重新加载设置
      this.settingsStore.loadSettings()
      return true
    } else {
      this.notificationStore.error('切换存档失败')
      return false
    }
  }

  public async deleteSlot(slotId: string): Promise<boolean> {
    const slot = this.saveSlotsState.value.find(s => s.id === slotId)
    if (!slot) return false

    const confirmed = await this.notificationStore.showConfirm({
      title: '删除存档',
      message: `确定要删除存档 "${slot.name}" 吗？此操作无法撤销！`,
      type: 'danger',
      confirmText: '删除',
      cancelText: '取消'
    })

    if (confirmed) {
      const success = saveManager.deleteSlot(slotId)
      if (success) {
        this.refreshSaveData() // 刷新数据
        this.notificationStore.success(`存档 "${slot.name}" 已删除`)
        return true
      } else {
        this.notificationStore.error('删除存档失败')
        return false
      }
    }
    return false
  }

  public async renameSlot(slotId: string, newName: string): Promise<boolean> {
    if (!newName.trim()) {
      this.notificationStore.error('存档名称不能为空')
      return false
    }

    const success = saveManager.renameSlot(slotId, newName.trim())
    if (success) {
      this.refreshSaveData() // 刷新数据
      this.notificationStore.success('存档重命名成功')
      return true
    } else {
      this.notificationStore.error('重命名存档失败')
      return false
    }
  }

  public async copySlot(slotId: string, newName: string): Promise<boolean> {
    if (!newName.trim()) {
      this.notificationStore.error('存档名称不能为空')
      return false
    }

    const newSlotId = saveManager.copySlot(slotId, newName.trim())
    if (newSlotId) {
      // 刷新新复制存档的统计信息
      saveManager.refreshSlotStats(newSlotId)
      this.refreshSaveData() // 刷新数据
      this.notificationStore.success(`存档复制成功: "${newName}"`)
      return true
    } else {
      this.notificationStore.error('复制存档失败')
      return false
    }
  }

  public exportSlotData(slotId: string): boolean {
    const data = saveManager.exportSlotData(slotId)
    if (data) {
      const slot = this.saveSlotsState.value.find(s => s.id === slotId)
      const filename = `puzzle-save-${slot?.name || slotId}.json`
      
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      this.notificationStore.success(`存档 "${slot?.name}" 导出成功`)
      return true
    } else {
      this.notificationStore.error('导出存档失败')
      return false
    }
  }

  public importSlotData(): void {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = e.target?.result as string
            const success = saveManager.importSlotData(data)
            if (success) {
              this.refreshSaveData() // 刷新数据
              this.notificationStore.success('存档导入成功')
            } else {
              this.notificationStore.error('导入存档失败', '文件格式不正确')
            }
          } catch (error) {
            this.notificationStore.error('导入存档失败', '文件格式不正确')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }
}
