export type Difficulty = 'easy' | 'medium' | 'hard';

export type Puzzle = {
  id: string;
  difficulty: Difficulty;
  puzzle: number[];
  solution: number[];
};
