const FULL = 0b1111111110;

export function countSolutions(grid: number[], limit = 2): number {
  if (grid.length !== 81 || limit < 1 || grid.some((n) => !Number.isInteger(n) || n < 0 || n > 9)) return 0;
  const values = [...grid];
  const rows = Array(9).fill(0) as number[];
  const cols = Array(9).fill(0) as number[];
  const boxes = Array(9).fill(0) as number[];
  for (let i = 0; i < 81; i++) {
    const n = values[i];
    if (!n) continue;
    const r = Math.floor(i / 9), c = i % 9, b = Math.floor(r / 3) * 3 + Math.floor(c / 3), bit = 1 << n;
    if ((rows[r] | cols[c] | boxes[b]) & bit) return 0;
    rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
  }
  let count = 0;
  const search = (): void => {
    if (count >= limit) return;
    let best = -1, mask = 0, size = 10;
    for (let i = 0; i < 81; i++) if (!values[i]) {
      const r = Math.floor(i / 9), c = i % 9, b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
      const candidates = FULL & ~(rows[r] | cols[c] | boxes[b]);
      const k = popcount(candidates);
      if (!k) return;
      if (k < size) { best = i; mask = candidates; size = k; if (k === 1) break; }
    }
    if (best === -1) { count++; return; }
    const r = Math.floor(best / 9), c = best % 9, b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    for (let bits = mask; bits && count < limit; bits &= bits - 1) {
      const bit = bits & -bits;
      values[best] = 31 - Math.clz32(bit); rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
      search();
      values[best] = 0; rows[r] ^= bit; cols[c] ^= bit; boxes[b] ^= bit;
    }
  };
  search();
  return count;
}

export function solve(grid: number[]): number[] | null {
  if (countSolutions(grid, 2) !== 1) return null;
  const values = [...grid];
  const search = (): boolean => {
    let best = -1, bestMask = 0, size = 10;
    for (let i = 0; i < 81; i++) if (!values[i]) {
      const mask = candidates(values, i), k = popcount(mask);
      if (!k) return false;
      if (k < size) { best = i; bestMask = mask; size = k; }
    }
    if (best < 0) return true;
    for (let bits = bestMask; bits; bits &= bits - 1) {
      values[best] = 31 - Math.clz32(bits & -bits);
      if (search()) return true;
      values[best] = 0;
    }
    return false;
  };
  return search() ? values : null;
}

export function candidates(grid: number[], i: number): number {
  const r = Math.floor(i / 9), c = i % 9;
  let used = 0;
  for (let k = 0; k < 9; k++) {
    used |= 1 << grid[r * 9 + k];
    used |= 1 << grid[k * 9 + c];
    used |= 1 << grid[(Math.floor(r / 3) * 3 + Math.floor(k / 3)) * 9 + Math.floor(c / 3) * 3 + k % 3];
  }
  return FULL & ~used;
}

export const popcount = (n: number): number => { let count = 0; for (; n; n &= n - 1) count++; return count; };
