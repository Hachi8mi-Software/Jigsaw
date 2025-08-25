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
