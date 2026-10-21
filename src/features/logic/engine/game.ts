export const levels = {
  easy: { name: 'Fácil', people: 3, categories: 1, description: 'Três pessoas, uma categoria e pistas diretas.' },
  medium: { name: 'Médio', people: 4, categories: 2, description: 'Quatro pessoas e pistas que cruzam duas categorias.' },
  hard: { name: 'Difícil', people: 5, categories: 2, description: 'Cinco pessoas, condições e alternativas exclusivas.' },
};
export type Difficulty = keyof typeof levels;
export const themes = {
  classic: {
    name: 'Quem faz o quê?', description: 'Descubra a profissão e o transporte de cada pessoa.',
    categories: [
      { name: 'Profissão', verb: 'trabalha como', values: ['padeiro', 'motorista', 'jornalista', 'chef', 'artista'] },
      { name: 'Transporte', verb: 'vai de', values: ['bicicleta', 'ônibus', 'metrô', 'carro', 'moto'] },
    ],
  },
  taylor: {
    name: 'Taylor Swift: rumores na listening party', description: 'Quem escolheu cada álbum e espalhou cada fofoca na festa?',
    categories: [
      { name: 'Álbum favorito', verb: 'escolheu o álbum', values: ['Lover', 'folklore', 'Midnights', 'Reputation', 'Fearless'] },
      { name: 'Rumor da festa', verb: 'comentou sobre', values: ['um clipe secreto', 'uma participação surpresa', 'um álbum escondido', 'um show à meia-noite', 'uma pista no figurino'] },
    ],
  },
};
export type Theme = keyof typeof themes;
export type Atom = { person: number; category: number; value: number };
export type Clue = { kind: 'not'; a: Atom } | { kind: 'if' | 'xor'; a: Atom; b: Atom };
export type Puzzle = { difficulty: Difficulty; theme: Theme; people: string[]; clues: Clue[] };
export type Assignment = number[][];
export type Game = { puzzle: Puzzle; answers: Assignment; crossed: number[]; hints: number; completed: boolean };
export const names = ['Alex', 'Bia', 'Cris', 'Dani', 'Leo', 'Manu', 'Nina', 'Rafa'];
const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function assignments(difficulty: Difficulty): Assignment[] {
  const { people, categories } = levels[difficulty];
  const permutations: number[][] = [];
  function visit(values: number[]) {
    if (values.length === people) { permutations.push(values); return; }
    for (let i = 0; i < people; i++) if (!values.includes(i)) visit([...values, i]);
  }
  visit([]);
  return categories === 1 ? permutations.map(p => [p]) : permutations.flatMap(a => permutations.map(b => [a, b]));
}
export function satisfies(assignment: Assignment, clue: Clue): boolean {
  const a = assignment[clue.a.category][clue.a.person] === clue.a.value;
  if (clue.kind === 'not') return !a;
  const b = assignment[clue.b.category][clue.b.person] === clue.b.value;
  return clue.kind === 'if' ? !a || b : a !== b;
}
export function solve(puzzle: Puzzle): Assignment[] {
  return assignments(puzzle.difficulty).filter(a => puzzle.clues.every(c => satisfies(a, c)));
}
export function clueText(puzzle: Puzzle, clue: Clue): string {
  const atom = (a: Atom) => `${puzzle.people[a.person]} ${themes[puzzle.theme].categories[a.category].verb} ${themes[puzzle.theme].categories[a.category].values[a.value]}`;
  if (clue.kind === 'not') {
    const a = clue.a;
    return `${puzzle.people[a.person]} não ${themes[puzzle.theme].categories[a.category].verb} ${themes[puzzle.theme].categories[a.category].values[a.value]}.`;
  }
  return clue.kind === 'if' ? `Se ${atom(clue.a)}, então ${atom(clue.b)}.` : `Ou ${atom(clue.a)}, ou ${atom(clue.b)} — apenas uma dessas afirmações é verdadeira.`;
}
export function generateGame(difficulty: Difficulty, theme: Theme): Game {
  const { people, categories } = levels[difficulty];
  const all = assignments(difficulty), answer = pick(all);
  const atoms: Atom[] = [];
  for (let category = 0; category < categories; category++) for (let person = 0; person < people; person++) for (let value = 0; value < people; value++) atoms.push({ person, category, value });
  const truths = atoms.filter(a => answer[a.category][a.person] === a.value);
  const falsehoods = atoms.filter(a => answer[a.category][a.person] !== a.value);
  const a = pick(truths), b = pick(truths.filter(t => t.person !== a.person && (categories === 1 || t.category !== a.category)));
  const clues: Clue[] = [{ kind: 'if', a, b }];
  if (difficulty === 'hard') clues.push({ kind: 'xor', a: pick(truths), b: pick(falsehoods) });
  const required = clues.length;
  let remaining = all.filter(s => clues.every(c => satisfies(s, c)));
  while (remaining.length > 1) {
    let best: Clue | null = null, survivors = remaining;
    for (let attempt = 0; attempt < 32; attempt++) {
      const kinds: Clue['kind'][] = difficulty === 'hard' ? ['if', 'xor', 'not'] : ['if', 'not'];
      const kind = pick(kinds);
      const clue: Clue = kind === 'not' ? { kind, a: pick(falsehoods) } : kind === 'xor' ? { kind, a: pick(truths), b: pick(falsehoods) } : { kind, a: pick(atoms), b: pick(truths) };
      const next = remaining.filter(s => satisfies(s, clue));
      if (next.length < survivors.length) { best = clue; survivors = next; }
    }
    if (!best) {
      const other = remaining.find(s => s.some((row, c) => row.some((v, p) => v !== answer[c][p])))!;
      best = { kind: 'not', a: falsehoods.find(a => other[a.category][a.person] === a.value)! };
      survivors = remaining.filter(s => satisfies(s, best!));
    }
    clues.push(best); remaining = survivors;
  }
  for (let i = clues.length - 1; i >= required; i--) {
    const shorter = clues.filter((_, index) => index !== i);
    if (all.filter(s => shorter.every(c => satisfies(s, c))).length === 1) clues.splice(i, 1);
  }
  const puzzle: Puzzle = { difficulty, theme, people: shuffle(names).slice(0, people), clues: shuffle(clues) };
  return { puzzle, answers: Array.from({ length: categories }, () => Array(people).fill(-1)), crossed: [], hints: 0, completed: false };
}
export function isComplete(puzzle: Puzzle, answers: Assignment): boolean {
  const { people, categories } = levels[puzzle.difficulty];
  return answers.length === categories && answers.every(row => row.length === people && new Set(row).size === people && row.every(v => Number.isInteger(v) && v >= 0 && v < people)) && puzzle.clues.every(clue => satisfies(answers, clue));
}
