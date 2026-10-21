'use client';

import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import type { Puzzle } from '../types/sudoku.types';
import { createInitialState, gameReducer, type GameAction } from '../state/game-reducer';
import { loadSudokuState, restoredState, saveSudokuState } from '../storage/sudoku-storage';

export function useSudokuGame() {
  const [state, rawDispatch] = useReducer(gameReducer, undefined, createInitialState);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const stateRef = useRef(state);
  const baseMs = useRef(0);
  const startedAt = useRef<number | null>(null);
  useLayoutEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    try {
      const saved = loadSudokuState();
      const restored = restoredState(saved.game, saved.highlightMistakes, saved.showTimer);
      baseMs.current = restored.elapsedMs;
      rawDispatch({ type: 'restore', state: restored });
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is available only after hydration.
      setStorageError('Não foi possível acessar o armazenamento local.');
    } finally {
      setReady(true);
    }
  }, []);

  const currentElapsed = useCallback(() => baseMs.current + (startedAt.current === null ? 0 : performance.now() - startedAt.current), []);
  const dispatch = useCallback((action: GameAction) => {
    if (storageError) setStorageError(null);
    if (action.type === 'pause') {
      const elapsedMs = currentElapsed(); baseMs.current = elapsedMs; startedAt.current = null;
      rawDispatch({ type: 'tick', elapsedMs });
    } else if (action.type === 'resume') {
      if (stateRef.current.status === 'playing' && stateRef.current.paused) startedAt.current = document.visibilityState === 'hidden' ? null : performance.now();
    } else if (action.type === 'start' || action.type === 'restart') {
      baseMs.current = 0; startedAt.current = document.visibilityState === 'hidden' ? null : performance.now();
    } else if (action.type === 'tick') {
      baseMs.current = action.elapsedMs;
    }
    if (action.type !== 'tick' && action.type !== 'pause' && action.type !== 'resume' && action.type !== 'start' && action.type !== 'restart' && stateRef.current.status === 'playing' && gameReducer(stateRef.current, action).status === 'completed') {
      const elapsedMs = currentElapsed(); baseMs.current = elapsedMs; startedAt.current = null;
      rawDispatch({ type: 'tick', elapsedMs });
    }
    rawDispatch(action);
  }, [currentElapsed, storageError]);

  useEffect(() => {
    if (!ready || state.status !== 'playing' || state.paused) return;
    if (startedAt.current === null) startedAt.current = performance.now();
    const timer = window.setInterval(() => rawDispatch({ type: 'tick', elapsedMs: currentElapsed() }), 1000);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        const elapsedMs = currentElapsed(); baseMs.current = elapsedMs; startedAt.current = null;
        rawDispatch({ type: 'tick', elapsedMs });
      } else if (stateRef.current.status === 'playing' && !stateRef.current.paused && startedAt.current === null) {
        startedAt.current = performance.now();
      }
    };
    const onPageHide = () => {
      const current = stateRef.current;
      const elapsedMs = current.status === 'playing' && !current.paused ? currentElapsed() : current.elapsedMs;
      baseMs.current = elapsedMs; startedAt.current = null;
      try { saveSudokuState({ ...current, elapsedMs: Math.max(current.elapsedMs, elapsedMs) }); }
      catch { setStorageError('Não foi possível salvar o progresso neste dispositivo.'); }
      rawDispatch({ type: 'tick', elapsedMs });
    };
    const onPageShow = () => {
      if (document.visibilityState === 'visible' && stateRef.current.status === 'playing' && !stateRef.current.paused && startedAt.current === null) startedAt.current = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [ready, state.status, state.paused, currentElapsed]);

  useEffect(() => {
    if (!ready) return;
    try { saveSudokuState(state); }
    catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- report persistence failures to the game UI.
      setStorageError('Não foi possível salvar o progresso neste dispositivo.');
    }
  }, [ready, state]);

  const start = useCallback((puzzle: Puzzle) => dispatch({ type: 'start', puzzle }), [dispatch]);
  const restart = useCallback(() => dispatch({ type: 'restart' }), [dispatch]);
  const setHighlightMistakes = useCallback((value: boolean) => dispatch({ type: 'setHighlightMistakes', value }), [dispatch]);
  return { state, dispatch, start, restart, setHighlightMistakes, ready, storageError };
}
