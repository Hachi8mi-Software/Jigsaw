# 项目数据结构文档

## 概述

这是一个基于Vue 3 + TypeScript + Tauri构建的拼图游戏应用，采用面向对象设计模式和MVVM架构。本文档详细描述了项目的核心数据结构、架构层次和数据流。

## 核心数据结构

### 1. 拼图相关数据结构

#### PuzzleData
完整的拼图数据结构，包含了一个拼图的所有信息：

```typescript
interface PuzzleData {
  id: string;           // 唯一标识符
  name: string;         // 拼图名称
  imageUrl: string;     // 图片URL
  gridConfig: GridConfig; // 网格配置
  boundaries: Boundary[]; // 边界信息
  createdAt: Date;      // 创建时间
  difficulty: number;   // 难度等级
}
```

#### GridConfig
网格配置信息，定义拼图的分割方式：

```typescript
interface GridConfig {
  rows: number;         // 行数
  cols: number;         // 列数
  pieceWidth: number;   // 拼图块宽度
  pieceHeight: number;  // 拼图块高度
}
```

#### PieceStatus
单个拼图块的状态信息：

```typescript
interface PieceStatus {
  originalIndex: number; // 原始索引
  currentX: number;      // 当前X坐标
  currentY: number;      // 当前Y坐标
  isPlaced: boolean;     // 是否已正确放置
  gridRow: number;       // 网格行位置
  gridCol: number;       // 网格列位置
  rotation: number;      // 旋转角度
}
```

#### Boundary
边界信息，用于拼图编辑器：

```typescript
interface Boundary {
  id: string;           // 边界唯一标识
  row: number;          // 所在行
  col: number;          // 所在列
  direction: string;    // 方向（top, bottom, left, right）
  state: BoundaryState; // 边界状态
  startX: number;       // 起始X坐标
  startY: number;       // 起始Y坐标
  endX: number;         // 结束X坐标
  endY: number;         // 结束Y坐标
}
```

### 2. 游戏状态管理

#### GameState
游戏的完整状态信息：

```typescript
interface GameState {
  currentPuzzle: PuzzleData;   // 当前拼图
  pieces: PiecePosition[];     // 拼图块位置信息
  startTime: Date;             // 游戏开始时间
  endTime?: Date;              // 游戏结束时间
  moveCount: number;           // 移动次数
  isCompleted: boolean;        // 是否完成
  elapsedTime: number;         // 已用时间（毫秒）
}
```

#### LibraryItem
素材库中的项目：

```typescript
interface LibraryItem {
  id: string;           // 唯一标识符
  name: string;         // 项目名称
  imageUrl: string;     // 图片URL
  category: string;     // 分类
  tags: string[];       // 标签
  difficulty: number;   // 难度等级
  isBuiltIn: boolean;   // 是否为内置项目
}
```

#### UserStats
用户统计数据：

```typescript
interface UserStats {
  totalGamesPlayed: number;              // 总游戏次数
  totalTimeSpent: number;                // 总游戏时间
  bestTimes: Record<string, number>;     // 最佳成绩记录
  achievements: string[];                // 已获得成就
  totalSuccessMovements: number;         // 成功移动总数
}
```

#### Achievement
成就系统：

```typescript
interface Achievement {
  id: string;                    // 成就ID
  name: string;                  // 成就名称
  description: string;           // 成就描述
  icon: string;                  // 成就图标
  condition: Function;           // 解锁条件
  unlockedAt?: Date;            // 解锁时间
}
```

## 架构层次

### Store层（状态管理）

#### GameStore
负责游戏状态的管理：

```typescript
class GameStore {
  // 状态
  gameState: GameState;
  puzzleBoardPieces: PieceStatus[];
  draggingPieceIndex: number;
  
  // 方法
  startTimer(): void;
  pauseTimer(): void;
  updatePiecePosition(index: number, x: number, y: number): void;
  setPiecePlaced(index: number, placed: boolean): void;
  checkGameCompletion(): boolean;
}
```

#### LibraryStore
管理素材库和用户数据：

```typescript
class LibraryStore {
  // 状态
  items: LibraryItem[];
  categories: string[];
  selectedCategory: string;
  searchKeyword: string;
  userStats: UserStats;
  achievements: Achievement[];
  
  // 方法
  addLibraryItem(item: LibraryItem): void;
  removeLibraryItem(id: string): void;
  checkAchievements(): void;
}
```

