import type { Difficulty, Puzzle } from '../types/sudoku.types';
import { createInitialState, type GameSnapshot, type SudokuGameState } from '../state/game-reducer';
import { getConflicts } from '../engine/validator';
import { countSolutions } from '../engine/solver';

const KEY = 'meni-games:sudoku';
const VERSION = 1;
const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
const isGrid = (v: unknown): v is number[] => Array.isArray(v) && v.length === 81 && v.every((n) => Number.isInteger(n) && n >= 0 && n <= 9);
const isNotes = (v: unknown): v is number[][] => Array.isArray(v) && v.length === 81 && v.every((cell) => Array.isArray(cell) && cell.length <= 9 && cell.every((n) => Number.isInteger(n) && n >= 1 && n <= 9) && new Set(cell).size === cell.length);
const isSnapshot = (v: unknown): v is GameSnapshot => !!v && typeof v === 'object' && isGrid((v as GameSnapshot).board) && isNotes((v as GameSnapshot).notes);
const isPuzzle = (v: unknown): v is Puzzle => {
  if (!v || typeof v !== 'object') return false;
  const p = v as Puzzle;
  return typeof p.id === 'string' && p.id.length > 0 && p.id.length <= 200 && difficulties.includes(p.difficulty) && isGrid(p.puzzle) && isGrid(p.solution) && p.puzzle.every((n, i) => n === 0 || n === p.solution[i]) && p.solution.every((n) => n >= 1 && n <= 9) && getConflicts(p.puzzle).length === 0 && getConflicts(p.solution).length === 0 && countSolutions(p.puzzle) === 1;
};
const isGame = (v: unknown): v is SudokuGameState => {
  if (!v || typeof v !== 'object') return false;
  const s = v as SudokuGameState;
  const validSnapshot = (entry: unknown) => isSnapshot(entry) && entry.board.every((n, i) => !s.puzzle!.puzzle[i] || n === s.puzzle!.puzzle[i]) && entry.notes.every((cell, i) => entry.board[i] === 0 || cell.length === 0);
  return isPuzzle(s.puzzle) && isGrid(s.board) && s.board.every((n, i) => !s.puzzle!.puzzle[i] || n === s.puzzle!.puzzle[i]) &&
    isNotes(s.notes) && s.notes.every((cell, i) => s.board[i] === 0 || cell.length === 0) && (s.status !== 'completed' || s.board.every((n, i) => n === s.puzzle!.solution[i])) && (s.status !== 'playing' || !s.board.every((n, i) => n === s.puzzle!.solution[i])) && (s.selected === null || Number.isInteger(s.selected) && s.selected >= 0 && s.selected < 81) &&
    typeof s.notesMode === 'boolean' && Number.isFinite(s.elapsedMs) && s.elapsedMs >= 0 &&
    typeof s.paused === 'boolean' && ['playing', 'completed'].includes(s.status) &&
    Array.isArray(s.past) && s.past.length <= 200 && s.past.every(validSnapshot) && Array.isArray(s.future) && s.future.length <= 200 && s.future.every(validSnapshot) && typeof s.highlightMistakes === 'boolean';
};

type Stored = { version: number; game: SudokuGameState | null; highlightMistakes: boolean; showTimer?: boolean };
export function loadSudokuState(): { game: SudokuGameState | null; highlightMistakes: boolean; showTimer: boolean } {
  const raw = localStorage.getItem(KEY);
  if (!raw) return { game: null, highlightMistakes: true, showTimer: false };
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') throw new Error('Formato inválido');
    if ((data as Stored).version !== VERSION) return { game: null, highlightMistakes: true, showTimer: false };
    if (typeof (data as Stored).highlightMistakes !== 'boolean') throw new Error('Formato inválido');
    const stored = data as Stored;
    if (stored.showTimer !== undefined && typeof stored.showTimer !== 'boolean') throw new Error('Preferência inválida');
    if (stored.game !== null && !isGame(stored.game)) throw new Error('Partida inválida');
    return { game: stored.game, highlightMistakes: stored.highlightMistakes, showTimer: stored.showTimer ?? false };
  } catch {
    localStorage.removeItem(KEY);
    return { game: null, highlightMistakes: true, showTimer: false };
  }
}
export function saveSudokuState(state: SudokuGameState): void {
  const game = state.puzzle ? state : null;
  const stored: Stored = { version: VERSION, game, highlightMistakes: state.highlightMistakes, showTimer: state.showTimer };
  localStorage.setItem(KEY, JSON.stringify(stored));
}
export function restoredState(game: SudokuGameState | null, highlightMistakes: boolean, showTimer = false): SudokuGameState {
  return game ? { ...game, paused: game.status === 'playing' || game.paused, highlightMistakes, showTimer } : { ...createInitialState(), highlightMistakes, showTimer };
}
