<!--
  设置视图
  应用设置和用户偏好配置
-->

<template>
  <div class="settings-view">
    <div class="settings-container">
      <h1 class="settings-title">⚙️ 应用设置</h1>
      
      <div class="settings-content">
        <!-- 游戏设置 -->
        <div class="settings-section">
          <h2 class="section-title">🎮 游戏设置</h2>
          <div class="settings-grid">
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  v-model="gameSettings.showBackground"
                  type="checkbox"
                  class="setting-checkbox"
                />
                显示背景参考图
              </label>
              <p class="setting-description">在游戏中显示半透明的原图作为参考</p>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  v-model="gameSettings.showGrid"
                  type="checkbox"
                  class="setting-checkbox"
                />
                显示网格辅助线
              </label>
              <p class="setting-description">显示网格线帮助对齐拼图块</p>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  v-model="gameSettings.autoSnap"
                  type="checkbox"
                  class="setting-checkbox"
                />
                自动吸附
              </label>
              <p class="setting-description">拼图块靠近正确位置时自动对齐</p>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  v-model="gameSettings.enableRotation"
                  type="checkbox"
                  class="setting-checkbox"
                />
                启用拼图块旋转
              </label>
              <p class="setting-description">允许旋转拼图块增加难度</p>
            </div>
          </div>
        </div>

        <!-- 界面设置 -->
        <div class="settings-section">
          <h2 class="section-title">🎨 界面设置</h2>
          <div class="settings-grid">
            <div class="setting-item">
              <label class="setting-label">
                主题色彩
              </label>
              <select v-model="uiSettings.theme" class="setting-select">
                <option value="light">浅色主题</option>
                <option value="dark">深色主题</option>
                <option value="auto">跟随系统</option>
              </select>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                界面语言
              </label>
              <select v-model="uiSettings.language" class="setting-select">
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                动画效果
              </label>
              <select v-model="uiSettings.animations" class="setting-select">
                <option value="full">完整动画</option>
                <option value="reduced">减少动画</option>
                <option value="none">禁用动画</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 音效设置 -->
        <div class="settings-section">
          <h2 class="section-title">🔊 音效设置</h2>
          <div class="settings-grid">
            <div class="setting-item">
              <label class="setting-label">
                主音量
              </label>
              <div class="volume-control">
                <input 
                  v-model.number="audioSettings.masterVolume"
                  type="range"
                  min="0"
                  max="100"
                  class="setting-range"
                />
                <span class="volume-value">{{ audioSettings.masterVolume }}%</span>
              </div>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                游戏音效
              </label>
              <div class="volume-control">
                <input 
                  v-model.number="audioSettings.soundEffects"
                  type="range"
                  min="0"
                  max="100"
                  class="setting-range"
                />
                <span class="volume-value">{{ audioSettings.soundEffects }}%</span>
              </div>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  v-model="audioSettings.enableSounds"
                  type="checkbox"
                  class="setting-checkbox"
                />
                启用音效
              </label>
              <p class="setting-description">播放拼图放置和完成音效</p>
            </div>
          </div>
        </div>

        <!-- 性能设置 -->
        <div class="settings-section">
          <h2 class="section-title">⚡ 性能设置</h2>
          <div class="settings-grid">
            <div class="setting-item">
              <label class="setting-label">
                渲染质量
              </label>
              <select v-model="performanceSettings.renderQuality" class="setting-select">
                <option value="high">高质量</option>
                <option value="medium">中等质量</option>
                <option value="low">低质量</option>
              </select>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                最大拼图块数
              </label>
              <select v-model.number="performanceSettings.maxPieces" class="setting-select">
                <option :value="100">100 块</option>
                <option :value="500">500 块</option>
                <option :value="1000">1000 块</option>
                <option :value="2000">2000 块</option>
              </select>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  v-model="performanceSettings.enableGPUAcceleration"
                  type="checkbox"
                  class="setting-checkbox"
                />
                启用GPU加速
              </label>
              <p class="setting-description">使用硬件加速提升渲染性能</p>
            </div>
          </div>
        </div>

        <!-- 数据管理 -->
        <div class="settings-section">
          <h2 class="section-title">💾 数据管理</h2>
          <div class="settings-grid">
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  v-model="dataSettings.autoSave"
                  type="checkbox"
                  class="setting-checkbox"
                />
                自动保存游戏进度
              </label>
              <p class="setting-description">自动保存游戏状态，避免进度丢失</p>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                保存间隔
              </label>
              <select v-model.number="dataSettings.saveInterval" class="setting-select">
                <option :value="30">30 秒</option>
                <option :value="60">1 分钟</option>
                <option :value="300">5 分钟</option>
              </select>
            </div>
          </div>
          
          <div class="data-actions">
            <button @click="exportData" class="data-btn">
              📤 导出数据
            </button>
            <button @click="importData" class="data-btn">
              📥 导入数据
            </button>
            <button @click="clearData" class="data-btn danger">
              🗑️ 清除所有数据
            </button>
          </div>
        </div>

        <!-- 关于信息 -->
        <div class="settings-section">
          <h2 class="section-title">ℹ️ 关于</h2>
          <div class="about-info">
            <div class="app-info">
              <h3>拼图乐 - Puzzle Fun</h3>
              <p>版本: 1.0.0</p>
              <p>基于 Tauri + Vue 3 构建的跨平台拼图应用</p>
            </div>
            <div class="about-links">
              <button @click="openGitHub" class="link-btn">
                📱 GitHub
              </button>
              <button @click="showLicenses" class="link-btn">
                📄 开源许可
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="settings-footer">
        <button @click="resetToDefaults" class="footer-btn">
          🔄 恢复默认
        </button>
        <button @click="saveSettings" class="footer-btn primary">
          💾 保存设置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'

