import { WordSearchGame } from '@/features/word-search/components/WordSearchGame';

export const metadata = { title: 'Caça-palavras | Meni Games', description: 'Encontre palavras em três dificuldades e temas variados. Jogue no celular com progresso salvo.' };

export default function WordSearchPage() {
  return <WordSearchGame />;
}
