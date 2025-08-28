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
                  v-model="viewModel.gameSettings.value.showGrid"
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
                  v-model="viewModel.gameSettings.value.autoSnap"
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
                  v-model="viewModel.gameSettings.value.enableRotation"
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
              <select v-model="viewModel.uiSettings.value.theme" class="setting-select">
                <option value="light">浅色主题</option>
                <option value="dark">深色主题</option>
                <option value="auto">跟随系统</option>
              </select>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                界面语言
              </label>
              <select v-model="viewModel.uiSettings.value.language" class="setting-select">
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                动画效果
              </label>
              <select v-model="viewModel.uiSettings.value.animations" class="setting-select">
                <option value="full">完整动画</option>
                <option value="reduced">减少动画</option>
                <option value="none">禁用动画</option>
              </select>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                快速主题切换
              </label>
              <div class="theme-toggle-group">
                <button 
                  @click="viewModel.setTheme('light')"
                  :class="['theme-btn', { active: viewModel.uiSettings.value.theme === 'light' }]"
                >
                  ☀️ 浅色
                </button>
                <button 
                  @click="viewModel.setTheme('dark')"
                  :class="['theme-btn', { active: viewModel.uiSettings.value.theme === 'dark' }]"
                >
                  🌙 深色
                </button>
                <button 
                  @click="viewModel.setTheme('auto')"
                  :class="['theme-btn', { active: viewModel.uiSettings.value.theme === 'auto' }]"
                >
                  🖥️ 自动
                </button>
              </div>
              <p class="setting-description">快速切换主题色彩</p>
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
                  v-model.number="viewModel.audioSettings.value.masterVolume"
                  type="range"
                  min="0"
                  max="100"
                  class="setting-range"
                />
                <span class="volume-value">{{ viewModel.audioSettings.value.masterVolume }}%</span>
              </div>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                游戏音效
              </label>
              <div class="volume-control">
                <input 
                  v-model.number="viewModel.audioSettings.value.soundEffects"
                  type="range"
                  min="0"
                  max="100"
                  class="setting-range"
                />
                <span class="volume-value">{{ viewModel.audioSettings.value.soundEffects }}%</span>
              </div>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  v-model="viewModel.audioSettings.value.enableSounds"
                  type="checkbox"
                  class="setting-checkbox"
                />
                启用音效
              </label>
              <p class="setting-description">播放拼图放置和完成音效</p>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                音效试听
              </label>
              <div class="audio-test-controls">
                <button 
                  @click="viewModel.playTestSound"
                  :disabled="!viewModel.audioSettings.value.enableSounds"
                  class="audio-test-btn"
                >
                  🔊 试听音效
                </button>
                <button 
                  @click="viewModel.playPiecePlacedSound"
                  :disabled="!viewModel.audioSettings.value.enableSounds"
                  class="audio-test-btn"
                >
                  🎯 拼图音效
                </button>
                <button 
                  @click="viewModel.playPuzzleCompletedSound"
                  :disabled="!viewModel.audioSettings.value.enableSounds"
                  class="audio-test-btn"
                >
                  🎉 完成音效
                </button>
              </div>
              <p class="setting-description">点击按钮试听不同音效（需先启用音效）</p>
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
              <select v-model="viewModel.performanceSettings.value.renderQuality" class="setting-select">
                <option value="high">高质量</option>
                <option value="medium">中等质量</option>
                <option value="low">低质量</option>
              </select>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                最大拼图块数
              </label>
              <select v-model.number="viewModel.performanceSettings.value.maxPieces" class="setting-select">
                <option :value="100">100 块</option>
                <option :value="500">500 块</option>
                <option :value="1000">1000 块</option>
                <option :value="2000">2000 块</option>
              </select>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  v-model="viewModel.performanceSettings.value.enableGPUAcceleration"
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
                  v-model="viewModel.dataSettings.value.autoSave"
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
              <select v-model.number="viewModel.dataSettings.value.saveInterval" class="setting-select">
                <option :value="30">30 秒</option>
                <option :value="60">1 分钟</option>
                <option :value="300">5 分钟</option>
              </select>
            </div>
          </div>
          
          <div class="data-actions">
            <button @click="viewModel.exportData" class="data-btn">
              📤 导出数据
            </button>
            <button @click="viewModel.importData" class="data-btn">
              📥 导入数据
            </button>
            <button @click="viewModel.clearData" class="data-btn danger">
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
              <button @click="viewModel.openGitHub" class="link-btn">
                📱 GitHub
              </button>
              <button @click="viewModel.showLicenses" class="link-btn">
                📄 开源许可
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="settings-footer">
        <button @click="viewModel.resetToDefaults" class="footer-btn">
          🔄 恢复默认
        </button>
        <button @click="viewModel.saveSettings" class="footer-btn primary">
          💾 保存设置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SettingsViewModel } from '@/viewModels/settings/settingsViewModel'

