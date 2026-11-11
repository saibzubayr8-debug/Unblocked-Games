import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sound } from '../utils/audio';
import { RotateCcw, Undo2, Trophy, Award } from 'lucide-react';

interface Game2048Props {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  isMuted?: boolean;
}

type Board = number[][];

export default function Game2048({ onScoreUpdate, onGameOver }: Game2048Props) {
  const [board, setBoard] = useState<Board>(() => getInitialBoard());
  const [history, setHistory] = useState<{ board: Board; score: number } | null>(null);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('2048_highscore') || '0', 10);
  });
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [won, setWon] = useState<boolean>(false);
  const [keepPlaying, setKeepPlaying] = useState<boolean>(false);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  function getInitialBoard(): Board {
    let b: Board = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    b = addRandomTile(b);
    b = addRandomTile(b);
    return b;
  }

  function addRandomTile(b: Board): Board {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return b;
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newBoard = b.map((row) => [...row]);
    newBoard[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  }

  const resetGame = () => {
    const initial = getInitialBoard();
    setBoard(initial);
    setScore(0);
    setHistory(null);
    setGameOver(false);
    setWon(false);
    setKeepPlaying(false);
    sound.playClick();
  };

  const undoMove = () => {
    if (!history) return;
    setBoard(history.board);
    setScore(history.score);
    setHistory(null);
    setGameOver(false);
    sound.playClick();
  };

  const slideAndMergeRow = (row: number[]): { newRow: number[]; gainedScore: number; merged: boolean } => {
    const filtered = row.filter((val) => val !== 0);
    let gainedScore = 0;
    let merged = false;
    const newRow: number[] = [];

    for (let i = 0; i < filtered.length; i++) {
      if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
        const val = filtered[i] * 2;
        newRow.push(val);
        gainedScore += val;
        merged = true;
        i++; // skip next tile
      } else {
        newRow.push(filtered[i]);
      }
    }

    while (newRow.length < 4) {
      newRow.push(0);
    }

    return { newRow, gainedScore, merged };
  };

  const moveLeft = (currentBoard: Board): { board: Board; scoreGained: number; changed: boolean; mergedAny: boolean } => {
    let scoreGained = 0;
    let changed = false;
    let mergedAny = false;
    const newBoard: Board = [];

    for (let r = 0; r < 4; r++) {
      const { newRow, gainedScore, merged } = slideAndMergeRow(currentBoard[r]);
      newBoard.push(newRow);
      scoreGained += gainedScore;
      if (merged) mergedAny = true;
      if (newRow.some((val, c) => val !== currentBoard[r][c])) {
        changed = true;
      }
    }

    return { board: newBoard, scoreGained, changed, mergedAny };
  };

  const rotateClockwise = (matrix: Board): Board => {
    const N = matrix.length;
    const result: Board = [];
    for (let r = 0; r < N; r++) {
      result.push([]);
      for (let c = 0; c < N; c++) {
        result[r].push(matrix[N - 1 - c][r]);
      }
    }
    return result;
  };

  const move = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down') => {
      if (gameOver) return;

      let b = board.map((row) => [...row]);
      let rotations = 0;

      if (direction === 'up') {
        b = rotateClockwise(rotateClockwise(rotateClockwise(b)));
        rotations = 1;
      } else if (direction === 'right') {
        b = rotateClockwise(rotateClockwise(b));
        rotations = 2;
      } else if (direction === 'down') {
        b = rotateClockwise(b);
        rotations = 3;
      }

      const { board: movedBoard, scoreGained, changed, mergedAny } = moveLeft(b);

      if (!changed) return;

      // Rotate back
      let finalBoard = movedBoard;
      for (let i = 0; i < (4 - rotations) % 4; i++) {
        finalBoard = rotateClockwise(finalBoard);
      }

      setHistory({ board: board.map((r) => [...r]), score });

      const boardWithNew = addRandomTile(finalBoard);
      const newScore = score + scoreGained;

      setBoard(boardWithNew);
      setScore(newScore);
      if (onScoreUpdate) onScoreUpdate(newScore);

      if (mergedAny) {
        sound.playHit(440);
      } else {
        sound.playClick();
      }

      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('2048_highscore', newScore.toString());
      }

      // Check win condition
      if (!won && !keepPlaying) {
        const has2048 = boardWithNew.some((row) => row.some((val) => val === 2048));
        if (has2048) {
          setWon(true);
          sound.playVictory();
        }
      }

      // Check Game Over
      if (isGameOver(boardWithNew)) {
        setGameOver(true);
        sound.playGameOver();
        if (onGameOver) onGameOver(newScore);
      }
    },
    [board, gameOver, won, keepPlaying, score, highScore, onScoreUpdate, onGameOver]
  );

  const isGameOver = (b: Board): boolean => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === 0) return false;
        if (c < 3 && b[r][c] === b[r][c + 1]) return false;
        if (r < 3 && b[r][c] === b[r + 1][c]) return false;
      }
    }
    return true;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') move('left');
      else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') move('right');
      else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') move('up');
      else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') move('down');
      else if (e.key.toLowerCase() === 'z') undoMove();
      else if (e.key.toLowerCase() === 'r') resetGame();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 30) {
      if (absX > absY) {
        move(dx > 0 ? 'right' : 'left');
      } else {
        move(dy > 0 ? 'down' : 'up');
      }
    }
    touchStartRef.current = null;
  };

  const getTileStyles = (val: number): string => {
    switch (val) {
      case 2:
        return 'bg-slate-700 text-slate-100';
      case 4:
        return 'bg-amber-900/60 text-amber-200 border border-amber-700/50';
      case 8:
        return 'bg-amber-600 text-white shadow-md shadow-amber-600/30';
      case 16:
        return 'bg-orange-600 text-white shadow-md shadow-orange-600/30';
      case 32:
        return 'bg-rose-600 text-white shadow-md shadow-rose-600/30';
      case 64:
        return 'bg-red-600 text-white shadow-lg shadow-red-600/40 font-bold';
      case 128:
        return 'bg-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/50 font-extrabold text-2xl';
      case 256:
        return 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50 font-extrabold text-2xl';
      case 512:
        return 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/50 font-extrabold text-2xl';
      case 1024:
        return 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/60 font-extrabold text-xl';
      case 2048:
        return 'bg-fuchsia-600 text-white shadow-2xl shadow-fuchsia-600/80 font-black text-xl animate-pulse';
      default:
        return val > 2048
          ? 'bg-purple-900 text-amber-300 shadow-2xl font-black text-lg'
          : 'bg-slate-800/40 text-transparent';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full select-none">
      {/* Top Header stats & Controls */}
      <div className="flex items-center justify-between w-full max-w-[420px] mb-4 px-2">
        <div>
          <h2 className="text-3xl font-black font-arcade text-amber-400 tracking-wider">2048</h2>
          <p className="text-xs text-slate-400">Join the numbers to get to 2048!</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-center min-w-[70px]">
            <div className="text-[10px] text-slate-400 uppercase font-medium">Score</div>
            <div className="text-lg font-bold font-arcade text-emerald-400">{score}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-center min-w-[70px]">
            <div className="text-[10px] text-slate-400 uppercase font-medium">Best</div>
            <div className="text-lg font-bold font-arcade text-amber-400">{highScore}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between w-full max-w-[420px] mb-3 px-2">
        <div className="text-xs text-slate-400">Use arrow keys, WASD, or swipe</div>
        <div className="flex items-center gap-2">
          <button
            onClick={undoMove}
            disabled={!history}
            className={`px-2.5 py-1 text-xs rounded-lg flex items-center gap-1 transition-all ${
              history
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-slate-900/50 text-slate-600 border border-slate-900 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" /> Undo
          </button>
          <button
            onClick={resetGame}
            className="px-2.5 py-1 text-xs rounded-lg flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> New Game
          </button>
        </div>
      </div>

      {/* Board Matrix */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative bg-slate-900/95 border-2 border-slate-800 rounded-2xl p-3 shadow-2xl w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] md:w-[420px] md:h-[420px]"
      >
        <div className="grid grid-cols-4 grid-rows-4 gap-2.5 w-full h-full">
          {board.map((row, r) =>
            row.map((val, c) => (
              <div
                key={`${r}-${c}`}
                className={`flex items-center justify-center rounded-xl text-2xl font-bold font-arcade transition-all duration-100 ${getTileStyles(
                  val
                )}`}
              >
                {val > 0 ? val : ''}
              </div>
            ))
          )}
        </div>

        {/* Win Overlay */}
        {won && !keepPlaying && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <Trophy className="w-16 h-16 text-amber-400 mb-2 animate-bounce" />
            <h3 className="text-3xl font-extrabold font-arcade text-amber-400 mb-2">YOU WIN!</h3>
            <p className="text-sm text-slate-300 mb-6">You unlocked the 2048 tile!</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setKeepPlaying(true)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm border border-slate-700"
              >
                Keep Going
              </button>
              <button
                onClick={resetGame}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/25"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <h3 className="text-3xl font-extrabold font-arcade text-rose-400 mb-2">NO MORE MOVES</h3>
            <div className="text-sm text-slate-300 mb-4">Final Score: <span className="font-bold font-arcade text-emerald-400 text-lg">{score}</span></div>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/30 flex items-center gap-2 transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
