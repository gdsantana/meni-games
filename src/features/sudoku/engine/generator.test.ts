import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateDifficulty } from './difficulty';
import { generatePuzzle } from './generator';
import { countSolutions, solve } from './solver';
import type { Difficulty } from '../types/sudoku.types';

const fixtures: Record<Difficulty, string> = {
  easy: '090450078827039410145708036900517002230080050001340089009275060006000701700163090',
  medium: '008063900900000038076000025005300742002014000709052003090020300500130294020947000',
  hard: '050603904000920010000000370000070063800061290506200780200000800305000002700800000',
};

test('difficulty separates singles, hidden singles and locked candidates', () => {
  for (const difficulty of Object.keys(fixtures) as Difficulty[]) {
    const grid = [...fixtures[difficulty]].map(Number);
    const original = [...grid];
    assert.equal(countSolutions(grid), 1);
    assert.equal(evaluateDifficulty(grid), difficulty);
    assert.deepEqual(grid, original);
  }
  assert.equal(evaluateDifficulty([]), null);
  assert.equal(evaluateDifficulty(Array(81).fill(1)), null);
  assert.equal(evaluateDifficulty(Array(81).fill(0)), null);
});

test('all levels generate unique puzzles within the new clue and technique ranges', () => {
  const ranges: Record<Difficulty, [number, number]> = { easy: [44, 48], medium: [36, 42], hard: [30, 35] };
  const random = Math.random;
  let seed = 20261023;
  // Seed the sample so generation regressions can be reproduced.
  Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  try {
    for (const difficulty of Object.keys(ranges) as Difficulty[]) {
      const [min, max] = ranges[difficulty];
      for (let run = 0; run < 100; run++) {
        const game = generatePuzzle(difficulty);
        const clues = game.puzzle.filter(Boolean).length;
        assert.equal(game.difficulty, difficulty);
        assert.ok(clues >= min && clues <= max, `${difficulty}: ${clues} clues`);
        assert.equal(evaluateDifficulty(game.puzzle), difficulty);
        assert.equal(countSolutions(game.puzzle), 1);
        assert.deepEqual(solve(game.puzzle), game.solution);
        game.puzzle.forEach((value, i) => { if (value) assert.equal(value, game.solution[i]); });
      }
    }
  } finally {
    Math.random = random;
  }
  assert.throws(() => generatePuzzle('invalid' as Difficulty), /Dificuldade inválida/);
});