const viewModel = new SettingsViewModel()
</script>

<style scoped>
.settings-view {
  @apply h-screen py-8 overflow-hidden;
  background-color: var(--settings-bg);
  transition: background-color 0.3s ease;
}

.settings-container {
  @apply max-w-4xl mx-auto px-6 h-full flex flex-col;
}

.settings-title {
  @apply text-3xl font-bold text-center mb-8 flex-shrink-0;
  color: var(--settings-text-primary);
}

.settings-content {
  @apply space-y-8 flex-1 overflow-y-auto;
}

.settings-section {
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
  border: 1px solid var(--settings-border);
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.section-title {
  @apply text-xl font-semibold mb-6 pb-2 border-b;
  color: var(--settings-text-primary);
  border-bottom-color: var(--settings-border);
}

.settings-grid {
  @apply space-y-6;
}

.setting-item {
  @apply flex flex-col;
}

.setting-label {
  @apply text-sm font-medium mb-2 flex items-center cursor-pointer;
  color: var(--settings-text-primary);
}

.setting-checkbox {
  @apply mr-2;
}

.setting-select, .setting-range {
  @apply w-full max-w-xs;
}

.setting-select {
  @apply w-full max-w-xs px-3 py-2 border rounded-md;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
  border-color: var(--settings-border);
}

.setting-select:focus {
  border-color: var(--settings-accent);
}

.setting-select option {
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
}

.setting-range {
  @apply w-full max-w-xs appearance-none h-2 rounded-lg cursor-pointer;
  background-color: var(--settings-border);
}

.setting-description {
  @apply text-xs mt-1;
  color: var(--settings-text-secondary);
}

.volume-control {
  @apply flex items-center space-x-3;
}

.volume-value {
  @apply text-sm min-w-12;
  color: var(--settings-text-secondary);
}

.data-actions {
  @apply flex flex-wrap gap-3 mt-6 pt-6 border-t flex-shrink-0;
  border-top-color: var(--settings-border);
}

.data-btn {
  @apply px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
}

.data-btn:hover {
  background-color: var(--settings-border);
}

.data-btn.danger {
  @apply bg-red-500 text-white hover:bg-red-600;
}

.about-info {
  @apply flex flex-col md:flex-row justify-between items-start md:items-center;
}

.app-info h3 {
  @apply text-lg font-semibold mb-2;
  color: var(--settings-text-primary);
}

.app-info p {
  @apply text-sm mb-1;
  color: var(--settings-text-secondary);
}

.about-links {
  @apply flex space-x-3 mt-4 md:mt-0;
}

.link-btn {
  @apply px-3 py-1 text-sm rounded;
  background-color: var(--settings-accent);
  color: #ffffff;
}

.link-btn:hover {
  background-color: var(--settings-accent-hover);
}

.theme-toggle-group {
  @apply flex space-x-2;
}

.theme-btn {
  @apply px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
}

.theme-btn:hover {
  background-color: var(--settings-border);
}

.theme-btn.active {
  background-color: var(--settings-accent);
  color: #ffffff;
}

.theme-btn.active:hover {
  background-color: var(--settings-accent-hover);
}

.settings-footer {
  @apply flex justify-end space-x-3 mt-8 pt-6 border-t flex-shrink-0;
  border-top-color: var(--settings-border);
}

.footer-btn {
  @apply px-6 py-2 text-sm font-medium rounded-md transition-colors duration-200;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
}

.footer-btn:hover {
  background-color: var(--settings-border);
}

.footer-btn.primary {
  background-color: var(--settings-accent);
  color: #ffffff;
}

.footer-btn.primary:hover {
  background-color: var(--settings-accent-hover);
}

/* 音效试听按钮样式 */
.audio-test-controls {
  @apply flex flex-wrap gap-2 mt-2;
}

.audio-test-btn {
  @apply px-3 py-1 text-xs font-medium rounded transition-colors duration-200;
  background-color: var(--settings-accent);
  color: white;
  border: none;
  min-width: 80px;
}

.audio-test-btn:hover:not(:disabled) {
  background-color: var(--settings-accent-hover, #2563eb);
  transform: translateY(-1px);
}

.audio-test-btn:disabled {
  background-color: var(--settings-border);
  color: var(--settings-text-secondary);
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.audio-test-btn:active:not(:disabled) {
  transform: translateY(0);
}

</style>
