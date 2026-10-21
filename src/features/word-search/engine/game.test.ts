import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateGame, levels, matchWord, normalize, selection, themes, type Difficulty } from './game';
import { isGame, loadGame, saveGame, STORAGE_KEY } from '../storage/game-storage';

test('all themes and levels generate solvable games with valid saves', () => {
  for (const difficulty of Object.keys(levels) as Difficulty[]) {
    for (const theme of Object.keys(themes) as (keyof typeof themes)[]) {
      for (let run = 0; run < 25; run++) {
        const game = generateGame(difficulty, theme);
        assert.ok(isGame(game));
        assert.equal(game.words.length, levels[difficulty].count);
        game.words.forEach((word, i) => {
          assert.equal(word.cells.map(c => game.grid[c]).join(''), normalize(word.label));
          assert.equal(matchWord(game, word.cells), i);
          game.found.push(i);
          assert.equal(matchWord(game, word.cells), -1);
        });
        assert.ok(isGame(game));
      }
    }
  }
});

test('selection is straight and matching obeys the difficulty directions', () => {
  assert.deepEqual(selection(0, 18, 8), [0, 9, 18]);
  assert.deepEqual(selection(18, 0, 8), [18, 9, 0]);
  assert.deepEqual(selection(0, 10, 8), []);
  const game = generateGame('easy', 'Animais');
  const label = game.words[0].label, text = normalize(label);
  const cells = Array.from(text, (_, i) => 7 - i);
  cells.forEach((c, i) => { game.grid[c] = text[i]; });
  assert.equal(matchWord(game, cells), -1);
  assert.equal(matchWord(game, [-1, 0]), -1);
  assert.equal(matchWord(game, [0]), -1);
});

test('corrupted saves are rejected and persistence round trips', () => {
  const game = generateGame('hard', 'Natureza');
  assert.equal(isGame(null), false);
  assert.equal(isGame({ ...game, difficulty: '__proto__' }), false);
  assert.equal(isGame({ ...game, grid: [] }), false);
  assert.equal(isGame({ ...game, found: [0, 0] }), false);
  assert.equal(isGame({ ...game, elapsedMs: -1 }), false);
  assert.equal(isGame({ ...game, words: [null, ...game.words.slice(1)] }), false);
  assert.equal(isGame({ ...game, words: game.words.map((word, i) => i ? word : { ...word, cells: [999] }) }), false);
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) } });
  saveGame(game);
  assert.deepEqual(loadGame(), game);
  values.set(STORAGE_KEY, '{broken');
  assert.equal(loadGame(), null);
  assert.equal(values.has(STORAGE_KEY), false);
  values.set(STORAGE_KEY, JSON.stringify({ version: 1, game: { ...game, found: [999] } }));
  assert.equal(loadGame(), null);
});


test('Taylor Swift titles keep their labels and fit each difficulty without spaces', () => {
  assert.equal(normalize('SPEAK NOW'), 'SPEAKNOW');
  assert.equal(normalize('LAVENDER HAZE'), 'LAVENDERHAZE');
  for (const difficulty of Object.keys(levels) as Difficulty[]) {
    const game = generateGame(difficulty, 'Taylor Swift');
    assert.ok(isGame(game));
    assert.equal(game.theme, 'Taylor Swift');
    game.words.forEach(word => {
      assert.ok(normalize(word.label).length <= levels[difficulty].size);
      assert.match(normalize(word.label), /^[A-Z]+$/);
    });
  }
  const game = generateGame('easy', 'Taylor Swift');
  const cells = [0, 1, 2, 3, 4, 5, 6, 7];
  game.words[0] = { label: 'SPEAK NOW', cells };
  cells.forEach((cell, i) => { game.grid[cell] = 'SPEAKNOW'[i]; });
  assert.equal(matchWord(game, cells), 0);
});
