import React, { useState, useEffect, useCallback } from 'react';
import { sound } from '../utils/audio';
import { Flag, Bomb, RotateCcw, Clock, Smile, Frown, Meh } from 'lucide-react';

interface MinesweeperGameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  isMuted?: boolean;
}

interface Cell {
  r: number;
  c: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

export default function MinesweeperGame({ onScoreUpdate }: MinesweeperGameProps) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium'>('easy');
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [flagMode, setFlagMode] = useState<boolean>(false);
  const [time, setTime] = useState<number>(0);
  const [flagsLeft, setFlagsLeft] = useState<number>(10);

  const ROWS = difficulty === 'easy' ? 9 : 14;
  const COLS = difficulty === 'easy' ? 9 : 14;
  const MINES = difficulty === 'easy' ? 10 : 30;

  const initEmptyBoard = useCallback(() => {
    const grid: Cell[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < COLS; c++) {
        row.push({
          r,
          c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0,
        });
      }
      grid.push(row);
    }
    return grid;
  }, [ROWS, COLS]);

  const resetGame = useCallback(() => {
    setBoard(initEmptyBoard());
    setGameState('idle');
    setTime(0);
    setFlagsLeft(MINES);
    sound.playClick();
  }, [initEmptyBoard, MINES]);

  useEffect(() => {
    resetGame();
  }, [difficulty, resetGame]);

  // Timer tick
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing') {
      timer = setInterval(() => {
        setTime((t) => Math.min(999, t + 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  const populateMines = (firstR: number, firstC: number, currentBoard: Cell[][]) => {
    const newBoard = currentBoard.map((row) => row.map((cell) => ({ ...cell })));
    let planted = 0;

    while (planted < MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);

      // Do not plant on or around first click
      const isAroundFirst = Math.abs(r - firstR) <= 1 && Math.abs(c - firstC) <= 1;
      if (!newBoard[r][c].isMine && !isAroundFirst) {
        newBoard[r][c].isMine = true;
        planted++;
      }
    }

    // Calculate adjacent counts
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!newBoard[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && newBoard[nr][nc].isMine) {
                count++;
              }
            }
          }
          newBoard[r][c].adjacentMines = count;
        }
      }
    }

    return newBoard;
  };

  const revealCell = (r: number, c: number, currentBoard: Cell[][]): Cell[][] => {
    const newBoard = currentBoard.map((row) => row.map((cell) => ({ ...cell })));

    const flood = (cr: number, cc: number) => {
      if (cr < 0 || cr >= ROWS || cc < 0 || cc >= COLS) return;
      const cell = newBoard[cr][cc];
      if (cell.isRevealed || cell.isFlagged || cell.isMine) return;

      cell.isRevealed = true;

      if (cell.adjacentMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            flood(cr + dr, cc + dc);
          }
        }
      }
    };

    flood(r, c);
    return newBoard;
  };

  const handleClickCell = (r: number, c: number) => {
    if (gameState === 'won' || gameState === 'lost') return;

    if (flagMode) {
      handleToggleFlag(r, c);
      return;
    }

    let currentBoard = board;
    if (gameState === 'idle') {
      currentBoard = populateMines(r, c, board);
      setGameState('playing');
    }

    const cell = currentBoard[r][c];
    if (cell.isFlagged || cell.isRevealed) return;

    if (cell.isMine) {
      // Game Over: reveal all mines
      const revealedMines = currentBoard.map((row) =>
        row.map((cl) => ({
          ...cl,
          isRevealed: cl.isRevealed || cl.isMine,
        }))
      );
      setBoard(revealedMines);
      setGameState('lost');
      sound.playExplosion();
      return;
    }

    // Reveal safely
    const updated = revealCell(r, c, currentBoard);
    setBoard(updated);
    sound.playHit(400);

    // Check Win
    let unrevealedSafe = 0;
    for (let row of updated) {
      for (let cl of row) {
        if (!cl.isMine && !cl.isRevealed) {
          unrevealedSafe++;
        }
      }
    }

    if (unrevealedSafe === 0) {
      setGameState('won');
      sound.playVictory();
      if (onScoreUpdate) onScoreUpdate(1000 - time * 2);
    }
  };

  const handleToggleFlag = (r: number, c: number, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (gameState === 'won' || gameState === 'lost') return;
    if (board[r][c].isRevealed) return;

    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
    const target = newBoard[r][c];

    if (target.isFlagged) {
      target.isFlagged = false;
      setFlagsLeft((prev) => prev + 1);
    } else {
      if (flagsLeft > 0) {
        target.isFlagged = true;
        setFlagsLeft((prev) => prev - 1);
        sound.playClick();
      }
    }
    setBoard(newBoard);
  };

  const getNumberColor = (num: number) => {
    switch (num) {
      case 1: return 'text-blue-400';
      case 2: return 'text-emerald-400';
      case 3: return 'text-rose-400';
      case 4: return 'text-indigo-400';
      case 5: return 'text-amber-500';
      case 6: return 'text-teal-400';
      default: return 'text-purple-400';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full select-none">
      {/* Top Controls HUD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl max-w-[460px] w-full">
        <div className="flex items-center justify-between mb-3 px-2">
          {/* Mine counter */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-arcade text-rose-400 font-bold text-xl min-w-[70px] justify-center">
            <Bomb className="w-4 h-4 text-rose-500" />
            {flagsLeft.toString().padStart(2, '0')}
          </div>

          {/* Reset Smiley Face */}
          <button
            onClick={resetGame}
            className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center shadow active:scale-95 transition-transform"
          >
            {gameState === 'lost' ? (
              <Frown className="w-6 h-6 text-rose-400" />
            ) : gameState === 'won' ? (
              <Smile className="w-6 h-6 text-emerald-400 animate-bounce" />
            ) : (
              <Meh className="w-6 h-6 text-amber-400" />
            )}
          </button>

          {/* Timer */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-arcade text-amber-400 font-bold text-xl min-w-[70px] justify-center">
            <Clock className="w-4 h-4 text-amber-500" />
            {time.toString().padStart(3, '0')}
          </div>
        </div>

        {/* Action Toggle bar */}
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDifficulty('easy')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                difficulty === 'easy' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Easy (9x9)
            </button>
            <button
              onClick={() => setDifficulty('medium')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                difficulty === 'medium' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Medium (14x14)
            </button>
          </div>

          <button
            onClick={() => setFlagMode(!flagMode)}
            className={`px-3 py-1 text-xs rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              flagMode
                ? 'bg-rose-500 text-slate-950 font-bold shadow-md shadow-rose-500/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Flag className="w-3.5 h-3.5" /> {flagMode ? 'Flag Mode: ON' : 'Flag Mode: OFF'}
          </button>
        </div>

        {/* Board Grid */}
        <div
          className="grid gap-1 p-2 bg-slate-950 rounded-xl border border-slate-800 mx-auto justify-center"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            maxWidth: difficulty === 'easy' ? '340px' : '440px',
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleClickCell(r, c)}
                onContextMenu={(e) => handleToggleFlag(r, c, e)}
                className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center font-bold text-sm rounded transition-colors ${
                  cell.isRevealed
                    ? cell.isMine
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-900 text-slate-200 border border-slate-800/80'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/60 shadow-sm active:bg-slate-600'
                }`}
              >
                {cell.isRevealed ? (
                  cell.isMine ? (
                    <Bomb className="w-4 h-4" />
                  ) : cell.adjacentMines > 0 ? (
                    <span className={getNumberColor(cell.adjacentMines)}>{cell.adjacentMines}</span>
                  ) : null
                ) : cell.isFlagged ? (
                  <Flag className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                ) : null}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
