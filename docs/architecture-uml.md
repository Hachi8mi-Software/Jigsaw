# 项目架构UML图

本文档包含了拼图游戏项目的各种UML图表，用于可视化项目的架构和数据结构。

## 类图 (Class Diagram)

### 核心数据结构类图

```mermaid
classDiagram
    %% 核心数据结构
    class PuzzleData {
        +string id
        +string name
        +string imageUrl
        +GridConfig gridConfig
        +Boundary[] boundaries
        +Date createdAt
        +number difficulty
    }
    
    class GridConfig {
        +number rows
        +number cols
        +number pieceWidth
        +number pieceHeight
    }
    
    class Boundary {
        +string id
        +number row
        +number col
        +string direction
        +BoundaryState state
        +number startX
        +number startY
        +number endX
        +number endY
    }
    
    class PieceStatus {
        +number originalIndex
        +number currentX
        +number currentY
        +boolean isPlaced
        +number gridRow
        +number gridCol
        +number rotation
    }
    
    class GameState {
        +PuzzleData currentPuzzle
        +PiecePosition[] pieces
        +Date startTime
        +Date endTime
        +number moveCount
        +boolean isCompleted
        +number elapsedTime
    }
    
    %% 关系
    PuzzleData "1" --> "1" GridConfig : contains
    PuzzleData "1" --> "*" Boundary : has
    GameState "1" --> "1" PuzzleData : uses
    GameState "1" --> "*" PieceStatus : manages
```

### 应用层架构类图

```mermaid
classDiagram
    %% Store层
    class GameStore {
        +GameState gameState
        +PieceStatus[] puzzleBoardPieces
        +number draggingPieceIndex
        +startTimer()
        +pauseTimer()
        +updatePiecePosition(index, x, y)
        +setPiecePlaced(index, placed)
        +checkGameCompletion()
    }
    
    class LibraryStore {
        +LibraryItem[] items
        +string[] categories
        +string selectedCategory
        +string searchKeyword
        +UserStats userStats
        +Achievement[] achievements
        +addLibraryItem(item)
        +removeLibraryItem(id)
        +checkAchievements()
    }
    
    class EditorStore {
        +string currentImage
        +GridConfig gridConfig
        +Boundary[] boundaries
        +boolean isPreviewMode
        +string selectedBoundary
        +string puzzleName
        +setImage(imageUrl)
        +updateGridConfig(config)
        +generateBoundaries()
        +exportPuzzle()
    }
    
    %% ViewModel层
    class PuzzleBoardViewModel {
        -PuzzleData puzzleData
        -GameController gameController
        +number totalPieces
        +number gridRows
        +number gridCols
        +PieceStatus[] pieces
        +initializePieces()
        +shufflePieces()
        +startDrag(index)
        +handleDrag(index, x, y)
        +stopDrag(index)
    }
    
    class GameViewModel {
        +GameController gameController
        +Ref~boolean~ showCompletionModal
        +Ref~boolean~ showSettingsModal
        +Ref~Achievement[]~ newAchievements
        +loadPuzzleFromRoute()
        +handleGameCompleted()
        +pauseGame()
        +resumeGame()
    }
    
    %% Controller层
    class GameController {
        -GameStore gameStore
        +PuzzleData currentPuzzle
        +startNewGame(puzzle)
        +pauseGame()
        +resumeGame()
        +restartGame()
        +movePiece(index, x, y)
        +placePiece(index, row, col)
        +checkGameCompletion()
    }
    
    %% Manager层
    class LibraryManager {
        -string STORAGE_KEY$
        -string USER_STATS_KEY$
        -string ACHIEVEMENTS_KEY$
        +getBuiltInLibrary()
        +saveToStorage(items)
        +loadFromStorage()
        +getUserStats()
        +saveUserStats(stats)
        +validateImageFile(file)
    }
    
    class EditorManager {
        +validateGridConfig(config)
        +calculateDifficulty(config)
        +generatePreviewData(image, config)
        +exportPuzzleData(puzzle)
        +importPuzzleData(data)
    }
    
    %% 关系
    PuzzleBoardViewModel --> GameController : uses
    GameViewModel --> GameController : uses
    GameController --> GameStore : manages
    LibraryStore --> LibraryManager : delegates
    EditorStore --> EditorManager : delegates
```

