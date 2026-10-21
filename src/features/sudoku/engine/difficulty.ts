import type { Difficulty } from '../types/sudoku.types';
import { candidates, countSolutions, popcount } from './solver';

const digits = (mask: number) => Array.from({ length: 9 }, (_, k) => k + 1).filter((n) => mask & (1 << n));
const units: number[][] = [];
for (let n = 0; n < 9; n++) {
  units.push(Array.from({ length: 9 }, (_, k) => n * 9 + k), Array.from({ length: 9 }, (_, k) => k * 9 + n));
}
for (let br = 0; br < 3; br++) for (let bc = 0; bc < 3; bc++) units.push(Array.from({ length: 9 }, (_, k) => (br * 3 + Math.floor(k / 3)) * 9 + bc * 3 + k % 3));

export function evaluateDifficulty(grid: number[]): Difficulty | null {
  if (grid.length !== 81 || grid.some((v) => !Number.isInteger(v) || v < 0 || v > 9) || countSolutions(grid, 1) !== 1) return null;
  const board = [...grid], excluded = Array(81).fill(0) as number[];
  let tier = 1;
  for (let guard = 0; guard < 500; guard++) {
    if (board.every(Boolean)) return tier === 1 ? 'easy' : 'medium';
    const masks = board.map((v, i) => v ? 0 : candidates(board, i) & ~excluded[i]);
    let changed = false;
    for (let i = 0; i < 81; i++) if (!board[i] && popcount(masks[i]) === 1) { board[i] = digits(masks[i])[0]; changed = true; }
    if (!changed) for (const unit of units) {
      for (let n = 1; n <= 9; n++) {
        const spots = unit.filter((i) => !board[i] && (masks[i] & (1 << n)) !== 0);
        if (spots.length === 1) { board[spots[0]] = n; changed = true; break; }
      }
      if (changed) break;
    }
    if (changed) continue;

    // Locked candidates: pointing from a box into its row or column.
    for (let box = 0; box < 9 && !changed; box++) for (let n = 1; n <= 9 && !changed; n++) {
      const cells = units[18 + box], spots = cells.filter((i) => !board[i] && (masks[i] & (1 << n)) !== 0);
      if (spots.length < 2) continue;
      const row = Math.floor(spots[0] / 9), col = spots[0] % 9;
      if (spots.every((i) => Math.floor(i / 9) === row)) for (let c = 0; c < 9; c++) { const i = row * 9 + c; if (!cells.includes(i) && (masks[i] & (1 << n))) { excluded[i] |= 1 << n; changed = true; } }
      else if (spots.every((i) => i % 9 === col)) for (let r = 0; r < 9; r++) { const i = r * 9 + col; if (!cells.includes(i) && (masks[i] & (1 << n))) { excluded[i] |= 1 << n; changed = true; } }
    }
    if (changed) { tier = Math.max(tier, 2); continue; }

    // Naked pairs in any row, column, or box.
    for (const unit of units) {
      const pairs = new Map<number, number[]>();
      for (const i of unit) if (!board[i] && popcount(masks[i]) === 2) pairs.set(masks[i], [...(pairs.get(masks[i]) ?? []), i]);
      for (const [pair, cells] of pairs) if (cells.length === 2) for (const i of unit) if (!cells.includes(i) && (masks[i] & pair)) { excluded[i] |= pair; changed = true; }
    }
    if (changed) { tier = Math.max(tier, 2); continue; }

    /* X-Wing desativado: o difícil usa as técnicas do médio com menos pistas, evitando o salto de complexidade.
    // X-Wing across rows or columns.
    for (let n = 1; n <= 9 && !changed; n++) for (const transpose of [false, true]) {
      const lines = Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => transpose ? c * 9 + r : r * 9 + c).filter((i) => !board[i] && (masks[i] & (1 << n))));
      for (let a = 0; a < 9 && !changed; a++) if (lines[a].length === 2) for (let b = a + 1; b < 9 && !changed; b++) {
        const cross = (i: number) => transpose ? Math.floor(i / 9) : i % 9;
        if (lines[b].length !== 2 || lines[a].map(cross).join() !== lines[b].map(cross).join()) continue;
        for (let r = 0; r < 9; r++) if (r !== a && r !== b) for (const c of lines[a].map(cross)) {
          const i = transpose ? c * 9 + r : r * 9 + c;
          if (masks[i] & (1 << n)) { excluded[i] |= 1 << n; changed = true; }
        }
      }
    }
    */
    return null;
  }
  return null;
}
