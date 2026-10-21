import { isComplete, levels, names, solve, themes, type Atom, type Game } from '../engine/game';
export const STORAGE_KEY = 'meni-games:logic';
export function isGame(value: unknown): value is Game {
  if (!value || typeof value !== 'object') return false;
  const g = value as Game, p = g.puzzle;
  if (!p || !Object.hasOwn(levels, p.difficulty) || !Object.hasOwn(themes, p.theme)) return false;
  const { people, categories } = levels[p.difficulty];
  const atom = (a: Atom) => !!a && Number.isInteger(a.person) && a.person >= 0 && a.person < people && Number.isInteger(a.category) && a.category >= 0 && a.category < categories && Number.isInteger(a.value) && a.value >= 0 && a.value < people;
  if (!Array.isArray(p.people) || p.people.length !== people || new Set(p.people).size !== people || !p.people.every(n => names.includes(n))) return false;
  if (!Array.isArray(p.clues) || !p.clues.length || p.clues.length > 40 || !p.clues.every(c => c && atom(c.a) && (c.kind === 'not' || (c.kind === 'if' || c.kind === 'xor') && atom(c.b)))) return false;
  if (!Array.isArray(g.answers) || g.answers.length !== categories || !g.answers.every(row => Array.isArray(row) && row.length === people && row.every(v => Number.isInteger(v) && v >= -1 && v < people))) return false;
  if (!Array.isArray(g.crossed) || new Set(g.crossed).size !== g.crossed.length || !g.crossed.every(i => Number.isInteger(i) && i >= 0 && i < p.clues.length) || !Number.isSafeInteger(g.hints) || g.hints < 0 || typeof g.completed !== 'boolean') return false;
  return solve(p).length === 1 && (!g.completed || isComplete(p, g.answers));
}
export function loadGame(): Game | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { const data = JSON.parse(raw); if (data.version === 1 && isGame(data.game)) return data.game; } catch { /* Discard malformed saves without touching other games. */ }
  localStorage.removeItem(STORAGE_KEY);
  return null;
}
export function saveGame(game: Game) { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, game })); }