### 用户和成就系统类图

```mermaid
classDiagram
    class LibraryItem {
        +string id
        +string name
        +string imageUrl
        +string category
        +string[] tags
        +number difficulty
        +boolean isBuiltIn
    }
    
    class UserStats {
        +number totalGamesPlayed
        +number totalTimeSpent
        +Record~string,number~ bestTimes
        +string[] achievements
        +number totalSuccessMovements
        +updateStats(gameResult)
        +getBestTime(puzzleId)
        +addAchievement(achievementId)
    }
    
    class Achievement {
        +string id
        +string name
        +string description
        +string icon
        +Function condition
        +Date unlockedAt
        +checkCondition(userStats)
        +unlock()
    }
    
    class GameResult {
        +string puzzleId
        +number completionTime
        +number moveCount
        +boolean completed
        +Date completedAt
    }
    
    %% 关系
    UserStats "1" --> "*" Achievement : unlocks
    LibraryItem "1" --> "*" GameResult : generates
    GameResult "1" --> "1" UserStats : updates
```

## 序列图 (Sequence Diagram)

### 游戏开始流程

```mermaid
sequenceDiagram
    participant User
    participant GameView
    participant GameViewModel
    participant GameController
    participant GameStore
    participant PuzzleBoardViewModel
    
    User->>GameView: 选择拼图开始游戏
    GameView->>GameViewModel: loadPuzzleFromRoute()
    GameViewModel->>GameController: startNewGame(puzzle)
    GameController->>GameStore: 初始化游戏状态
    GameStore-->>GameController: 状态已初始化
    GameController->>PuzzleBoardViewModel: initializePieces()
    PuzzleBoardViewModel->>PuzzleBoardViewModel: shufflePieces()
    PuzzleBoardViewModel-->>GameView: 拼图板已准备就绪
    GameView-->>User: 显示游戏界面
```

### 拼图块移动流程

```mermaid
sequenceDiagram
    participant User
    participant PuzzleBoard
    participant PuzzleBoardViewModel
    participant GameController
    participant GameStore
    
    User->>PuzzleBoard: 开始拖拽拼图块
    PuzzleBoard->>PuzzleBoardViewModel: startDrag(index)
    PuzzleBoardViewModel->>GameStore: 设置拖拽状态
    
    User->>PuzzleBoard: 拖拽移动
    PuzzleBoard->>PuzzleBoardViewModel: handleDrag(index, x, y)
    PuzzleBoardViewModel->>GameStore: updatePiecePosition()
    
    User->>PuzzleBoard: 释放拼图块
    PuzzleBoard->>PuzzleBoardViewModel: stopDrag(index)
    PuzzleBoardViewModel->>GameController: placePiece(index, row, col)
    GameController->>GameStore: setPiecePlaced()
    GameController->>GameController: checkGameCompletion()
    
    alt 游戏完成
        GameController-->>PuzzleBoardViewModel: 游戏完成信号
        PuzzleBoardViewModel-->>PuzzleBoard: 显示完成动画
    end
```

### 素材库管理流程

```mermaid
sequenceDiagram
    participant User
    participant LibraryView
    participant LibraryStore
    participant LibraryManager
    participant Storage
    
    User->>LibraryView: 添加新素材
    LibraryView->>LibraryStore: addLibraryItem(item)
    LibraryStore->>LibraryManager: validateImageFile(file)
    LibraryManager-->>LibraryStore: 验证结果
    
    alt 验证通过
        LibraryStore->>LibraryStore: 添加到items列表
        LibraryStore->>LibraryManager: saveToStorage(items)
        LibraryManager->>Storage: 持久化数据
        Storage-->>LibraryManager: 保存成功
        LibraryManager-->>LibraryStore: 保存完成
        LibraryStore-->>LibraryView: 更新界面
    else 验证失败
        LibraryStore-->>LibraryView: 显示错误信息
    end
```

## 活动图 (Activity Diagram)

### 游戏完整流程

