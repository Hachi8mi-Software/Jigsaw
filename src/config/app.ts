/**
 * 应用配置文件
 * 统一管理应用的基础配置
 */

/**
 * 应用基础路径配置
 * 这是唯一需要修改 BASEURL 的地方
 */
export const APP_CONFIG = {
  // 应用的基础路径，用于路由和静态资源
  BASE_URL: '/',
  
  // 应用名称
  APP_NAME: '拼图乐',
  
  // 应用副标题
  APP_SUBTITLE: 'Puzzle Fun'
} as const

/**
 * 获取图片资源的完整路径
 * @param imageName 图片文件名
 * @returns 完整的图片URL路径
 */
export function getImagePath(imageName: string): string {
  return `${APP_CONFIG.BASE_URL}images/${imageName}`
}

/**
 * 获取应用标题
 * @param pageTitle 页面标题
 * @returns 完整的页面标题
 */
export function getPageTitle(pageTitle?: string): string {
  if (pageTitle) {
    return `${pageTitle} - ${APP_CONFIG.APP_NAME}`
  }
  return `${APP_CONFIG.APP_NAME} - ${APP_CONFIG.APP_SUBTITLE}`
}
