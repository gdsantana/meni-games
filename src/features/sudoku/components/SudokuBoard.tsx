'use client';

import { useRef, type KeyboardEvent } from 'react';

type Props = {
  board: number[]; clues: number[]; notes: number[][]; selected: number | null;
  conflicts: number[]; onSelect: (index: number) => void; onInput: (value: number) => void;
  onErase: () => void; disabled: boolean;
};

export function SudokuBoard({ board, clues, notes, selected, conflicts, onSelect, onInput, onErase, disabled }: Props) {
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const chosen = selected === null ? 0 : board[selected];
  function keyboard(event: KeyboardEvent, index: number) {
    if (event.ctrlKey || event.metaKey || event.altKey || disabled) return;
    const moves: Record<string, number> = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 };
    if (event.key in moves) {
      event.preventDefault();
      const next = Math.max(0, Math.min(80, index + moves[event.key]));
      onSelect(next); cells.current[next]?.focus();
    } else if (/^[1-9]$/.test(event.key)) {
      event.preventDefault(); onInput(Number(event.key));
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault(); onErase();
    }
  }
  return <div className="sudoku-board" role="group" aria-label="Tabuleiro de Sudoku, 9 linhas e 9 colunas">
    {board.map((value, index) => {
      const row = Math.floor(index / 9), col = index % 9;
      const related = selected !== null && (row === Math.floor(selected / 9) || col === selected % 9 || (Math.floor(row / 3) === Math.floor(selected / 27) && Math.floor(col / 3) === Math.floor((selected % 9) / 3)));
      const conflict = conflicts.includes(index);
      return <button key={index} ref={element => { cells.current[index] = element; }} type="button"
        tabIndex={index === (selected ?? 0) ? 0 : -1} disabled={disabled}
        className={['sudoku-cell', clues[index] ? 'clue' : 'entry', related ? 'related' : '', chosen && value === chosen ? 'matching' : '', selected === index ? 'selected' : '', conflict ? 'conflict' : '', col === 2 || col === 5 ? 'box-right' : '', row === 2 || row === 5 ? 'box-bottom' : ''].join(' ')}
        aria-label={`Linha ${row + 1}, coluna ${col + 1}, ${value ? `número ${value}${clues[index] ? ', pista fixa' : ''}` : `vazia${notes[index]?.length ? `, notas ${notes[index].join(', ')}` : ''}`}${conflict ? ', conflito' : ''}`}
        aria-pressed={selected === index} onClick={() => onSelect(index)} onFocus={() => onSelect(index)} onKeyDown={event => keyboard(event, index)}>
        {value || <span className="cell-notes" aria-hidden="true">{Array.from({ length: 9 }, (_, n) => <span key={n}>{notes[index]?.includes(n + 1) ? n + 1 : ''}</span>)}</span>}
      </button>;
    })}
  </div>;
}
