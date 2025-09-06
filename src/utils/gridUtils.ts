type Size = {
  width: number,
  height: number
}
// TODO: 需要调整为更加精确的对齐方式
const getGridPos = (index: number, pieceSize: Size, gridCols: number) => {
  const row = Math.floor(index / gridCols)
  const col = index % gridCols
  // 调整偏移量，使拼图块更偏左上方
  const x = 6 + col * (pieceSize.width + 0.25)
  const y = 6 + row * (pieceSize.height + 1)
  return { x, y }
}

export { getGridPos }