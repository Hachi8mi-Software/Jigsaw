<!--
  SVG边界组件
  用于拼图编辑器中的交互式边界线
-->

<template>
  <g
    :class="boundaryClasses"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
  >
    <!-- 边界线路径 -->
    <path
      :d="pathData"
      :stroke="strokeColor"
      :stroke-width="strokeWidth"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    
    <!-- 交互区域（更宽的透明区域便于点击） -->
    <path
      :d="pathData"
      stroke="transparent"
      :stroke-width="interactionWidth"
      fill="none"
      style="cursor: pointer;"
    />
    
    <!-- 状态指示器 -->
    <circle
      v-if="showStateIndicator"
      :cx="midX"
      :cy="midY"
      :r="indicatorRadius"
      :fill="indicatorColor"
      :stroke="strokeColor"
      stroke-width="2"
    />
    
    <!-- 状态文本 -->
    <text
      v-if="showStateText && isHovered"
      :x="textX"
      :y="textY"
      :text-anchor="textAnchor"
      :fill="strokeColor"
      :stroke="textStrokeColor"
      stroke-width="1"
      font-size="12"
      font-weight="regular"
      class="boundary-state-text"
    >
      {{ stateText }}
    </text>
  </g>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Boundary } from '../types'
import { BoundaryState } from '../types'
import { SvgPathGenerator } from '../utils/svgUtils'

interface Props {
  boundary: Boundary
  isSelected?: boolean
  isPreviewMode?: boolean
  showStateIndicator?: boolean
  showStateText?: boolean
}

interface Emits {
  (e: 'click', boundaryId: string): void
  (e: 'hover', boundaryId: string | null): void
  (e: 'stateChange', boundaryId: string, newState: BoundaryState): void
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  isPreviewMode: false,
  showStateIndicator: true,
  showStateText: true
})

const emit = defineEmits<Emits>()

// 响应式状态
const isHovered = ref(false)

// 计算属性
const midX = computed(() => (props.boundary.startX + props.boundary.endX) / 2)
const midY = computed(() => (props.boundary.startY + props.boundary.endY) / 2)

const pathData = computed(() => {
  if (props.boundary.state === 'flat') {
    return `M ${props.boundary.startX} ${props.boundary.startY} L ${props.boundary.endX} ${props.boundary.endY}`
  }
  
  // 使用SVG路径生成器生成复杂路径
  const pieceWidth = Math.abs(props.boundary.endX - props.boundary.startX) || 100
  const pieceHeight = Math.abs(props.boundary.endY - props.boundary.startY) || 100
  
  return `M ${props.boundary.startX} ${props.boundary.startY} ` + 
         SvgPathGenerator.generateBoundaryPath(
           props.boundary.state,
           props.boundary.startX,
           props.boundary.startY,
           props.boundary.endX,
           props.boundary.endY,
           pieceWidth,
           pieceHeight
         )
})

const strokeColor = computed(() => {
  if (props.isSelected) return '#ff6b6b'
  if (isHovered.value) return '#4ecdc4'
  if (props.isPreviewMode) return '#95a5a6'
  
  switch (props.boundary.state) {
    case 'convex': return '#3498db'
    case 'concave': return '#e74c3c'
    default: return '#34495e'
  }
})

const strokeWidth = computed(() => {
  if (props.isSelected) return 4
  if (isHovered.value) return 3
  return 2
})

const interactionWidth = computed(() => {
  return props.isPreviewMode ? 0 : 12
})

const indicatorRadius = computed(() => {
  if (props.boundary.state === 'flat') return 0
  if (props.isSelected) return 6
  if (isHovered.value) return 5
  return 4
})

const indicatorColor = computed(() => {
  switch (props.boundary.state) {
    case 'convex': return '#3498db'
    case 'concave': return '#e74c3c'
    default: return 'transparent'
  }
})

const stateText = computed(() => {
  switch (props.boundary.state) {
    case 'convex': return '凸'
    case 'concave': return '凹'
    default: return '平'
  }
})

const textStrokeColor = computed(() => {
  // 使用白色描边来提高文字可读性
  return '#ffffff'
})

// 根据边界方向调整文字位置
const textX = computed(() => {
  if (props.boundary.direction === 'vertical') {
    // 竖边界：文字放在边界右侧
    return midX.value + 20
  }
  // 横边界：文字放在边界上方
  return midX.value
})

const textY = computed(() => {
  if (props.boundary.direction === 'vertical') {
    // 竖边界：文字垂直居中
    return midY.value + 4
  }
  // 横边界：文字在边界上方
  return midY.value - 15
})

const textAnchor = computed(() => {
  if (props.boundary.direction === 'vertical') {
    // 竖边界：左对齐
    return 'start'
  }
  // 横边界：居中对齐
  return 'middle'
})

const boundaryClasses = computed(() => {
  return [
    'svg-boundary',
    {
      'svg-boundary--selected': props.isSelected,
      'svg-boundary--hovered': isHovered.value,
      'svg-boundary--preview': props.isPreviewMode,
      'svg-boundary--interactive': !props.isPreviewMode
    }
  ]
})

// 事件处理
const handleMouseEnter = () => {
  if (!props.isPreviewMode) {
    isHovered.value = true
    emit('hover', props.boundary.id)
  }
}

const handleMouseLeave = () => {
  if (!props.isPreviewMode) {
    isHovered.value = false
    emit('hover', null)
  }
}

// 边界状态循环切换逻辑
const getNextBoundaryState = (currentState: BoundaryState): BoundaryState => {
  switch (currentState) {
    case BoundaryState.FLAT:
      return BoundaryState.CONVEX
    case BoundaryState.CONVEX:
      return BoundaryState.CONCAVE
    case BoundaryState.CONCAVE:
      return BoundaryState.FLAT
    default:
      return BoundaryState.FLAT
  }
}

const handleClick = () => {
  if (!props.isPreviewMode) {
    // 循环切换到下一个边界状态
    const nextState = getNextBoundaryState(props.boundary.state)
    emit('stateChange', props.boundary.id, nextState)
    emit('click', props.boundary.id)
  }
}
</script>

<style scoped>
.svg-boundary {
  transition: all 0.2s ease;
}

.svg-boundary--interactive {
  cursor: pointer;
}

.svg-boundary--hovered {
  filter: drop-shadow(0 0 4px rgba(78, 205, 196, 0.6));
}

.svg-boundary--selected {
  filter: drop-shadow(0 0 6px rgba(255, 107, 107, 0.8));
}

.svg-boundary--preview {
  pointer-events: none;
}

.boundary-state-text {
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.8));
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
}
</style>
