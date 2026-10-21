import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assignments, clueText, generateGame, isComplete, levels, satisfies, solve, themes, type Difficulty, type Theme, type Clue } from './game';
import { isGame, loadGame, saveGame, STORAGE_KEY } from '../storage/game-storage';

test('conditional clues follow implication, including false antecedents', () => {
  const clue: Clue = { kind: 'if', a: { category: 0, person: 0, value: 0 }, b: { category: 0, person: 1, value: 1 } };
  assert.equal(satisfies([[0, 1, 2]], clue), true);
  assert.equal(satisfies([[0, 2, 1]], clue), false);
  assert.equal(satisfies([[2, 1, 0]], clue), true);
  assert.equal(satisfies([[1, 2, 0]], clue), true);
  assert.equal(satisfies([[0, 1, 2]], { ...clue, kind: 'xor' }), false);
  assert.equal(satisfies([[0, 2, 1]], { ...clue, kind: 'xor' }), true);
  assert.equal(satisfies([[1, 2, 0]], { ...clue, kind: 'xor' }), false);
  assert.equal(satisfies([[0, 1, 2]], { kind: 'not', a: clue.a }), false);
});

test('all levels and stories have exactly one solution and persist valid progress', () => {
  for (const difficulty of Object.keys(levels) as Difficulty[]) {
    for (const theme of Object.keys(themes) as Theme[]) {
      for (let run = 0; run < 8; run++) {
        const game = generateGame(difficulty, theme), solutions = solve(game.puzzle);
        assert.equal(solutions.length, 1);
        assert.ok(isGame(game));
        assert.equal(isComplete(game.puzzle, game.answers), false);
        assert.ok(isComplete(game.puzzle, solutions[0]));
        assert.ok(game.puzzle.clues.some(c => c.kind === 'if'));
        if (difficulty === 'hard') assert.ok(game.puzzle.clues.some(c => c.kind === 'xor'));
        if (difficulty !== 'easy') assert.ok(game.puzzle.clues.some(c => c.kind !== 'not' && c.a.category !== c.b.category));
        game.puzzle.clues.forEach(c => { assert.ok(satisfies(solutions[0], c)); assert.doesNotMatch(clueText(game.puzzle, c), /undefined/); });
        const bad = solutions[0].map(row => [...row]); bad[0][0] = bad[0][1];
        assert.equal(isComplete(game.puzzle, bad), false);
        assert.ok(isGame({ ...game, answers: solutions[0], completed: true }));
      }
    }
  }
});

test('assignment space and invalid saves are checked', () => {
  assert.equal(assignments('easy').length, 6);
  assert.equal(assignments('medium').length, 576);
  assert.equal(assignments('hard').length, 14400);
  const game = generateGame('medium', 'taylor');
  assert.equal(isGame(null), false);
  assert.equal(isGame({ ...game, puzzle: { ...game.puzzle, difficulty: '__proto__' } }), false);
  assert.equal(isGame({ ...game, puzzle: { ...game.puzzle, clues: [] } }), false);
  assert.equal(isGame({ ...game, puzzle: { ...game.puzzle, clues: [{ kind: 'not', a: { person: 99, category: 0, value: 0 } }] } }), false);
  assert.equal(isGame({ ...game, answers: [[999]] }), false);
  assert.equal(isGame({ ...game, completed: true }), false);
  assert.equal(isGame({ ...game, crossed: [999] }), false);
  assert.equal(isGame({ ...game, hints: -1 }), false);
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) } });
  saveGame(game);
  assert.deepEqual(loadGame(), game);
  values.set(STORAGE_KEY, '{bad');
  assert.equal(loadGame(), null);
  assert.equal(values.has(STORAGE_KEY), false);
});
