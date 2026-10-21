import { directions, levels, normalize, selection, themes, type Game } from '../engine/game';
export const STORAGE_KEY = 'meni-games:word-search';
export function isGame(value: unknown): value is Game {
  if (!value || typeof value !== 'object') return false;
  const g = value as Game;
  if (!Object.hasOwn(levels, g.difficulty) || !Object.hasOwn(themes, g.theme)) return false;
  const { size, count } = levels[g.difficulty];
  if (!Array.isArray(g.grid) || g.grid.length !== size * size || !g.grid.every(l => typeof l === 'string' && /^[A-Z]$/.test(l))) return false;
  if (!Array.isArray(g.words) || g.words.length !== count || new Set(g.words.map(w => w?.label)).size !== count) return false;
  if (!g.words.every(w => {
    if (!w || !(themes[g.theme as keyof typeof themes] as string[]).includes(w.label) || !Array.isArray(w.cells) || w.cells.length !== normalize(w.label).length || !w.cells.every(c => Number.isInteger(c) && c >= 0 && c < size * size)) return false;
    const path = selection(w.cells[0], w.cells.at(-1)!, size);
    const dr = Math.sign(Math.floor(w.cells[1] / size) - Math.floor(w.cells[0] / size)), dc = Math.sign(w.cells[1] % size - w.cells[0] % size);
    return directions(g.difficulty).some(([r, c]) => r === dr && c === dc) && path.length === w.cells.length && path.every((c, i) => c === w.cells[i] && g.grid[c] === normalize(w.label)[i]);
  })) return false;
  return Array.isArray(g.found) && new Set(g.found).size === g.found.length && g.found.every(i => Number.isInteger(i) && i >= 0 && i < count) && Number.isFinite(g.elapsedMs) && g.elapsedMs >= 0;
}
export function loadGame(): Game | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { const stored = JSON.parse(raw); if (stored.version === 1 && isGame(stored.game)) return stored.game; } catch { /* Invalid saves are discarded without affecting other games. */ }
  localStorage.removeItem(STORAGE_KEY);
  return null;
}
export function saveGame(game: Game) { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, game })); }
