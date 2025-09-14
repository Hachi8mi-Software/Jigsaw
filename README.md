# 🧩 拼图乐 (Puzzle Fun)

> 一款基于 Tauri + Vue 3 开发的跨平台拼图应用，集游戏与编辑器于一体

[![在线体验](https://img.shields.io/badge/在线体验-访问应用-blue?style=for-the-badge&logo=github)](https://hachi8mi-software.github.io/Jigsaw/)
[![技术栈](https://img.shields.io/badge/技术栈-Tauri%20%2B%20Vue%203-green?style=for-the-badge&logo=vue.js)](https://tauri.app/)
[![许可证](https://img.shields.io/badge/许可证-MIT-yellow?style=for-the-badge)](LICENSE)

## 📖 项目简介

拼图乐是一款现代化的跨平台拼图应用，采用 Tauri + Vue 3 技术栈开发。应用包含两大核心模块：

- **🎮 拼图游戏**：提供丰富的内置图库和多样化的难度挑战
- **✏️ 拼图编辑器**：独创的边界编辑系统，允许用户通过操纵拼图块边界来创建独特的拼图切割方案

### ✨ 主要特性

- 🖥️ **跨平台支持**：Windows、macOS、Linux 桌面端 + 移动端适配
- 🎨 **现代化UI**：响应式设计，支持深色/浅色主题切换
- 🧩 **智能拼图**：支持 9-1000+ 块拼图，多种难度级别
- ✂️ **自定义编辑器**：程序化拼图切割，创造独特形状
- 🏆 **成就系统**：丰富的成就和排行榜功能
- 🔊 **音效支持**：背景音乐和音效，可自定义音量
- 💾 **进度保存**：自动保存游戏进度，支持断点续玩
- 📱 **移动端优化**：触摸操作优化，适配各种屏幕尺寸

## 🌐 在线访问

### 直接访问
点击上方徽章或访问：**[https://hachi8mi-software.github.io/Jigsaw/](https://hachi8mi-software.github.io/Jigsaw/)**

### 功能说明
- ✅ 完整的拼图游戏体验
- ✅ 内置素材库浏览
- ✅ 拼图编辑器功能
- ✅ 成就和排行榜系统
- ✅ 设置和主题切换
- ⚠️ 部分高级功能需要桌面端支持

## 🚀 本地运行

### 环境要求

- **Node.js**: 18.0+ 
- **pnpm**: 10.0+ (推荐) 或 npm 9.0+
- **Rust**: 1.70+ (用于 Tauri 桌面端)
- **系统依赖**：
  - Windows: Microsoft Visual Studio C++ Build Tools
  - macOS: Xcode Command Line Tools
  - Linux: `libwebkit2gtk-4.0-dev` 等依赖

### 快速开始

1. **克隆项目**
   ```bash
   git clone https://github.com/hachi8mi-software/Jigsaw.git
   cd Jigsaw
   ```

2. **安装依赖**
   ```bash
   # 使用 pnpm (推荐)
   pnpm install
   
   # 或使用 npm
   npm install
   ```

3. **启动开发服务器**
   ```bash
   # Web 端开发
   pnpm dev
   
   # 桌面端开发 (需要 Rust 环境)
   pnpm tauri dev
   ```

4. **访问应用**
   - Web 端：http://localhost:5173
   - 桌面端：自动启动 Tauri 应用窗口

### 构建部署

#### Web 端构建
```bash
# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

#### 桌面端构建
```bash
# 构建桌面应用
pnpm tauri build
```

构建完成后，可执行文件位于 `src-tauri/target/release/` 目录。

## 📁 项目结构

```
Jigsaw/
├── src/                          # 前端源码
│   ├── components/              # Vue 组件
│   │   ├── PuzzleBoard.vue      # 拼图游戏板
│   │   ├── PuzzlePieceCanvas.vue # 拼图块画布
│   │   ├── SvgBoundary.vue      # SVG 边界组件
│   │   └── ...
│   ├── views/                   # 页面视图
│   │   ├── HomeView.vue         # 主页
│   │   ├── GameView.vue         # 游戏页面
│   │   ├── EditorView.vue       # 编辑器页面
│   │   └── ...
│   ├── stores/                  # Pinia 状态管理
│   │   ├── game.ts              # 游戏状态
│   │   ├── editor.ts            # 编辑器状态
│   │   └── ...
│   ├── services/                # 业务服务
│   │   ├── GameStateManager.ts  # 游戏状态管理
│   │   ├── PieceManager.ts      # 拼图块管理
│   │   └── ...
│   ├── utils/                   # 工具函数
│   │   ├── svgUtils.ts          # SVG 工具
│   │   ├── puzzleUtils.ts       # 拼图工具
│   │   └── ...
│   └── types/                   # TypeScript 类型定义
├── src-tauri/                   # Tauri 后端
│   ├── src/                     # Rust 源码
│   ├── Cargo.toml               # Rust 依赖配置
│   └── tauri.conf.json          # Tauri 配置
├── public/                      # 静态资源
├── dist/                        # 构建输出
└── docs/                        # 项目文档
```

## 🛠️ 技术栈

### 前端技术
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript
- **Pinia** - Vue 状态管理
- **Vue Router** - 路由管理
- **Element Plus** - UI 组件库
- **Tailwind CSS** - 原子化 CSS 框架

### 后端技术
- **Tauri** - 跨平台桌面应用框架
- **Rust** - 系统级编程语言

### 开发工具
- **Vite** - 构建工具
- **Vitest** - 测试框架
- **ESLint** - 代码检查
- **Prettier** - 代码格式化

## 🎮 使用指南

### 开始游戏
1. 访问 **素材库** 选择喜欢的图片
2. 设置拼图难度（块数、形状等）
3. 开始拼图挑战！

### 创建自定义拼图
1. 进入 **编辑器** 页面
2. 上传本地图片
3. 设置网格大小
4. 点击网格线切换边界形状（平直/外凸/内凹）
5. 保存并分享你的创作

### 移动端使用
- 支持触摸拖拽操作
- 响应式界面适配
- 优化的移动端导航

## 🧪 测试

```bash
# 运行测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:run

# 启动测试 UI
pnpm test:ui
```

## 📝 开发说明

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 Vue 3 Composition API 最佳实践
- 采用 ESLint + Prettier 代码格式化

### 提交规范
- feat: 新功能
- fix: 修复问题
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建/工具相关

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Tauri](https://tauri.app/) - 跨平台桌面应用框架
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Element Plus](https://element-plus.org/) - Vue 3 UI 组件库
- [Tailwind CSS](https://tailwindcss.com/) - 原子化 CSS 框架

## 📞 联系方式

- 项目链接：[https://github.com/hachi8mi-software/Jigsaw](https://github.com/hachi8mi-software/Jigsaw)
- 在线体验：[https://hachi8mi-software.github.io/Jigsaw/](https://hachi8mi-software.github.io/Jigsaw/)

---

⭐ 如果这个项目对你有帮助，请给它一个星标！