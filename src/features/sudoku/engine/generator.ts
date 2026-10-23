import type { Difficulty, Puzzle } from '../types/sudoku.types';
import { candidates, countSolutions } from './solver';
import { evaluateDifficulty } from './difficulty';

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}

function createSolution(): number[] {
  const grid = Array(81).fill(0) as number[];
  const fill = (): boolean => {
    let best = -1, choices: number[] = [];
    for (let i = 0; i < 81; i++) if (!grid[i]) {
      const options = shuffled(Array.from({ length: 9 }, (_, n) => n + 1).filter((n) => candidates(grid, i) & (1 << n)));
      if (!options.length) return false;
      if (best < 0 || options.length < choices.length) { best = i; choices = options; if (options.length === 1) break; }
    }
    if (best < 0) return true;
    for (const n of choices) { grid[best] = n; if (fill()) return true; grid[best] = 0; }
    return false;
  };
  if (!fill()) throw new Error('Não foi possível gerar uma solução Sudoku.');
  return grid;
}

const clueRanges: Record<Difficulty, [number, number]> = { easy: [44, 48], medium: [36, 42], hard: [30, 35] };

export function generatePuzzle(difficulty: Difficulty): Puzzle {
  if (difficulty !== 'easy' && difficulty !== 'medium' && difficulty !== 'hard') throw new Error(`Dificuldade inválida: ${difficulty}`);
  const [min, max] = clueRanges[difficulty];
  const budget = 300;
  for (let attempt = 0; attempt < budget; attempt++) {
    const solution = createSolution();
    const puzzle = [...solution];
    const target = min + Math.floor(Math.random() * (max - min + 1));
    for (const i of shuffled(Array.from({ length: 81 }, (_, n) => n))) {
      if (puzzle.filter(Boolean).length <= min) break;
      const value = puzzle[i]; puzzle[i] = 0;
      if (countSolutions(puzzle) !== 1) { puzzle[i] = value; continue; }
      // Continue removendo até o mínimo se o alvo sorteado ainda não tiver a técnica exigida.
      if (puzzle.filter(Boolean).length <= target && evaluateDifficulty(puzzle) === difficulty) {
        return { id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`, difficulty, puzzle, solution };
      }
    }
  }
  throw new Error('Não foi possível preparar este desafio. Tente novamente.');
}