#### EditorStore
管理拼图编辑器状态：

```typescript
class EditorStore {
  // 状态
  currentImage: string;
  gridConfig: GridConfig;
  boundaries: Boundary[];
  isPreviewMode: boolean;
  selectedBoundary: string;
  puzzleName: string;
  
  // 方法
  setImage(imageUrl: string): void;
  updateGridConfig(config: GridConfig): void;
  generateBoundaries(): void;
  exportPuzzle(): PuzzleData;
}
```

### ViewModel层（视图模型）

#### PuzzleBoardViewModel
拼图板视图模型，连接视图和业务逻辑：

```typescript
class PuzzleBoardViewModel {
  private puzzleData: PuzzleData;
  private gameController: GameController;
  
  // 计算属性
  get totalPieces(): number;
  get gridRows(): number;
  get gridCols(): number;
  get pieces(): PieceStatus[];
  
  // 方法
  initializePieces(): void;
  shufflePieces(): void;
  startDrag(index: number): void;
  handleDrag(index: number, x: number, y: number): void;
  stopDrag(index: number): void;
}
```

#### GameViewModel
游戏视图模型：

```typescript
class GameViewModel {
  gameController: GameController;
  showCompletionModal: Ref<boolean>;
  showSettingsModal: Ref<boolean>;
  newAchievements: Ref<Achievement[]>;
  
  loadPuzzleFromRoute(): void;
  handleGameCompleted(): void;
  pauseGame(): void;
  resumeGame(): void;
}
```

### Controller层（控制器）

#### GameController
游戏控制器，协调游戏逻辑：

```typescript
class GameController {
  private gameStore: GameStore;
  
  get currentPuzzle(): PuzzleData;
  
  startNewGame(puzzle: PuzzleData): void;
  pauseGame(): void;
  resumeGame(): void;
  restartGame(): void;
  movePiece(index: number, x: number, y: number): void;
  placePiece(index: number, row: number, col: number): boolean;
  checkGameCompletion(): boolean;
}
```

### Manager层（管理器）

#### LibraryManager
素材库管理器，处理数据持久化：

```typescript
class LibraryManager {
  private static readonly STORAGE_KEY: string;
  private static readonly USER_STATS_KEY: string;
  private static readonly ACHIEVEMENTS_KEY: string;
  
  getBuiltInLibrary(): LibraryItem[];
  saveToStorage(items: LibraryItem[]): void;
  loadFromStorage(): LibraryItem[];
  getUserStats(): UserStats;
  saveUserStats(stats: UserStats): void;
  validateImageFile(file: File): boolean;
}
```

#### EditorManager
编辑器管理器，处理拼图生成和验证：

```typescript
class EditorManager {
  validateGridConfig(config: GridConfig): boolean;
  calculateDifficulty(gridConfig: GridConfig): number;
  generatePreviewData(image: string, config: GridConfig): PuzzleData;
  exportPuzzleData(puzzle: PuzzleData): string;
  importPuzzleData(data: string): PuzzleData;
}
```

## 架构特点

### 1. MVVM架构模式
- **View**: Vue组件，负责用户界面展示
- **ViewModel**: 视图模型，连接视图和模型，处理视图逻辑
- **Model**: Store + Manager，负责数据管理和业务逻辑

### 2. 响应式状态管理
- 使用Pinia进行状态管理
- 支持响应式更新，自动同步UI状态
- 集中化的状态管理，便于调试和维护

### 3. 面向对象设计
- Manager类封装业务逻辑，提供清晰的接口
- Controller类协调数据流，分离关注点
- 良好的封装性和可扩展性

### 4. 类型安全
- 完整的TypeScript类型定义
- 编译时类型检查，减少运行时错误
- 良好的IDE支持和代码提示

### 5. 模块化设计
- 清晰的模块边界和职责分离
- 低耦合、高内聚的设计原则
- 易于单元测试和维护

## 数据流向

```
用户操作 → Vue组件 → ViewModel → Controller → Store → Manager → 持久化存储
```

这种设计确保了：
- 单向数据流，状态变化可预测
- 清晰的层次结构，易于理解和维护
- 良好的可测试性和可扩展性
- 符合现代前端应用的最佳实践
