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
                游戏难度
              </label>
              <div class="difficulty-buttons">
                <button 
                  @click="viewModel.difficulty.value = 'easy'"
                  :class="['difficulty-btn', { active: viewModel.difficulty.value === 'easy' }]"
                >
                  <span class="btn-icon">🟢</span>
                  <span class="btn-text">简单难度</span>
                </button>
                <button 
                  @click="viewModel.difficulty.value = 'medium'"
                  :class="['difficulty-btn', { active: viewModel.difficulty.value === 'medium' }]"
                >
                  <span class="btn-icon">🟡</span>
                  <span class="btn-text">中等难度</span>
                </button>
                <button 
                  @click="viewModel.difficulty.value = 'hard'"
                  :class="['difficulty-btn', { active: viewModel.difficulty.value === 'hard' }]"
                >
                  <span class="btn-icon">🔴</span>
                  <span class="btn-text">困难难度</span>
                </button>
              </div>
              <div class="difficulty-description">
                <p v-if="viewModel.difficulty.value === 'easy'" class="description-text">
                  <span class="description-icon">💡</span>
                  显示数字提示，拼图块不可旋转，适合新手玩家
                </p>
                <p v-else-if="viewModel.difficulty.value === 'medium'" class="description-text">
                  <span class="description-icon">⚖️</span>
                  不显示数字提示，拼图块不可旋转，平衡的挑战难度
                </p>
                <p v-else-if="viewModel.difficulty.value === 'hard'" class="description-text">
                  <span class="description-icon">🔥</span>
                  不显示数字提示，拼图块可旋转，最具挑战性的难度
                </p>
              </div>
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
              <select v-model="viewModel.uiSettings.value.theme" class="setting-select ark">
                <option value="light">浅色主题</option>
                <option value="dark">深色主题</option>
                <option value="auto">跟随系统</option>
              </select>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                界面语言
              </label>
              <select v-model="viewModel.uiSettings.value.language" class="setting-select ark">
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                动画效果
              </label>
              <select v-model="viewModel.uiSettings.value.animations" class="setting-select ark">
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
            <!-- 主音量控制 -->
            <div class="setting-item">
              <label class="setting-label">
                主音量
              </label>
              <div class="volume-control">
                <input 
                  v-model.number="viewModel.audioSettings.value.masterVolume"
                  @change="handleMasterVolumeChange"
                  type="range"
                  min="0"
                  max="100"
                  class="setting-range"
                />
                <span class="volume-value">{{ viewModel.audioSettings.value.masterVolume }}%</span>
              </div>
              <p class="setting-description">控制所有音频的总音量</p>
            </div>
            
            <!-- 音效控制组 -->
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  v-model="viewModel.audioSettings.value.enableSounds"
                  @change="handleEnableSoundsChange"
                  type="checkbox"
                  class="setting-checkbox"
                />
                启用音效
              </label>
              <p class="setting-description">播放拼图放置和完成音效</p>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                游戏音效音量
              </label>
              <div class="volume-control">
                <input 
                  v-model.number="viewModel.audioSettings.value.soundEffects"
                  @change="handleSoundEffectsChange"
                  type="range"
                  min="0"
                  max="100"
                  class="setting-range"
                />
                <span class="volume-value">{{ viewModel.audioSettings.value.soundEffects }}%</span>
              </div>
              <p class="setting-description">调节游戏音效的音量</p>
            </div>

            <!-- 背景音乐控制组 -->
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  v-model="viewModel.audioSettings.value.enableBackgroundMusic"
                  @change="handleBackgroundMusicToggle"
                  type="checkbox"
                  class="setting-checkbox"
                />
                启用背景音乐
              </label>
              <p class="setting-description">循环播放背景音乐</p>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                背景音乐音量
              </label>
              <div class="volume-control">
                <input 
                  v-model.number="viewModel.audioSettings.value.backgroundMusicVolume"
                  @change="handleBackgroundMusicVolumeChange"
                  type="range"
                  min="0"
                  max="100"
                  class="setting-range"
                />
                <span class="volume-value">{{ viewModel.audioSettings.value.backgroundMusicVolume }}%</span>
              </div>
              <p class="setting-description">调节背景音乐的音量</p>
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
              <select v-model="viewModel.performanceSettings.value.renderQuality" class="setting-select ark">
                <option value="high">高质量</option>
                <option value="medium">中等质量</option>
                <option value="low">低质量</option>
              </select>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                最大拼图块数
              </label>
              <select v-model.number="viewModel.performanceSettings.value.maxPieces" class="setting-select ark">
                <option :value="100">100 块</option>
                <option :value="500">500 块</option>
                <option :value="1000">1000 块</option>
                <option :value="2000">2000 块</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 存档管理 -->
        <div class="settings-section">
          <h2 class="section-title">💾 存档管理</h2>
          
          <!-- 当前存档信息 -->
          <div class="current-save-info">
            <div class="current-save-header">
              <h3>当前存档</h3>
              <span class="current-save-name">{{ viewModel.currentSlot.value?.name || '默认存档' }}</span>
            </div>
            <div class="current-save-stats">
              <div class="stat-item">
                <span class="stat-label">游戏次数:</span>
                <span class="stat-value">{{ viewModel.currentSlot.value?.totalGamesPlayed || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">游戏时长:</span>
                <span class="stat-value">{{ formatTime(viewModel.currentSlot.value?.totalTimeSpent || 0) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">解锁成就:</span>
                <span class="stat-value">{{ viewModel.currentSlot.value?.achievementsUnlocked || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">自定义拼图:</span>
                <span class="stat-value">{{ viewModel.currentSlot.value?.customPuzzlesCount || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- 存档槽位列表 -->
          <div class="save-slots-container">
            <div class="save-slots-header">
              <h3>存档槽位 ({{ viewModel.saveSlots.value.length }}/10)</h3>
              <button @click="showCreateSlotModal = true" class="create-slot-btn" :disabled="viewModel.saveSlots.value.length >= 10">
                ➕ 新建存档
              </button>
            </div>
            
            <div class="save-slots-list">
              <div 
                v-for="slot in viewModel.saveSlots.value" 
                :key="slot.id"
                class="save-slot-item"
                :class="{ active: slot.id === viewModel.currentSlotId.value }"
              >
                <div class="slot-info">
                  <div class="slot-name">{{ slot.name }}</div>
                  <div class="slot-meta">
                    <span class="slot-games">{{ slot.totalGamesPlayed }} 局</span>
                    <span class="slot-time">{{ formatTime(slot.totalTimeSpent) }}</span>
                    <span class="slot-date">{{ formatDate(slot.lastPlayedAt) }}</span>
                  </div>
                </div>
                
                <div class="slot-actions">
                  <button 
                    v-if="slot.id !== viewModel.currentSlotId.value"
                    @click="viewModel.switchToSlot(slot.id)"
                    class="slot-action-btn switch"
                  >
                    🔄 切换
                  </button>
                  <button 
                    @click="openRenameSlotModal(slot)"
                    class="slot-action-btn rename"
                  >
                    ✏️ 重命名
                  </button>
                  <button 
                    @click="openCopySlotModal(slot)"
                    class="slot-action-btn copy"
                  >
                    📋 复制
                  </button>
                  <button 
                    @click="viewModel.exportSlotData(slot.id)"
                    class="slot-action-btn export"
                  >
                    📤 导出
                  </button>
                  <button 
                    v-if="slot.id !== 'default'"
                    @click="viewModel.deleteSlot(slot.id)"
                    class="slot-action-btn delete"
                  >
                    🗑️ 删除
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 存档导入 -->
          <div class="save-import-section">
            <button @click="viewModel.importSlotData" class="import-save-btn">
              📥 导入存档文件
            </button>
            <p class="import-description">从导出的存档文件中恢复游戏数据</p>
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
      </div>
    </div>

    <!-- 创建存档模态框 -->
    <div v-if="showCreateSlotModal" class="modal-overlay" @click="showCreateSlotModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>创建新存档</h3>
          <button @click="showCreateSlotModal = false" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">存档名称</label>
            <input 
              v-model="newSlotName" 
              type="text" 
              class="form-input" 
              placeholder="请输入存档名称"
              maxlength="20"
              @keyup.enter="createNewSlot"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showCreateSlotModal = false" class="modal-btn cancel">取消</button>
          <button @click="createNewSlot" class="modal-btn confirm" :disabled="!newSlotName.trim()">创建</button>
        </div>
      </div>
    </div>

    <!-- 重命名存档模态框 -->
    <div v-if="showRenameSlotModal" class="modal-overlay" @click="showRenameSlotModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>重命名存档</h3>
          <button @click="showRenameSlotModal = false" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">存档名称</label>
            <input 
              v-model="renameSlotName" 
              type="text" 
              class="form-input" 
              placeholder="请输入新名称"
              maxlength="20"
              @keyup.enter="renameSlot"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showRenameSlotModal = false" class="modal-btn cancel">取消</button>
          <button @click="renameSlot" class="modal-btn confirm" :disabled="!renameSlotName.trim()">重命名</button>
        </div>
      </div>
    </div>

    <!-- 复制存档模态框 -->
    <div v-if="showCopySlotModal" class="modal-overlay" @click="showCopySlotModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>复制存档</h3>
          <button @click="showCopySlotModal = false" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">新存档名称</label>
            <input 
              v-model="copySlotName" 
              type="text" 
              class="form-input" 
              placeholder="请输入新存档名称"
              maxlength="20"
              @keyup.enter="copySlot"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showCopySlotModal = false" class="modal-btn cancel">取消</button>
          <button @click="copySlot" class="modal-btn confirm" :disabled="!copySlotName.trim()">复制</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { SettingsViewModel } from '@/viewModels/settings/settingsViewModel'
import type { SaveSlot } from '@/services/SaveManager'
import { audioUtils } from '@/utils/audioUtils'

const viewModel = new SettingsViewModel()

// 模态框状态
const showCreateSlotModal = ref(false)
const showRenameSlotModal = ref(false)
const showCopySlotModal = ref(false)

// 表单数据
const newSlotName = ref('')
const renameSlotName = ref('')
const copySlotName = ref('')
const currentSlot = ref<SaveSlot | null>(null)

// 方法
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString))
}

const createNewSlot = async () => {
  if (await viewModel.createNewSlot(newSlotName.value)) {
    showCreateSlotModal.value = false
    newSlotName.value = ''
  }
}

const openRenameSlotModal = (slot: SaveSlot) => {
  currentSlot.value = slot
  renameSlotName.value = slot.name
  showRenameSlotModal.value = true
}

const renameSlot = async () => {
  if (currentSlot.value && await viewModel.renameSlot(currentSlot.value.id, renameSlotName.value)) {
    showRenameSlotModal.value = false
    currentSlot.value = null
    renameSlotName.value = ''
  }
}

const openCopySlotModal = (slot: SaveSlot) => {
  currentSlot.value = slot
  copySlotName.value = `${slot.name} 副本`
  showCopySlotModal.value = true
}

const copySlot = async () => {
  if (currentSlot.value && await viewModel.copySlot(currentSlot.value.id, copySlotName.value)) {
    showCopySlotModal.value = false
    currentSlot.value = null
    copySlotName.value = ''
  }
}

// 处理背景音乐开关变化
const handleBackgroundMusicToggle = () => {
  console.log('设置页面检测到背景音乐开关变化:', viewModel.audioSettings.value.enableBackgroundMusic)
  // 直接调用音频工具类更新
  audioUtils.setBackgroundMusicEnabled(viewModel.audioSettings.value.enableBackgroundMusic)
}

// 处理主音量变化
const handleMasterVolumeChange = () => {
  console.log('设置页面检测到主音量变化:', viewModel.audioSettings.value.masterVolume)
  audioUtils.setMasterVolume(viewModel.audioSettings.value.masterVolume)
}

// 处理音效音量变化
const handleSoundEffectsChange = () => {
  console.log('设置页面检测到音效音量变化:', viewModel.audioSettings.value.soundEffects)
  audioUtils.setSoundEffectsVolume(viewModel.audioSettings.value.soundEffects)
}

// 处理背景音乐音量变化
const handleBackgroundMusicVolumeChange = () => {
  console.log('设置页面检测到背景音乐音量变化:', viewModel.audioSettings.value.backgroundMusicVolume)
  audioUtils.setBackgroundMusicVolume(viewModel.audioSettings.value.backgroundMusicVolume)
}

// 处理音效开关变化
const handleEnableSoundsChange = () => {
  console.log('设置页面检测到音效开关变化:', viewModel.audioSettings.value.enableSounds)
  audioUtils.setEnabled(viewModel.audioSettings.value.enableSounds)
}
</script>

<style scoped>
.settings-view {
  @apply h-screen py-8 overflow-hidden;
  background-color: var(--settings-bg);
  transition: background-color 0.3s ease;
}

/* 移动端适配：为固定头部栏预留空间 */
@media (max-width: 767px) {
  .settings-view {
    height: calc(100vh - 60px);
  }
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
  @apply w-full;
  color: var(--settings-text-primary);
}

.setting-select option {
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
}

.setting-range {
  @apply w-full max-w-xs appearance-none cursor-pointer;
  height: 6px;
  background-color: var(--settings-border);
  border-radius: 3px;
  outline: none;
}

/* 滑块轨道样式 */
.setting-range::-webkit-slider-track {
  height: 6px;
  background-color: var(--settings-border);
  border-radius: 3px;
  border: none;
}

.setting-range::-moz-range-track {
  height: 6px;
  background-color: var(--settings-border);
  border-radius: 3px;
  border: none;
}

/* 滑块按钮样式 */
.setting-range::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  background-color: var(--settings-accent);
  border-radius: 50%;
  border: 2px solid var(--settings-card-bg);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.setting-range::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.setting-range::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background-color: var(--settings-accent);
  border-radius: 50%;
  border: 2px solid var(--settings-card-bg);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.setting-range::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

/* 移动端优化 */
@media (max-width: 767px) {
  .setting-range {
    height: 4px;
    border-radius: 2px;
  }
  
  .setting-range::-webkit-slider-track {
    height: 4px;
    border-radius: 2px;
  }
  
  .setting-range::-moz-range-track {
    height: 4px;
    border-radius: 2px;
  }
  
  .setting-range::-webkit-slider-thumb {
    width: 16px;
    height: 16px;
    border-width: 1px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }
  
  .setting-range::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-width: 1px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }
  
  .setting-range::-webkit-slider-thumb:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
  
  .setting-range::-moz-range-thumb:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
  
  /* 移动端触摸优化 */
  .setting-range::-webkit-slider-thumb:active {
    transform: scale(1.1);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
  }
  
  .setting-range::-moz-range-thumb:active {
    transform: scale(1.1);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
  }
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
  color: #1f2937;
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
  color: #1f2937;
}

.theme-btn.active {
  background-color: var(--settings-accent);
  color: #1f2937;
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
  color: #1f2937;
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
  color: #1f2937;
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

/* 存档管理样式 */
.current-save-info {
  @apply mb-6 p-4 rounded-lg border;
  background-color: var(--settings-hover);
  border-color: var(--settings-border);
}

.current-save-header {
  @apply flex items-center justify-between mb-3;
}

.current-save-header h3 {
  @apply text-lg font-semibold;
  color: var(--settings-text-primary);
}

.current-save-name {
  @apply text-sm px-2 py-1 rounded;
  background-color: var(--settings-accent);
  color: #1f2937;
}

.current-save-stats {
  @apply grid grid-cols-2 md:grid-cols-4 gap-3;
}

/* 移动端存档统计优化 */
@media (max-width: 767px) {
  .current-save-stats {
    @apply grid-cols-2 gap-2;
  }
  
  .stat-item {
    @apply p-2;
  }
  
  .stat-label {
    @apply text-xs;
  }
  
  .stat-value {
    @apply text-sm;
  }
}

.stat-item {
  @apply flex flex-col items-center p-2 rounded;
  background-color: var(--settings-card-bg);
}

.stat-label {
  @apply text-xs mb-1;
  color: var(--settings-text-secondary);
}

.stat-value {
  @apply text-sm font-semibold;
  color: var(--settings-text-primary);
}

.save-slots-container {
  @apply mb-6;
}

.save-slots-header {
  @apply flex items-center justify-between mb-4;
}

/* 移动端存档槽头部优化 */
@media (max-width: 767px) {
  .save-slots-header {
    @apply flex-col items-stretch gap-3;
  }
  
  .save-slots-header h3 {
    @apply text-base text-center;
  }
  
  .create-slot-btn {
    @apply w-full py-2;
  }
}

.save-slots-header h3 {
  @apply text-lg font-semibold;
  color: var(--settings-text-primary);
}

.create-slot-btn {
  @apply px-3 py-1 text-sm font-medium rounded transition-colors duration-200;
  background-color: var(--settings-accent);
  color: #1f2937;
}

.create-slot-btn:hover:not(:disabled) {
  background-color: var(--settings-accent-hover);
}

.create-slot-btn:disabled {
  background-color: var(--settings-border);
  color: var(--settings-text-secondary);
  opacity: 0.6;
  cursor: not-allowed;
}

.save-slots-list {
  @apply space-y-3;
}

.save-slot-item {
  @apply flex items-center justify-between p-4 rounded-lg border transition-all duration-200;
  background-color: var(--settings-hover);
  border-color: var(--settings-border);
}

/* 移动端存档槽优化 */
@media (max-width: 767px) {
  .save-slot-item {
    @apply flex-col items-stretch p-3;
  }
  
  .slot-info {
    @apply mb-2;
  }
  
  .slot-name {
    @apply text-sm mb-1;
  }
  
  .slot-meta {
    @apply flex space-x-2 text-xs;
  }
  
  .slot-actions {
    @apply flex-wrap gap-2;
  }
  
  .slot-action-btn {
    @apply flex-1 min-w-0 text-xs px-2 py-2;
  }
}

.save-slot-item.active {
  background-color: var(--settings-accent);
  border-color: var(--settings-accent);
  color: #1f2937;
}

.save-slot-item:hover {
  background-color: var(--settings-border);
}

.slot-info {
  @apply flex-1;
}

.slot-name {
  @apply text-base font-semibold mb-1;
  color: var(--settings-text-primary);
}

.save-slot-item.active .slot-name {
  color: #1f2937;
}

.slot-meta {
  @apply flex space-x-3 text-xs;
  color: var(--settings-text-secondary);
}

.save-slot-item.active .slot-meta {
  color: #374151;
}

.slot-actions {
  @apply flex space-x-2;
}

.slot-action-btn {
  @apply px-2 py-1 text-xs font-medium rounded transition-colors duration-200;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
  border: 1px solid var(--settings-border);
}

.slot-action-btn:hover {
  background-color: var(--settings-border);
}

.slot-action-btn.switch {
  background-color: #10b981;
  color: white;
  border-color: #10b981;
}

.slot-action-btn.switch:hover {
  background-color: #059669;
}

.slot-action-btn.delete {
  background-color: #ef4444;
  color: white;
  border-color: #ef4444;
}

.slot-action-btn.delete:hover {
  background-color: #dc2626;
}

.save-import-section {
  @apply text-center p-4 rounded-lg border;
  background-color: var(--settings-hover);
  border-color: var(--settings-border);
}

/* 移动端导入存档优化 */
@media (max-width: 767px) {
  .save-import-section {
    @apply p-3;
  }
  
  .import-save-btn {
    @apply w-full py-2 text-sm;
  }
}

.import-save-btn {
  @apply px-4 py-2 text-sm font-medium rounded transition-colors duration-200 mb-2;
  background-color: var(--settings-accent);
  color: #1f2937;
}

.import-save-btn:hover {
  background-color: var(--settings-accent-hover);
}

.import-description {
  @apply text-xs;
  color: var(--settings-text-secondary);
}

/* 模态框样式 */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-lg shadow-xl max-w-md w-full mx-4;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
}

.modal-header {
  @apply flex items-center justify-between p-4 border-b;
  border-bottom-color: var(--settings-border);
}

.modal-header h3 {
  @apply text-lg font-semibold;
  color: var(--settings-text-primary);
}

.modal-close {
  @apply text-xl font-bold hover:opacity-70 transition-opacity duration-200;
  color: var(--settings-text-secondary);
}

.modal-body {
  @apply p-4;
}

.form-group {
  @apply mb-4;
}

.form-label {
  @apply block text-sm font-medium mb-2;
  color: var(--settings-text-primary);
}

.form-input {
  @apply w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
  background-color: var(--settings-card-bg);
  color: var(--settings-text-primary);
  border-color: var(--settings-border);
}

.form-input:focus {
  border-color: var(--settings-accent);
}

.modal-footer {
  @apply flex justify-end space-x-3 p-4 border-t;
  border-top-color: var(--settings-border);
}

.modal-btn {
  @apply px-4 py-2 text-sm font-medium rounded transition-colors duration-200;
}

.modal-btn.cancel {
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
}

.modal-btn.cancel:hover {
  background-color: var(--settings-border);
}

.modal-btn.confirm {
  background-color: var(--settings-accent);
  color: #1f2937;
}

.modal-btn.confirm:hover:not(:disabled) {
  background-color: var(--settings-accent-hover);
}

.modal-btn.confirm:disabled {
  background-color: var(--settings-border);
  color: var(--settings-text-secondary);
  opacity: 0.6;
  cursor: not-allowed;
}

/* 难度选择按钮样式 */
.difficulty-buttons {
  @apply flex gap-3 mb-4;
}

.difficulty-btn {
  @apply flex-1 flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-200;
  @apply border-2 border-transparent;
  background-color: var(--settings-hover);
  color: var(--settings-text-primary);
  border-color: var(--settings-border);
  cursor: pointer;
  min-height: 60px;
}

.difficulty-btn:hover {
  background-color: var(--settings-border);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.difficulty-btn.active {
  background-color: var(--settings-accent);
  color: #1f2937;
  border-color: var(--settings-accent);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.difficulty-btn.active:hover {
  background-color: var(--settings-accent-hover);
  transform: translateY(-2px);
}

.btn-icon {
  @apply text-xl mr-2;
}

.btn-text {
  @apply text-sm font-semibold;
}

/* 难度描述样式 */
.difficulty-description {
  @apply p-3 rounded-lg;
  background-color: var(--settings-hover);
  border: 1px solid var(--settings-border);
}

.description-text {
  @apply flex items-center text-sm leading-relaxed;
  color: var(--settings-text-primary);
  margin: 0;
}

.description-icon {
  @apply text-lg mr-2 flex-shrink-0;
}

/* 移动端难度按钮优化 */
@media (max-width: 767px) {
  .difficulty-buttons {
    @apply flex-col gap-2;
  }
  
  .difficulty-btn {
    @apply flex-row px-3 py-2 min-h-0;
  }
  
  .btn-icon {
    @apply text-lg mr-2;
  }
  
  .btn-text {
    @apply text-xs;
  }
  
  .difficulty-description {
    @apply p-2;
  }
  
  .description-text {
    @apply text-xs;
  }
  
  .description-icon {
    @apply text-base mr-2;
  }
}

</style>