```mermaid
flowchart TD
    A[开始游戏] --> B[选择拼图]
    B --> C[初始化拼图数据]
    C --> D[生成拼图块]
    D --> E[打乱拼图块位置]
    E --> F[开始计时]
    F --> G[等待用户操作]
    
    G --> H{用户拖拽拼图块}
    H -->|拖拽开始| I[记录拖拽状态]
    I --> J[更新拼图块位置]
    J --> K{释放拼图块}
    
    K -->|正确位置| L[标记为已放置]
    K -->|错误位置| M[返回原位或自由位置]
    
    L --> N{检查是否完成}
    M --> G
    
    N -->|未完成| G
    N -->|完成| O[停止计时]
    O --> P[记录游戏结果]
    P --> Q[检查成就]
    Q --> R[显示完成界面]
    R --> S[结束]
```

### 拼图编辑流程

```mermaid
flowchart TD
    A[进入编辑器] --> B[选择图片]
    B --> C[设置网格配置]
    C --> D[生成边界]
    D --> E[调整边界参数]
    E --> F{预览模式}
    
    F -->|开启预览| G[生成预览数据]
    F -->|关闭预览| H[继续编辑]
    
    G --> I[显示拼图效果]
    I --> J{满意结果}
    H --> E
    
    J -->|不满意| K[返回编辑]
    J -->|满意| L[输入拼图名称]
    K --> E
    
    L --> M[计算难度]
    M --> N[导出拼图数据]
    N --> O[保存到素材库]
    O --> P[编辑完成]
```

## 状态图 (State Diagram)

### 游戏状态转换

```mermaid
stateDiagram-v2
    [*] --> NotStarted: 应用启动
    NotStarted --> Loading: 选择拼图
    Loading --> Playing: 数据加载完成
    Playing --> Paused: 暂停游戏
    Paused --> Playing: 恢复游戏
    Playing --> Completed: 拼图完成
    Playing --> NotStarted: 重新开始
    Completed --> NotStarted: 开始新游戏
    Paused --> NotStarted: 放弃游戏
    
    state Playing {
        [*] --> Idle
        Idle --> Dragging: 开始拖拽
        Dragging --> Idle: 释放拼图块
        Dragging --> Placing: 拖到正确位置
        Placing --> Idle: 放置完成
    }
```

### 拼图块状态

```mermaid
stateDiagram-v2
    [*] --> Scattered: 初始打乱状态
    Scattered --> Dragging: 用户开始拖拽
    Dragging --> Scattered: 拖拽到错误位置
    Dragging --> Placed: 拖拽到正确位置
    Placed --> [*]: 游戏完成
    
    state Dragging {
        [*] --> Moving
        Moving --> Checking: 释放鼠标
        Checking --> Moving: 位置不正确
    }
```

## 组件图 (Component Diagram)

### 系统组件架构

```mermaid
flowchart TB
    subgraph "前端应用"
        subgraph "View Layer"
            A[GameView]
            B[LibraryView]
            C[EditorView]
            D[PuzzleBoard组件]
        end
        
        subgraph "ViewModel Layer"
            E[GameViewModel]
            F[PuzzleBoardViewModel]
        end
        
        subgraph "Store Layer"
            G[GameStore]
            H[LibraryStore]
            I[EditorStore]
        end
        
        subgraph "Business Layer"
            J[GameController]
            K[LibraryManager]
            L[EditorManager]
        end
    end
    
    subgraph "后端服务 (Tauri)"
        M[文件系统API]
        N[本地存储API]
    end
    
    subgraph "持久化层"
        O[LocalStorage]
        P[文件系统]
    end
    
    %% 连接关系
    A --> E
    D --> F
    E --> J
    F --> J
    J --> G
    G --> K
    H --> K
    I --> L
    K --> M
    K --> N
    L --> M
    M --> P
    N --> O
```

这些UML图表提供了项目架构的完整视图：

1. **类图**: 展示了数据结构和类之间的关系
2. **序列图**: 描述了关键业务流程的时间顺序
3. **活动图**: 展示了业务流程的逻辑步骤
4. **状态图**: 描述了对象状态的转换
5. **组件图**: 展示了系统的整体架构和组件关系

这些图表有助于理解系统的设计思路和实现方式，为后续的开发和维护提供参考。
