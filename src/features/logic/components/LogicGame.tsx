'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Brain, Check, ChevronRight, Lightbulb, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { clueText, generateGame, isComplete, levels, solve, themes, type Difficulty, type Game, type Theme } from '../engine/game';
import { loadGame, saveGame } from '../storage/game-storage';
import './logic.css';

export function LogicGame() {
  const [game, setGame] = useState<Game | null>(null);
  const [ready, setReady] = useState(false);
  const [choosing, setChoosing] = useState(true);
  const [theme, setTheme] = useState<Theme>('classic');
  const [pending, setPending] = useState<Difficulty | null>(null);
  const [message, setMessage] = useState('');
  const [storageError, setStorageError] = useState('');
  const [victoryDismissed, setVictoryDismissed] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore localStorage only after hydration.
    try { setGame(loadGame()); } catch { setStorageError('O armazenamento está indisponível. Seu progresso pode não ser salvo.'); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || !game) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Show persistence failures in the UI.
    try { saveGame(game); } catch { setStorageError('Não foi possível salvar o progresso. Mantenha esta página aberta.'); }
  }, [game, ready]);

  function start(difficulty: Difficulty) {
    setGenerating(true); setMessage('');
    // Let the loading state paint before enumerating the possible arrangements.
    setTimeout(() => {
      try { setGame(generateGame(difficulty, theme)); setChoosing(false); setPending(null); setVictoryDismissed(false); }
      catch { setMessage('Não foi possível preparar o desafio. Tente novamente.'); }
      finally { setGenerating(false); }
    }, 30);
  }
  function answer(category: number, person: number, value: number) {
    if (!game || game.completed) return;
    setGame({ ...game, answers: game.answers.map((row, c) => c === category ? row.map((v, p) => p === person ? value : v) : row) });
    setMessage('');
  }
  function check() {
    if (!game) return;
    if (game.answers.some(row => row.includes(-1))) { setMessage('Escolha uma opção em cada campo antes de conferir.'); return; }
    if (isComplete(game.puzzle, game.answers)) { setGame({ ...game, completed: true }); setMessage('Todas as associações estão certas!'); }
    else setMessage('Ainda há associações que não respeitam as pistas ou valores repetidos. Revise com calma.');
  }
  function hint() {
    if (!game || game.completed) return;
    const solution = solve(game.puzzle)[0];
    for (let c = 0; c < solution.length; c++) {
      const person = solution[c].findIndex((value, p) => game.answers[c][p] !== value);
      if (person >= 0) {
        const value = solution[c][person];
        const answers = game.answers.map((row, category) => category === c ? row.map((v, p) => p === person ? value : v === value ? -1 : v) : row);
        const completed = isComplete(game.puzzle, answers);
        setGame({ ...game, answers, hints: game.hints + 1, completed });
        setMessage(`Dica: ${game.puzzle.people[person]} ${themes[game.puzzle.theme].categories[c].verb} ${themes[game.puzzle.theme].categories[c].values[value]}.`);
        return;
      }
    }
    check();
  }
  const scenario = game ? themes[game.puzzle.theme] : null;
  const filled = game?.answers.flat().filter(v => v !== -1).length ?? 0;
  const total = game?.answers.flat().length ?? 0;
  return <main className="logic-shell">
    <header className="logic-topbar"><Button variant="ghost" size="icon" asChild><Link href="/" aria-label="Voltar ao início"><ArrowLeft size={21} /></Link></Button><Link href="/" aria-label="Meni Games, início"><Image src="/brand/meni-games.webp" alt="Meni Games" width={2172} height={724} className="h-auto w-[160px]" priority /></Link><Brain size={21} aria-hidden="true" /></header>
    {storageError && <p className="logic-notice" role="status">{storageError}</p>}
    {!ready ? <p role="status">Preparando seu cantinho…</p> : choosing ? <section className="logic-intro">
      <div className="logic-symbol" aria-hidden="true"><Brain size={38} /></div><h1>Uma pista leva à outra.</h1><p>Leia, conecte e descubra quem é quem.</p>
      {game && !game.completed && <Button className="w-full mt-6" disabled={generating} onClick={() => { setChoosing(false); setMessage(''); }}>Continuar desafio · {levels[game.puzzle.difficulty].name}</Button>}
      <fieldset className="logic-themes"><legend>Escolha sua história</legend>{(Object.keys(themes) as Theme[]).map(id => <label key={id} className={theme === id ? 'logic-theme selected' : 'logic-theme'}><input type="radio" name="theme" value={id} checked={theme === id} disabled={generating} onChange={() => setTheme(id)} /><span><strong>{id === 'taylor' && <Sparkles size={16} aria-hidden="true" />}{themes[id].name}</strong><small>{themes[id].description}</small></span></label>)}</fieldset>
      {theme === 'taylor' && <p className="logic-fiction">Uma festa imaginária entre fãs. Os rumores são inventados para o jogo e não são notícias sobre Taylor Swift.</p>}
      <h2>Qual é o seu ritmo hoje?</h2><div className="logic-levels">{(Object.entries(levels) as [Difficulty, typeof levels.easy][]).map(([id, level]) => <button key={id} disabled={generating} onClick={() => game && !game.completed ? setPending(id) : start(id)}><span><strong>{level.name}</strong><small>{level.description}</small></span><ChevronRight size={19} /></button>)}</div><p className="logic-caption">Sem pressa. Seu progresso fica salvo neste navegador.</p>
    </section> : game && scenario && <section>
      <div className="logic-heading"><h1>Jogos de lógica</h1><span>{levels[game.puzzle.difficulty].name}</span></div><h2 className="logic-story">{scenario.name}</h2>
      {game.puzzle.theme === 'taylor' && <p className="logic-fiction">Fãs e fofocas fictícios. Nenhum rumor é uma afirmação sobre a vida real.</p>}
      <p className="logic-rules">Cada pessoa tem uma opção de cada categoria. Cada opção é usada uma única vez.</p>
      <details className="logic-help"><summary>Como jogar e interpretar as pistas</summary><p>Use as pistas para associar as opções a cada pessoa. Você pode tocar nas pistas para marcá-las como usadas.</p><p>“Se A, então B” significa que, quando A é verdadeiro, B também deve ser. Isso não garante que A aconteceu e não significa que B implica A.</p><p>“Ou A, ou B” significa que exatamente uma das duas afirmações é verdadeira. Ao terminar, toque em Conferir.</p></details>
      <h2 className="logic-section-title">As pistas <span>{game.puzzle.clues.length}</span></h2><ol className="logic-clues">{game.puzzle.clues.map((clue, index) => <li key={index}><button aria-pressed={game.crossed.includes(index)} className={game.crossed.includes(index) ? 'crossed' : ''} onClick={() => setGame({ ...game, crossed: game.crossed.includes(index) ? game.crossed.filter(i => i !== index) : [...game.crossed, index] })}><span className="logic-clue-number" aria-hidden="true">{game.crossed.includes(index) ? <Check size={15} /> : index + 1}</span><span>{clueText(game.puzzle, clue)}</span><span className="sr-only">{game.crossed.includes(index) ? 'Desmarcar pista usada' : 'Marcar pista como usada'}</span></button></li>)}</ol>
      <div className="logic-heading logic-answer-heading"><h2>Suas deduções</h2><span>{filled} de {total}</span></div>
      <div className="logic-answers">{game.puzzle.people.map((person, p) => <fieldset key={person}><legend>{person}</legend>{scenario.categories.slice(0, levels[game.puzzle.difficulty].categories).map((category, c) => <label key={category.name}><span>{category.name}</span><select value={game.answers[c][p]} disabled={game.completed} onChange={event => answer(c, p, Number(event.target.value))}><option value={-1}>Ainda não sei</option>{category.values.slice(0, levels[game.puzzle.difficulty].people).map((value, v) => <option key={value} value={v}>{value}</option>)}</select></label>)}</fieldset>)}</div>
      <div className="logic-actions"><Button variant="outline" disabled={game.completed} onClick={hint}><Lightbulb size={18} /> Dica</Button><Button disabled={game.completed} onClick={check}><Check size={18} /> Conferir</Button></div><Button variant="ghost" className="mx-auto flex mt-3" onClick={() => { setChoosing(true); setMessage(''); }}>Novo desafio</Button>
      {game.completed && <p className="logic-caption">Desafio concluído! {game.hints} dica(s) usada(s).</p>}
    </section>}
    <p className="logic-message" role="status" aria-live="polite">{generating ? 'Conectando as pistas…' : message}</p>
    <Dialog open={pending !== null} onOpenChange={open => { if (!open && !generating) setPending(null); }}><DialogContent><DialogHeader><DialogTitle>Trocar de desafio?</DialogTitle><DialogDescription>Seu desafio em andamento será substituído quando o novo estiver pronto.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={generating} onClick={() => setPending(null)}>Cancelar</Button><Button disabled={generating} onClick={() => pending && start(pending)}>{generating ? 'Preparando…' : 'Criar novo desafio'}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={!!game?.completed && !choosing && !victoryDismissed} onOpenChange={open => setVictoryDismissed(!open)}><DialogContent><DialogHeader><Sparkles className="mx-auto text-[#a45e77]" size={34} /><DialogTitle>Você conectou todas as pistas!</DialogTitle><DialogDescription>Todas as associações estão certas. {game?.hints} dica(s) usada(s).</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setVictoryDismissed(true)}>Ver minhas respostas</Button><Button onClick={() => { setChoosing(true); setVictoryDismissed(true); setMessage(''); }}>Jogar novamente</Button></DialogFooter></DialogContent></Dialog>
  </main>;
}
