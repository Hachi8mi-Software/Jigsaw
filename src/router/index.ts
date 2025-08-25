/**
 * Vue Router 配置
 * 拼图应用路由管理
 */

import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 路由组件懒加载
const LibraryView = () => import('../views/LibraryView.vue')
const EditorView = () => import('../views/EditorView.vue')
const GameView = () => import('../views/GameView.vue')
const SettingsView = () => import('../views/SettingsView.vue')
const AchievementsView = () => import('../views/AchievementsView.vue')

/**
 * 路由配置
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    redirect: '/library'
  },
  {
    path: '/library',
    name: 'Library',
    component: LibraryView,
    meta: {
      title: '素材库',
      description: '浏览和管理拼图素材'
    }
  },
  {
    path: '/editor',
    name: 'Editor',
    component: EditorView,
    meta: {
      title: '拼图编辑器',
      description: '创建自定义拼图'
    }
  },
  {
    path: '/game/:puzzleId?',
    name: 'Game',
    component: GameView,
    props: true,
    meta: {
      title: '拼图游戏',
      description: '开始拼图挑战'
    }
  },
  {
    path: '/achievements',
    name: 'Achievements',
    component: AchievementsView,
    meta: {
      title: '成就',
      description: '查看解锁的成就'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsView,
    meta: {
      title: '设置',
      description: '应用设置和偏好'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue'),
    meta: {
      title: '页面未找到'
    }
  }
]

/**
 * 创建路由实例
 */
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

/**
 * 路由守卫
 */
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 拼图乐`
  } else {
    document.title = '拼图乐 - Puzzle Fun'
  }
  
  next()
})

router.afterEach((to) => {
  // 路由切换后的处理
  console.log(`导航到: ${to.name as string}`)
})

export default router
