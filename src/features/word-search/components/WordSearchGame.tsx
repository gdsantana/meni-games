'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { ArrowLeft, Check, ChevronRight, Lightbulb, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { generateGame, levels, matchWord, selection, themes, type Difficulty, type Game } from '../engine/game';
import { loadGame, saveGame } from '../storage/game-storage';
import './word-search.css';

export function WordSearchGame() {
  const [game, setGame] = useState<Game | null>(null);
  const [ready, setReady] = useState(false);
  const [choosing, setChoosing] = useState(true);
  const [theme, setTheme] = useState<keyof typeof themes>('Animais');
  const [pending, setPending] = useState<Difficulty | null>(null);
  const [path, setPath] = useState<number[]>([]);
  const [anchor, setAnchor] = useState<number | null>(null);
  const [hint, setHint] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [storageError, setStorageError] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const board = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ pointer: number; start: number; end: number; moved: boolean; direction: [number, number] | null } | null>(null);
  const complete = !!game && game.found.length === game.words.length;
  const hasGame = game !== null;
  const size = game ? levels[game.difficulty].size : 8;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore browser storage after hydration.
    try { setGame(loadGame()); } catch { setStorageError('O armazenamento está indisponível. Seu progresso pode não ser salvo.'); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || !game) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Report storage failures to the player.
    try { saveGame(game); } catch { setStorageError('Não foi possível salvar. Mantenha esta página aberta para continuar a partida.'); }
  }, [game, ready]);
  useEffect(() => {
    if (choosing || !hasGame || complete) return;
    let previous = Date.now();
    const visibility = () => { previous = Date.now(); };
    document.addEventListener('visibilitychange', visibility);
    const timer = setInterval(() => {
      const now = Date.now();
      if (document.visibilityState === 'visible') setGame(current => current ? { ...current, elapsedMs: current.elapsedMs + now - previous } : current);
      previous = now;
    }, 1000);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visibility); };
  }, [choosing, hasGame, complete]);

  function start(difficulty: Difficulty) {
    try {
      setGame(generateGame(difficulty, theme)); setChoosing(false); setPending(null); setPath([]); setAnchor(null); setHint(null); setDismissed(false); setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível criar o jogo.'); }
  }
  function submit(cells: number[]) {
    if (!game || complete) return;
    const index = matchWord(game, cells);
    if (index >= 0) {
      setGame(current => current && !current.found.includes(index) ? { ...current, words: current.words.map((word, i) => i === index ? { ...word, cells } : word), found: [...current.found, index] } : current);
      setMessage(`${game.words[index].label} encontrada!`); setHint(null);
    } else setMessage('Essa seleção não é uma palavra pendente. Tente novamente.');
    setPath([]); setAnchor(null);
  }
  function activate(index: number) {
    if (complete) return;
    if (anchor === null) { setAnchor(index); setPath([index]); setMessage('Agora selecione a última letra. Escape cancela.'); }
    else if (anchor === index) { setAnchor(null); setPath([]); }
    else submit(selection(anchor, index, size));
  }
  function cellAt(event: PointerEvent): number | null {
    const rect = board.current!.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientY < rect.top || event.clientX >= rect.right || event.clientY >= rect.bottom) return null;
    return Math.floor((event.clientY - rect.top) / rect.height * size) * size + Math.floor((event.clientX - rect.left) / rect.width * size);
  }
  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (complete || !event.isPrimary || event.button !== 0) return;
    const cell = cellAt(event); if (cell === null) return;
    gesture.current = { pointer: event.pointerId, start: cell, end: cell, moved: false, direction: null };
    event.currentTarget.setPointerCapture(event.pointerId);
    setPath([cell]);
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g || g.pointer !== event.pointerId) return;
    const cell = cellAt(event); if (cell === null) return;
    if (cell === g.start) { g.end = cell; setPath([cell]); return; }
    g.moved = true;
    const dr = Math.floor(cell / size) - Math.floor(g.start / size), dc = cell % size - g.start % size;
    if (!g.direction) g.direction = Math.abs(dr) > Math.abs(dc) * 2 ? [Math.sign(dr), 0] : Math.abs(dc) > Math.abs(dr) * 2 ? [0, Math.sign(dc)] : [Math.sign(dr), Math.sign(dc)];
    const [r, c] = g.direction;
    const distance = Math.max(0, Math.round((dr * r + dc * c) / (r * r + c * c)));
    const row = Math.floor(g.start / size) + distance * r, col = g.start % size + distance * c;
    if (row < 0 || col < 0 || row >= size || col >= size) return;
    g.end = row * size + col; setPath(selection(g.start, g.end, size));
  }
  function pointerUp(event: PointerEvent<HTMLDivElement>) {
    const g = gesture.current; if (!g || g.pointer !== event.pointerId) return;
    gesture.current = null;
    if (g.moved) submit(selection(g.start, g.end, size)); else activate(g.start);
  }
  function keyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'Escape') { setAnchor(null); setPath([]); }
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -size, ArrowDown: size };
    if (event.key in offsets) {
      event.preventDefault();
      const next = index + offsets[event.key];
      if (next >= 0 && next < size * size) board.current?.querySelectorAll('button')[next]?.focus();
    }
  }
  const foundCells = new Set(game?.found.flatMap(i => game.words[i].cells));
  const minutes = Math.floor((game?.elapsedMs ?? 0) / 60000);
  const seconds = Math.floor((game?.elapsedMs ?? 0) / 1000) % 60;

  return <main className="ws-shell">
    <header className="ws-topbar"><Button variant="ghost" size="icon" asChild><Link href="/" aria-label="Voltar ao início"><ArrowLeft size={21} /></Link></Button><Link href="/" aria-label="Meni Games, início"><Image src="/brand/meni-games.webp" alt="Meni Games" width={2172} height={724} className="h-auto w-[160px]" priority /></Link><Search size={20} aria-hidden="true" /></header>
    {storageError && <p className="ws-notice" role="status">{storageError}</p>}
    {!ready ? <p role="status">Preparando seu cantinho…</p> : choosing ? <section className="ws-intro">
      <div className="ws-symbol" aria-hidden="true"><Search size={38} /></div>
      <h1>Um momento de caça-palavras.</h1><p>Encontre palavras e um tempinho para você.</p>
      {game && !complete && <Button className="w-full mt-6" onClick={() => { setChoosing(false); setMessage(''); }}>Continuar jogo · {levels[game.difficulty].name}</Button>}
      <label className="ws-theme">Escolha um tema<select value={theme} onChange={e => setTheme(e.target.value as keyof typeof themes)}>{Object.keys(themes).map(name => <option key={name}>{name}</option>)}</select></label>
      <h2>Qual é o seu ritmo hoje?</h2><div className="ws-levels">{(Object.entries(levels) as [Difficulty, typeof levels.easy][]).map(([id, level]) => <button className="ws-level" key={id} onClick={() => game && !complete ? setPending(id) : start(id)}><span><strong>{level.name} <small>{level.size} × {level.size} · {level.count} palavras</small></strong><span>{level.description}</span></span><ChevronRight size={20} /></button>)}</div>
      <p className="ws-caption">Sem pressa. Seu progresso fica salvo neste navegador.</p>
    </section> : game && <section>
      <div className="ws-heading"><h1>Caça-palavras</h1><span>{levels[game.difficulty].name}</span></div>
      <div className="ws-progress"><span>{game.theme}</span><span>{game.found.length} de {game.words.length} palavras</span></div>
      <p id="ws-help" className="ws-caption">Arraste pelas letras ou toque na primeira e na última.<br />Na grade, as palavras aparecem sem acentos ou espaços.</p>
      <div ref={board} className="ws-board" role="group" aria-label="Grade de caça-palavras" aria-describedby="ws-help" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={() => { gesture.current = null; setPath([]); setAnchor(null); }} onLostPointerCapture={() => { gesture.current = null; }}>
        {game.grid.map((letter, index) => <button type="button" key={index} disabled={complete} aria-label={`${letter}, linha ${Math.floor(index / size) + 1}, coluna ${index % size + 1}${foundCells.has(index) ? ', encontrada' : ''}${hint === index ? ', dica' : ''}`} aria-pressed={path.includes(index)} className={`ws-cell${foundCells.has(index) ? ' ws-found' : ''}${path.includes(index) ? ' ws-selected' : ''}${hint === index ? ' ws-hint' : ''}`} onClick={event => { if (event.detail === 0) activate(index); }} onKeyDown={event => keyboard(event, index)}>{letter}</button>)}
      </div>
      <ul className="ws-words" aria-label="Palavras para encontrar">{game.words.map((word, index) => <li key={word.label} className={game.found.includes(index) ? 'ws-word-found' : ''}>{game.found.includes(index) && <Check size={14} aria-hidden="true" />}<span>{word.label}</span>{game.found.includes(index) && <span className="sr-only"> encontrada</span>}</li>)}</ul>
      <div className="ws-actions"><Button variant="outline" disabled={complete} onClick={() => { const word = game.words.find((_, i) => !game.found.includes(i)); if (word) { setHint(word.cells[0]); setMessage(`Dica: a primeira letra de ${word.label} está marcada na grade.`); } }}><Lightbulb size={18} /> Dica</Button><Button variant="ghost" onClick={() => { setChoosing(true); setPath([]); setAnchor(null); setMessage(''); }}>Novo jogo</Button></div>
      {complete && <p className="ws-caption">Todas as palavras encontradas! Seu tempo: {minutes}min {seconds}s.</p>}
    </section>}
    <p role="status" aria-live="polite" className="ws-message">{message}</p>
    <Dialog open={pending !== null} onOpenChange={open => { if (!open) setPending(null); }}><DialogContent><DialogHeader><DialogTitle>Trocar de desafio?</DialogTitle><DialogDescription>Seu jogo em andamento será substituído pelo novo caça-palavras.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setPending(null)}>Cancelar</Button><Button onClick={() => pending && start(pending)}>Criar novo jogo</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={complete && !choosing && !dismissed} onOpenChange={open => setDismissed(!open)}><DialogContent><DialogHeader><Sparkles className="mx-auto text-[#8779b6]" size={34} /><DialogTitle>Você encontrou todas as palavras!</DialogTitle><DialogDescription>Uma pausa, várias descobertas. {levels[game?.difficulty ?? 'easy'].name} · {minutes}min {seconds}s.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" asChild><Link href="/">Voltar ao início</Link></Button><Button onClick={() => { setDismissed(true); setChoosing(true); }}>Jogar novamente</Button></DialogFooter></DialogContent></Dialog>
  </main>;
}
