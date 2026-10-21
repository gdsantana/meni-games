import type { Puzzle } from '../types/sudoku.types';

export type GameStatus = 'idle' | 'playing' | 'completed';
export type GameSnapshot = { board: number[]; notes: number[][] };
export type SudokuGameState = GameSnapshot & {
  puzzle: Puzzle | null;
  selected: number | null;
  notesMode: boolean;
  elapsedMs: number;
  paused: boolean;
  status: GameStatus;
  past: GameSnapshot[];
  future: GameSnapshot[];
  highlightMistakes: boolean;
  showTimer: boolean;
};

export type GameAction =
  | { type: 'select'; index: number }
  | { type: 'input'; value: number }
  | { type: 'erase' }
  | { type: 'toggleNotes' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'hint' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'tick'; elapsedMs: number }
  | { type: 'start'; puzzle: Puzzle }
  | { type: 'restart' }
  | { type: 'setHighlightMistakes'; value: boolean }
  | { type: 'setShowTimer'; value: boolean }
  | { type: 'restore'; state: SudokuGameState };

export const createInitialState = (): SudokuGameState => ({
  puzzle: null, board: Array(81).fill(0), notes: Array.from({ length: 81 }, () => []), selected: null,
  notesMode: false, elapsedMs: 0, paused: false, status: 'idle', past: [], future: [], highlightMistakes: true, showTimer: false,
});

const snapshot = (state: SudokuGameState): GameSnapshot => ({ board: [...state.board], notes: state.notes.map((cell) => [...cell]) });
const addHistory = (history: GameSnapshot[], entry: GameSnapshot) => [...history, entry].slice(-200);
const complete = (board: number[], puzzle: Puzzle) => board.every((value, i) => value === puzzle.solution[i]);

export function gameReducer(state: SudokuGameState, action: GameAction): SudokuGameState {
  if (action.type === 'setHighlightMistakes') return { ...state, highlightMistakes: action.value };
  if (action.type === 'setShowTimer') return { ...state, showTimer: action.value };
  if (action.type === 'restore') return action.state;
  if (action.type === 'start') {
    const puzzle = { ...action.puzzle, puzzle: [...action.puzzle.puzzle], solution: [...action.puzzle.solution] };
    const board = [...puzzle.puzzle];
    const firstEmpty = board.findIndex((value) => value === 0);
    return { ...state, puzzle, board, notes: Array.from({ length: 81 }, () => []),
      selected: firstEmpty < 0 ? null : firstEmpty, notesMode: false, elapsedMs: 0,
      paused: false, status: complete(board, puzzle) ? 'completed' : 'playing', past: [], future: [] };
  }
  if (action.type === 'restart' && state.puzzle) return gameReducer(state, { type: 'start', puzzle: state.puzzle });
  if (action.type === 'select') return action.index >= 0 && action.index < 81 ? { ...state, selected: action.index } : state;
  if (action.type === 'toggleNotes') return { ...state, notesMode: !state.notesMode };
  if (action.type === 'tick') return state.status === 'playing' && !state.paused ? { ...state, elapsedMs: Math.max(state.elapsedMs, action.elapsedMs) } : state;
  if (action.type === 'pause') return state.status === 'playing' ? { ...state, paused: true } : state;
  if (action.type === 'resume') return state.status === 'playing' ? { ...state, paused: false } : state;
  if (!state.puzzle) return state;
  if (action.type === 'undo' || action.type === 'redo') {
    if (state.paused) return state;
    const source = action.type === 'undo' ? state.past : state.future;
    if (!source.length) return state;
    const target = source[source.length - 1];
    const current = snapshot(state);
    const board = [...target.board], notes = target.notes.map((cell) => [...cell]);
    return { ...state, board, notes, status: complete(board, state.puzzle) ? 'completed' : 'playing',
      past: action.type === 'undo' ? state.past.slice(0, -1) : addHistory(state.past, current),
      future: action.type === 'undo' ? [...state.future, current] : state.future.slice(0, -1) };
  }
  if (state.status !== 'playing' || state.paused) return state;
  if (action.type === 'hint') {
    const target = state.board.findIndex((value, i) => value !== state.puzzle!.solution[i] && state.puzzle!.puzzle[i] === 0);
    if (target < 0) return state;
    const board = [...state.board], notes = state.notes.map((cell) => [...cell]);
    board[target] = state.puzzle.solution[target]; notes[target] = [];
    return { ...state, board, notes, selected: target, status: complete(board, state.puzzle) ? 'completed' : 'playing', past: addHistory(state.past, snapshot(state)), future: [] };
  }
  if (action.type !== 'input' && action.type !== 'erase') return state;
  const index = state.selected;
  if (index === null || state.puzzle.puzzle[index] !== 0) return state;
  const board = [...state.board], notes = state.notes.map((cell) => [...cell]);
  if (state.notesMode && action.type === 'input') {
    if (!Number.isInteger(action.value) || action.value < 1 || action.value > 9 || board[index]) return state;
    notes[index] = notes[index].includes(action.value) ? notes[index].filter((n) => n !== action.value) : [...notes[index], action.value].sort();
  } else if (action.type === 'erase') {
    if (board[index] === 0 && notes[index].length === 0) return state;
    board[index] = 0; notes[index] = [];
  } else {
    if (!Number.isInteger(action.value) || action.value < 1 || action.value > 9) return state;
    board[index] = action.value; notes[index] = [];
  }
  const wasChanged = board.some((v, i) => v !== state.board[i]) || notes.some((cell, i) => cell.length !== state.notes[i].length || cell.some((v, j) => v !== state.notes[i][j]));
  if (!wasChanged) return state;
  return { ...state, board, notes, status: complete(board, state.puzzle) ? 'completed' : 'playing',
    past: addHistory(state.past, snapshot(state)), future: [] };
}