// 设置状态
const gameSettings = reactive({
  showBackground: true,
  showGrid: true,
  autoSnap: true,
  enableRotation: false
})

const uiSettings = reactive({
  theme: 'light',
  language: 'zh-CN',
  animations: 'full'
})

const audioSettings = reactive({
  masterVolume: 70,
  soundEffects: 80,
  enableSounds: true
})

const performanceSettings = reactive({
  renderQuality: 'high',
  maxPieces: 1000,
  enableGPUAcceleration: true
})

const dataSettings = reactive({
  autoSave: true,
  saveInterval: 60
})

// 方法
const saveSettings = () => {
  const settings = {
    game: gameSettings,
    ui: uiSettings,
    audio: audioSettings,
    performance: performanceSettings,
    data: dataSettings
  }
  
  localStorage.setItem('app_settings', JSON.stringify(settings))
  alert('设置已保存')
}

const loadSettings = () => {
  try {
    const saved = localStorage.getItem('app_settings')
    if (saved) {
      const settings = JSON.parse(saved)
      Object.assign(gameSettings, settings.game || {})
      Object.assign(uiSettings, settings.ui || {})
      Object.assign(audioSettings, settings.audio || {})
      Object.assign(performanceSettings, settings.performance || {})
      Object.assign(dataSettings, settings.data || {})
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

const resetToDefaults = () => {
  if (confirm('确定要恢复所有设置到默认值吗？')) {
    Object.assign(gameSettings, {
      showBackground: true,
      showGrid: true,
      autoSnap: true,
      enableRotation: false
    })
    
    Object.assign(uiSettings, {
      theme: 'light',
      language: 'zh-CN',
      animations: 'full'
    })
    
    Object.assign(audioSettings, {
      masterVolume: 70,
      soundEffects: 80,
      enableSounds: true
    })
    
    Object.assign(performanceSettings, {
      renderQuality: 'high',
      maxPieces: 1000,
      enableGPUAcceleration: true
    })
    
    Object.assign(dataSettings, {
      autoSave: true,
      saveInterval: 60
    })
  }
}

const exportData = () => {
  const data = {
    settings: {
      game: gameSettings,
      ui: uiSettings,
      audio: audioSettings,
      performance: performanceSettings,
      data: dataSettings
    },
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

const importData = () => {
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
          if (data.settings) {
            Object.assign(gameSettings, data.settings.game || {})
            Object.assign(uiSettings, data.settings.ui || {})
            Object.assign(audioSettings, data.settings.audio || {})
            Object.assign(performanceSettings, data.settings.performance || {})
            Object.assign(dataSettings, data.settings.data || {})
            alert('设置导入成功')
          }
        } catch (error) {
          alert('导入失败，文件格式不正确')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

const clearData = () => {
  if (confirm('确定要清除所有数据吗？这将删除所有设置、游戏记录和自定义拼图！')) {
    if (confirm('此操作无法撤销，确定继续吗？')) {
      localStorage.clear()
      alert('所有数据已清除')
      location.reload()
    }
  }
}

const openGitHub = () => {
  window.open('https://github.com', '_blank')
}

const showLicenses = () => {
  alert('开源许可信息将在后续版本中提供')
}

// 生命周期
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings-view {
  @apply min-h-screen bg-gray-50 py-8;
}

.settings-container {
  @apply max-w-4xl mx-auto px-6;
}

.settings-title {
  @apply text-3xl font-bold text-center text-gray-800 mb-8;
}

.settings-content {
  @apply space-y-8;
}

.settings-section {
  @apply bg-white rounded-lg shadow-md p-6;
}

.section-title {
  @apply text-xl font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200;
}

.settings-grid {
  @apply space-y-6;
}

.setting-item {
  @apply flex flex-col;
}

.setting-label {
  @apply text-sm font-medium text-gray-700 mb-2 flex items-center cursor-pointer;
}

.setting-checkbox {
  @apply mr-2;
}

.setting-select, .setting-range {
  @apply w-full max-w-xs;
}

.setting-select {
  @apply px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.setting-range {
  @apply appearance-none h-2 bg-gray-200 rounded-lg cursor-pointer;
}

.setting-description {
  @apply text-xs text-gray-500 mt-1;
}

.volume-control {
  @apply flex items-center space-x-3;
}

.volume-value {
  @apply text-sm text-gray-600 min-w-12;
}

.data-actions {
  @apply flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200;
}

.data-btn {
  @apply px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200;
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.data-btn.danger {
  @apply bg-red-500 text-white hover:bg-red-600;
}

.about-info {
  @apply flex flex-col md:flex-row justify-between items-start md:items-center;
}

.app-info h3 {
  @apply text-lg font-semibold text-gray-800 mb-2;
}

.app-info p {
  @apply text-sm text-gray-600 mb-1;
}

.about-links {
  @apply flex space-x-3 mt-4 md:mt-0;
}

.link-btn {
  @apply px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded;
  @apply hover:bg-blue-200 transition-colors duration-200;
}

.settings-footer {
  @apply flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200;
}

.footer-btn {
  @apply px-6 py-2 text-sm font-medium rounded-md transition-colors duration-200;
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.footer-btn.primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}
</style>
