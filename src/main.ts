/**
 * 拼图乐应用主入口
 * 配置Vue应用、路由、状态管理和UI组件库
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 导入样式
import './assets/style.css'

import App from './App.vue'
import router from './router'

// 创建Vue应用实例
const app = createApp(App)

// 配置Pinia状态管理
const pinia = createPinia()
app.use(pinia)

// 配置Vue Router
app.use(router)

// 配置Element Plus UI组件库
app.use(ElementPlus)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 挂载应用
app.mount('#app')

// 初始化应用数据和OPFS迁移
async function initializeApp() {
  try {
    // 动态导入store避免循环依赖
    const { useLibraryStore } = await import('./stores/library')
    const { useEditorStore } = await import('./stores/editor')
    
    const libraryStore = useLibraryStore()
    const editorStore = useEditorStore()
    
    // 初始化库数据
    await libraryStore.initializeLibrary()
    
    // 执行OPFS迁移（如果需要）
    console.log('🔄 检查OPFS迁移...')
    const migrationCount = await libraryStore.migrateToOPFS()
    if (migrationCount > 0) {
      console.log(`✅ 成功迁移 ${migrationCount} 个图片到OPFS`)
    } else {
      console.log('✅ 无需迁移或迁移已完成')
    }
    
    console.log('🚀 应用初始化完成')
  } catch (error) {
    console.error('❌ 应用初始化失败:', error)
  }
}

// 延迟执行初始化，确保DOM已经挂载
setTimeout(initializeApp, 100)
