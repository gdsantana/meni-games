export const levels = {
  easy: { name: 'Fácil', size: 8, count: 6, description: 'Horizontal e vertical, em sentido normal.' },
  medium: { name: 'Médio', size: 10, count: 8, description: 'Inclui diagonais, em sentido normal.' },
  hard: { name: 'Difícil', size: 12, count: 10, description: 'Todas as direções, incluindo ao contrário.' },
};
export type Difficulty = keyof typeof levels;
export type Word = { label: string; cells: number[] };
export type Game = { difficulty: Difficulty; theme: string; grid: string[]; words: Word[]; found: number[]; elapsedMs: number };
export const themes = {
  'Taylor Swift': ['RED', 'FEARLESS', 'SPEAK NOW', 'REPUTATION', 'LOVER', 'FOLKLORE', 'EVERMORE', 'MIDNIGHTS', 'STYLE', 'KARMA', 'AUGUST', 'CARDIGAN', 'WILLOW', 'ENCHANTED', 'MAROON', 'LOVE STORY', 'BLANK SPACE', 'CRUEL SUMMER', 'ALL TOO WELL', 'LAVENDER HAZE', 'OPALITE', 'GLITTER', 'SCARF', 'RAIN', 'SPARKS', 'DREAMS', 'FOREVER'],
  Animais: ['LEÃO', 'GATO', 'PATO', 'URSO', 'LOBO', 'SAPO', 'TIGRE', 'ZEBRA', 'COELHO', 'GIRAFA', 'CAVALO', 'MACACO', 'BALEIA', 'TUCANO'],
  Alimentos: ['MAÇÃ', 'PERA', 'UVA', 'ARROZ', 'FEIJÃO', 'QUEIJO', 'BANANA', 'MELÃO', 'MANGA', 'BATATA', 'CENOURA', 'TOMATE', 'LARANJA', 'ABACAXI'],
  Natureza: ['SOL', 'LUA', 'RIO', 'MAR', 'FLOR', 'FOLHA', 'ÁRVORE', 'PEDRA', 'NUVEM', 'CHUVA', 'VENTO', 'AREIA', 'FLORESTA', 'MONTANHA'],
};
export const normalize = (word: string) => word.normalize('NFD').replace(/[\u0300-\u036f\s]/g, '');
export function directions(difficulty: Difficulty): number[][] {
  const forward = [[0, 1], [1, 0]];
  if (difficulty !== 'easy') forward.push([1, 1], [1, -1]);
  return difficulty === 'hard' ? [...forward, ...forward.map(([r, c]) => [-r, -c])] : forward;
}
export function selection(start: number, end: number, size: number): number[] {
  const row = Math.floor(end / size) - Math.floor(start / size);
  const col = end % size - start % size;
  if (row && col && Math.abs(row) !== Math.abs(col)) return [];
  return Array.from({ length: Math.max(Math.abs(row), Math.abs(col)) + 1 }, (_, i) => start + i * (Math.sign(row) * size + Math.sign(col)));
}
export function matchWord(game: Game, cells: number[]): number {
  if (cells.length < 2) return -1;
  const size = levels[game.difficulty].size;
  if (cells.some(i => !Number.isInteger(i) || i < 0 || i >= size * size)) return -1;
  const path = selection(cells[0], cells.at(-1)!, size);
  const dr = Math.sign(Math.floor(cells[1] / size) - Math.floor(cells[0] / size)), dc = Math.sign(cells[1] % size - cells[0] % size);
  if (path.length !== cells.length || !path.every((c, i) => c === cells[i]) || !directions(game.difficulty).some(([r, c]) => r === dr && c === dc)) return -1;
  const text = cells.map(i => game.grid[i]).join('');
  return game.words.findIndex((word, i) => !game.found.includes(i) && normalize(word.label) === text);
}
const randomIndex = (length: number) => Math.floor(Math.random() * length);
function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) { const j = randomIndex(i + 1); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function generateGame(difficulty: Difficulty, theme: keyof typeof themes): Game {
  const { size, count } = levels[difficulty];
  const labels = shuffle(themes[theme].filter(label => normalize(label).length <= size)).slice(0, count).sort((a, b) => normalize(b).length - normalize(a).length);
  for (let attempt = 0; attempt < 100; attempt++) {
    const grid: string[] = Array(size * size).fill('');
    const words: Word[] = [];
    for (const label of labels) {
      const text = normalize(label);
      const placements: number[][] = [];
      for (let start = 0; start < grid.length; start++) {
        for (const [dr, dc] of directions(difficulty)) {
          const r = Math.floor(start / size) + dr * (text.length - 1), c = start % size + dc * (text.length - 1);
          if (r < 0 || c < 0 || r >= size || c >= size) continue;
          const cells = selection(start, r * size + c, size);
          if (cells.every((cell, i) => !grid[cell] || grid[cell] === text[i])) placements.push(cells);
        }
      }
      if (!placements.length) break;
      const cells = placements[randomIndex(placements.length)];
      cells.forEach((cell, i) => { grid[cell] = text[i]; });
      words.push({ label, cells });
    }
    if (words.length === count) return { difficulty, theme, grid: grid.map(letter => letter || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[randomIndex(26)]), words: shuffle(words), found: [], elapsedMs: 0 };
  }
  throw new Error('Não foi possível criar a grade. Tente novamente.');
}
