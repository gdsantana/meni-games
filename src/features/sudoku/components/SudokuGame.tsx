'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Eraser, Lightbulb, LoaderCircle, Pause, Pencil, Play, Redo2, RotateCcw, Settings2, Sparkles, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSudokuGame } from '../hooks/useSudokuGame';
import { getConflicts } from '../engine/validator';
import type { Difficulty, Puzzle } from '../types/sudoku.types';
import { SudokuBoard } from './SudokuBoard';
import './sudoku.css';

const levels: { id: Difficulty; name: string; description: string; dots: number }[] = [
  { id: 'easy', name: 'Fácil', description: 'Para entrar no ritmo, uma casa de cada vez.', dots: 1 },
  { id: 'medium', name: 'Médio', description: 'Observe os detalhes e conecte as pistas.', dots: 2 },
  { id: 'hard', name: 'Difícil', description: 'Um desafio para pensar com calma.', dots: 3 },
];
const levelName = (difficulty: Difficulty) => levels.find(level => level.id === difficulty)!.name;
function formatTime(ms: number) {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

export function SudokuGame() {
  const { state, dispatch, start, restart, setHighlightMistakes, ready, storageError } = useSudokuGame();
  const [screen, setScreen] = useState<'select' | 'game'>('select');
  const [generating, setGenerating] = useState<Difficulty | null>(null);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(false);
  const [confirmation, setConfirmation] = useState<Difficulty | 'restart' | null>(null);
  const [victoryDismissed, setVictoryDismissed] = useState(false);
  const victory = state.status === 'completed' && screen === 'game' && !victoryDismissed;
  const worker = useRef<Worker | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { worker.current?.terminate(); if (timeout.current) clearTimeout(timeout.current); }, []);

  function generate(difficulty: Difficulty) {
    setConfirmation(null); setSettings(false); setError(''); setGenerating(difficulty);
    worker.current?.terminate();
    if (timeout.current) clearTimeout(timeout.current);
    try {
      const current = new Worker(new URL('../engine/generator.worker.ts', import.meta.url));
      worker.current = current;
      const finish = () => { current.terminate(); worker.current = null; if (timeout.current) clearTimeout(timeout.current); setGenerating(null); };
      current.onmessage = (event: MessageEvent<{ puzzle?: Puzzle; error?: string }>) => {
        finish();
        if (event.data.puzzle) { start(event.data.puzzle); setScreen('game'); setVictoryDismissed(false); }
        else setError(event.data.error || 'Não foi possível criar o jogo. Tente novamente.');
      };
      current.onerror = () => { finish(); setError('Não foi possível criar o jogo. Tente novamente.'); };
      timeout.current = setTimeout(() => { finish(); setError('Este desafio levou mais tempo que o esperado. Tente novamente.'); }, 45000);
      current.postMessage(difficulty);
    } catch { setGenerating(null); setError('Não foi possível iniciar o gerador. Recarregue a página e tente novamente.'); }
  }
  function requestGame(difficulty: Difficulty) {
    if (state.puzzle && state.status === 'playing') { dispatch({ type: 'pause' }); setConfirmation(difficulty); }
    else generate(difficulty);
  }
  const playing = screen === 'game' && state.puzzle;
  const blocked = state.paused || state.status !== 'playing' || Boolean(generating);
  const tools = [
    { name: 'Desfazer', Icon: Undo2, action: () => dispatch({ type: 'undo' }), disabled: !state.past.length },
    { name: 'Refazer', Icon: Redo2, action: () => dispatch({ type: 'redo' }), disabled: !state.future.length },
    { name: 'Apagar', Icon: Eraser, action: () => dispatch({ type: 'erase' }), disabled: state.selected === null || Boolean(state.puzzle?.puzzle[state.selected]) },
    { name: 'Anotações', Icon: Pencil, action: () => dispatch({ type: 'toggleNotes' }), active: state.notesMode },
    { name: 'Dica', Icon: Lightbulb, action: () => dispatch({ type: 'hint' }) },
  ];
  return <main className="sudoku-shell">
    <header className="game-topbar">
      <Link href="/" aria-label="Voltar ao início" className="icon-control"><ArrowLeft size={21} /></Link>
      <Link href="/" aria-label="Meni Games, início" className="game-brand"><Image src="/brand/meni-games.webp" alt="Meni Games" width={2172} height={724} className="h-auto w-[160px]" priority /></Link>
      <Button variant="ghost" size="icon" aria-label="Configurações" onClick={() => setSettings(true)}><Settings2 size={20} /></Button>
    </header>
    {!ready ? <p className="game-loading" role="status"><LoaderCircle className="spin" /> Preparando seu cantinho…</p> : <>
      {storageError && <p className="game-notice" role="status">{storageError}</p>}
      {!playing ? <section className="difficulty-screen">
        <div className="sudoku-symbol" aria-hidden="true">{[1, 0, 3, 0, 5, 0, 7, 0, 9].map((n, i) => <span key={i}>{n || <span className="symbol-dot" />}</span>)}</div>
        <h1>Um momento de Sudoku.</h1><p className="intro-copy">Respire fundo, escolha seu desafio<br />e encontre espaço para pensar.</p>
        {state.puzzle && state.status === 'playing' && <Button className="resume-button" onClick={() => { setScreen('game'); dispatch({ type: 'resume' }); }}><Play size={17} /> Continuar jogo <span>{levelName(state.puzzle.difficulty)}{state.showTimer && ` · ${formatTime(state.elapsedMs)}`}</span></Button>}
        <h2>Qual é o seu ritmo hoje?</h2>
        <div className="difficulty-list">{levels.map(level => <button key={level.id} className="difficulty-card" disabled={Boolean(generating)} onClick={() => requestGame(level.id)}>
          <span className="difficulty-dots" aria-hidden="true">{[1, 2, 3].map(n => <i key={n} className={n <= level.dots ? 'filled' : ''} />)}</span>
          <span><strong>{level.name}</strong><small>{level.description}</small></span><ChevronRight size={19} />
        </button>)}</div>
        <p className="quiet-caption">Sem pressa. Seu progresso fica salvo neste navegador.</p>
      </section> : <section className="active-game" aria-label="Jogo de Sudoku">
        <div className="game-heading"><h1>Sudoku</h1><span className="difficulty-badge">{levelName(state.puzzle!.difficulty)}</span>{state.showTimer && <div className="timer" aria-label={`Tempo ${formatTime(state.elapsedMs)}`}>{formatTime(state.elapsedMs)}</div>}<Button className={state.showTimer ? undefined : 'ml-auto'} variant="ghost" size="icon" aria-label={state.paused ? 'Retomar jogo' : 'Pausar jogo'} disabled={state.status === 'completed' || Boolean(generating)} onClick={() => dispatch({ type: state.paused ? 'resume' : 'pause' })}>{state.paused ? <Play size={18} /> : <Pause size={18} />}</Button></div>
        <div className="board-wrap">
          <SudokuBoard board={state.board} clues={state.puzzle!.puzzle} notes={state.notes} selected={state.selected} conflicts={state.highlightMistakes ? getConflicts(state.board) : []} onSelect={index => dispatch({ type: 'select', index })} onInput={value => dispatch({ type: 'input', value })} onErase={() => dispatch({ type: 'erase' })} disabled={blocked} />
          {state.paused && state.status === 'playing' && <div className="pause-cover"><Pause size={28} /><h2>Uma pausa faz bem.</h2><p>Seu jogo está guardado aqui.</p><Button onClick={() => dispatch({ type: 'resume' })}><Play size={17} /> Continuar</Button></div>}
        </div>
        <div className="game-tools">{tools.map(({ name, Icon, action, disabled, active }) => <button key={name} type="button" aria-label={name} aria-pressed={name === 'Anotações' ? active : undefined} className={active ? 'tool active' : 'tool'} disabled={blocked || disabled} onClick={action}><Icon size={21} /><span>{name}</span></button>)}</div>
        <div className="number-pad" aria-label="Teclado de números">{Array.from({ length: 9 }, (_, i) => <button type="button" key={i} disabled={blocked} aria-label={`${state.notesMode ? 'Anotar' : 'Inserir'} ${i + 1}`} onClick={() => dispatch({ type: 'input', value: i + 1 })}>{i + 1}</button>)}</div>
        <p className="mode-caption" role="status">{state.notesMode ? 'Modo anotações: marque os números possíveis.' : 'Selecione uma casa e escolha um número.'}</p>
        <Button variant="ghost" className="new-game-button" disabled={Boolean(generating)} onClick={() => { dispatch({ type: 'pause' }); setScreen('select'); }}>Novo jogo</Button>
      </section>}
      {error && <p className="game-error" role="alert">{error}</p>}
    </>}
    <Dialog open={Boolean(generating)}><DialogContent showCloseButton={false} onEscapeKeyDown={event => event.preventDefault()} onPointerDownOutside={event => event.preventDefault()}><DialogHeader><LoaderCircle className="spin dialog-symbol" /><DialogTitle>Preparando seu desafio</DialogTitle><DialogDescription>Escolhendo cada pista para um novo jogo {generating ? levelName(generating).toLowerCase() : ''}. Só um instante.</DialogDescription></DialogHeader></DialogContent></Dialog>
    <Dialog open={settings} onOpenChange={setSettings}><DialogContent><DialogHeader><DialogTitle>Do seu jeito</DialogTitle><DialogDescription>Pequenos ajustes para jogar com tranquilidade.</DialogDescription></DialogHeader><label className="setting-row"><span>Exibir tempo<small>Mostra o tempo decorrido da partida.</small></span><input type="checkbox" checked={state.showTimer} onChange={event => dispatch({ type: 'setShowTimer', value: event.target.checked })} /></label><label className="setting-row"><span>Destacar conflitos<small>Indica números repetidos na mesma região.</small></span><input type="checkbox" checked={state.highlightMistakes} onChange={event => setHighlightMistakes(event.target.checked)} /></label>{state.puzzle && <Button variant="outline" onClick={() => { setSettings(false); dispatch({ type: 'pause' }); setConfirmation('restart'); }}><RotateCcw size={17} /> Reiniciar este tabuleiro</Button>}<p className="keyboard-help">No teclado: use as setas para navegar, 1–9 para preencher e Delete para apagar.</p></DialogContent></Dialog>
    <Dialog open={confirmation !== null} onOpenChange={open => { if (!open) setConfirmation(null); }}><DialogContent><DialogHeader><DialogTitle>{confirmation === 'restart' ? 'Começar este jogo de novo?' : 'Trocar de desafio?'}</DialogTitle><DialogDescription>{confirmation === 'restart' ? 'O tabuleiro será o mesmo. Os números preenchidos, as anotações e o tempo serão apagados.' : 'Seu jogo em andamento será substituído quando o novo desafio estiver pronto.'}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setConfirmation(null)}>Cancelar</Button><Button onClick={() => { if (confirmation === 'restart') { restart(); setScreen('game'); setConfirmation(null); setVictoryDismissed(false); } else if (confirmation) generate(confirmation); }}>{confirmation === 'restart' ? 'Reiniciar' : 'Criar novo jogo'}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={victory} onOpenChange={open => setVictoryDismissed(!open)}><DialogContent><DialogHeader><div className="victory-symbol"><Sparkles size={30} /><Check size={22} /></div><DialogTitle>Você encontrou cada resposta!</DialogTitle><DialogDescription>Um desafio por vez, uma conquista sua.</DialogDescription></DialogHeader><div className="victory-stats"><span>Dificuldade<strong>{state.puzzle ? levelName(state.puzzle.difficulty) : ''}</strong></span>{state.showTimer && <span>Seu tempo<strong>{formatTime(state.elapsedMs)}</strong></span>}</div><DialogFooter><Button variant="outline" asChild><Link href="/">Voltar ao início</Link></Button><Button onClick={() => { setVictoryDismissed(false); setScreen('select'); }}>Jogar novamente</Button></DialogFooter></DialogContent></Dialog>
  </main>;
}
