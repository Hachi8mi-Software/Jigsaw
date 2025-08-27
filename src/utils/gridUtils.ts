type Size = {
  width: number,
  height: number
}

const getGridPos = (index: number, pieceSize: Size, gridCols: number) => {
  const row = Math.floor(index / gridCols)
  const col = index % gridCols
  const x = 8 + col * (pieceSize.width + 2)
  const y = 8 + row * (pieceSize.height + 2)
  return { x, y }
}

export { getGridPos }