type Size = {
  width: number,
  height: number
}

// 网格位置计算，与CSS Grid布局保持完全一致
const getGridPos = (index: number, pieceSize: Size, gridCols: number) => {
  const row = Math.floor(index / gridCols)
  const col = index % gridCols
  
  // CSS网格的padding来自createGridStyle: 8px
  // puzzle-grid容器的padding: 16px (p-4)
  // 但是Canvas是绝对定位到puzzle-grid内部，所以只需要考虑CSS网格的padding
  const gridPadding = 8 // 来自createGridStyle的padding
  const gap = 2 // 来自createGridStyle的gap
  
  // CSS Grid的实际计算方式：
  // 每个网格单元的起始位置 = padding + (index * (cellSize + gap))
  const x = gridPadding + col * (pieceSize.width + gap)
  const y = gridPadding + row * (pieceSize.height + gap)
  
  return { x, y }
}

export { getGridPos }