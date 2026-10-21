import type { Difficulty, Puzzle } from '../types/sudoku.types';
import { generatePuzzle } from './generator';

self.onmessage = (event: MessageEvent<Difficulty>) => {
  try {
    const puzzle: Puzzle = generatePuzzle(event.data);
    self.postMessage({ puzzle });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Falha ao gerar Sudoku.' });
  }
};
