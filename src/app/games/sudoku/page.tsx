import { SudokuGame } from '@/features/sudoku/components/SudokuGame';

export const metadata = { title: 'Sudoku | Meni Games', description: 'Uma pausa para exercitar a mente. Sudoku gratuito, com três dificuldades e progresso salvo.' };

export default function SudokuPage() {
  return <SudokuGame />;
}
