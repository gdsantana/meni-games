export function getConflicts(grid: number[]): number[] {
  if (grid.length !== 81) return [];
  const conflicts = new Set<number>();
  const inspect = (cells: number[]) => {
    const seen = new Map<number, number[]>();
    for (const i of cells) if (grid[i]) seen.set(grid[i], [...(seen.get(grid[i]) ?? []), i]);
    for (const indices of seen.values()) if (indices.length > 1) indices.forEach((i) => conflicts.add(i));
  };
  for (let n = 0; n < 9; n++) {
    inspect(Array.from({ length: 9 }, (_, k) => n * 9 + k));
    inspect(Array.from({ length: 9 }, (_, k) => k * 9 + n));
  }
  for (let br = 0; br < 3; br++) for (let bc = 0; bc < 3; bc++)
    inspect(Array.from({ length: 9 }, (_, k) => (br * 3 + Math.floor(k / 3)) * 9 + bc * 3 + k % 3));
  return [...conflicts].sort((a, b) => a - b);
}
