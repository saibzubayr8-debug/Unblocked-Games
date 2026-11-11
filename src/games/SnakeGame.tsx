import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from '../utils/audio';
import { Play, RotateCcw, Volume2, VolumeX, ShieldAlert, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface SnakeGameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  isMuted?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export default function SnakeGame({ onScoreUpdate, onGameOver, isMuted = false }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('snake_highscore') || '0', 10);
  });
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle');
  const [speed, setSpeed] = useState<'normal' | 'fast' | 'turbo'>('normal');
  const [wrapWalls, setWrapWalls] = useState<boolean>(true);

  // Game internal state
  const snakeRef = useRef<Point[]>([
    { x: 12, y: 12 },
    { x: 12, y: 13 },
    { x: 12, y: 14 },
  ]);
  const directionRef = useRef<Point>({ x: 0, y: -1 });
  const nextDirectionRef = useRef<Point>({ x: 0, y: -1 });
  const foodRef = useRef<Point>({ x: 6, y: 6 });
  const bonusFoodRef = useRef<{ x: number; y: number; timer: number } | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);
  const moveTimerRef = useRef<number>(0);

  const GRID_SIZE = 24;

  const getSpeedInterval = useCallback(() => {
    if (speed === 'normal') return 110;
    if (speed === 'fast') return 80;
    return 55;
  }, [speed]);

  const spawnFood = useCallback(() => {
    const snake = snakeRef.current;
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const onSnake = snake.some((seg) => seg.x === newFood.x && seg.y === newFood.y);
      if (!onSnake) break;
    }
    foodRef.current = newFood;

    // Chance to spawn golden bonus food every few regular foods
    if (Math.random() < 0.28 && !bonusFoodRef.current) {
      bonusFoodRef.current = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
        timer: 100, // frames remaining
      };
    }
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speedVal = Math.random() * 2 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speedVal,
        vy: Math.sin(angle) * speedVal,
        alpha: 1,
        color,
      });
    }
  };

  const resetGame = () => {
    snakeRef.current = [
      { x: 12, y: 12 },
      { x: 12, y: 13 },
      { x: 12, y: 14 },
    ];
    directionRef.current = { x: 0, y: -1 };
    nextDirectionRef.current = { x: 0, y: -1 };
    particlesRef.current = [];
    bonusFoodRef.current = null;
    setScore(0);
    spawnFood();
    setGameState('playing');
  };

  const handleGameOver = () => {
    setGameState('gameover');
    sound.playGameOver();
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snake_highscore', score.toString());
      sound.playVictory();
    }
    if (onGameOver) onGameOver(score);
  };

  const changeDirection = (dx: number, dy: number) => {
    const current = directionRef.current;
    if (dx !== 0 && current.x !== 0) return; // Prevent 180 reverse
    if (dy !== 0 && current.y !== 0) return;
    nextDirectionRef.current = { x: dx, y: dy };
    sound.playClick();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        changeDirection(0, -1);
      } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
        changeDirection(0, 1);
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        changeDirection(-1, 0);
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        changeDirection(1, 0);
      } else if (e.key.toLowerCase() === 'p') {
        setGameState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
      } else if (e.key === ' ' && gameState === 'idle') {
        resetGame();
      } else if (e.key === ' ' && gameState === 'gameover') {
        resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = (time: number) => {
      const delta = time - (lastTimeRef.current || time);
      lastTimeRef.current = time;

      const cellSize = canvas.width / GRID_SIZE;

      // Update game physics on interval
      if (gameState === 'playing') {
        moveTimerRef.current += delta;
        if (moveTimerRef.current >= getSpeedInterval()) {
          moveTimerRef.current = 0;
          directionRef.current = nextDirectionRef.current;

          const head = { ...snakeRef.current[0] };
          head.x += directionRef.current.x;
          head.y += directionRef.current.y;

          // Wall handling
          if (wrapWalls) {
            if (head.x < 0) head.x = GRID_SIZE - 1;
            if (head.x >= GRID_SIZE) head.x = 0;
            if (head.y < 0) head.y = GRID_SIZE - 1;
            if (head.y >= GRID_SIZE) head.y = 0;
          } else {
            if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
              handleGameOver();
              return;
            }
          }

          // Self collision
          const selfHit = snakeRef.current.slice(0, -1).some((seg) => seg.x === head.x && seg.y === head.y);
          if (selfHit) {
            handleGameOver();
            return;
          }

          snakeRef.current.unshift(head);

          // Check standard food
          if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
            const nextScore = score + 10;
            setScore(nextScore);
            if (onScoreUpdate) onScoreUpdate(nextScore);
            sound.playPoint();
            spawnParticles((head.x + 0.5) * cellSize, (head.y + 0.5) * cellSize, '#10b981', 12);
            spawnFood();
          } else if (
            bonusFoodRef.current &&
            head.x === bonusFoodRef.current.x &&
            head.y === bonusFoodRef.current.y
          ) {
            const nextScore = score + 50;
            setScore(nextScore);
            if (onScoreUpdate) onScoreUpdate(nextScore);
            sound.playVictory();
            spawnParticles((head.x + 0.5) * cellSize, (head.y + 0.5) * cellSize, '#fbbf24', 20);
            bonusFoodRef.current = null;
          } else {
            snakeRef.current.pop();
          }

          // Bonus food countdown
          if (bonusFoodRef.current) {
            bonusFoodRef.current.timer -= 1;
            if (bonusFoodRef.current.timer <= 0) {
              bonusFoodRef.current = null;
            }
          }
        }
      }

      // Drawing routine
      ctx.fillStyle = '#080d1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid background dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          ctx.fillRect(x * cellSize + cellSize / 2 - 1, y * cellSize + cellSize / 2 - 1, 2, 2);
        }
      }

      // Border walls if not wrapped
      if (!wrapWalls) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
      }

      // Food
      const fx = foodRef.current.x * cellSize;
      const fy = foodRef.current.y * cellSize;
      ctx.save();
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(fx + cellSize / 2, fy + cellSize / 2, cellSize * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Bonus Food (pulsing star)
      if (bonusFoodRef.current) {
        const bfx = bonusFoodRef.current.x * cellSize;
        const bfy = bonusFoodRef.current.y * cellSize;
        const pulse = Math.sin(time * 0.01) * 2;
        ctx.save();
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(bfx + cellSize / 2, bfy + cellSize / 2, cellSize * 0.45 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Snake body
      snakeRef.current.forEach((seg, i) => {
        const sx = seg.x * cellSize;
        const sy = seg.y * cellSize;

        if (i === 0) {
          // Snake head
          ctx.save();
          ctx.shadowColor = '#34d399';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#34d399';
          ctx.beginPath();
          ctx.roundRect(sx + 2, sy + 2, cellSize - 4, cellSize - 4, 6);
          ctx.fill();

          // Eyes
          ctx.fillStyle = '#064e3b';
          const eyeOffset = cellSize * 0.28;
          ctx.beginPath();
          ctx.arc(sx + eyeOffset, sy + eyeOffset, 2.5, 0, Math.PI * 2);
          ctx.arc(sx + cellSize - eyeOffset, sy + eyeOffset, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          // Body segments with color gradient
          const factor = 1 - i / snakeRef.current.length;
          ctx.fillStyle = `rgba(16, 185, 129, ${0.4 + factor * 0.6})`;
          ctx.beginPath();
          ctx.roundRect(sx + 2, sy + 2, cellSize - 4, cellSize - 4, 4);
          ctx.fill();
        }
      });

      // Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.04;
        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, score, highScore, wrapWalls, getSpeedInterval, spawnFood, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full select-none">
      {/* Top Game Header Stats */}
      <div className="flex items-center justify-between w-full max-w-[480px] mb-3 px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Score</div>
            <div className="text-2xl font-bold font-arcade text-emerald-400">{score}</div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">High Score</div>
            <div className="text-2xl font-bold font-arcade text-amber-400">{Math.max(score, highScore)}</div>
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWrapWalls(!wrapWalls)}
            title="Toggle Wall Wrap"
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
              wrapWalls ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-rose-950/60 text-rose-300 border border-rose-800'
            }`}
          >
            {wrapWalls ? 'Portal Walls' : 'Solid Walls'}
          </button>
          <button
            onClick={() => {
              const next = speed === 'normal' ? 'fast' : speed === 'fast' ? 'turbo' : 'normal';
              setSpeed(next);
            }}
            className="px-2.5 py-1 text-xs rounded-lg font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 capitalize"
          >
            {speed}
          </button>
        </div>
      </div>

      {/* Canvas Screen */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-black">
        <canvas
          ref={canvasRef}
          width={480}
          height={480}
          className="w-[320px] h-[320px] sm:w-[440px] sm:h-[440px] md:w-[480px] md:h-[480px] block"
        />

        {/* Start / Pause / Game Over Overlays */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
            <h2 className="text-3xl font-extrabold font-arcade text-emerald-400 mb-2">CYBER SNAKE</h2>
            <p className="text-sm text-slate-300 max-w-xs mb-6">
              Use arrow keys or WASD to slither. Collect glowing food and golden stars.
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 text-base transition-all transform active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              START GAME
            </button>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <h3 className="text-2xl font-bold font-arcade text-amber-400 mb-4">GAME PAUSED</h3>
            <button
              onClick={() => setGameState('playing')}
              className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> Resume
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-fade-in">
            <div className="text-xs uppercase tracking-widest text-rose-400 font-bold mb-1">Crashed!</div>
            <h3 className="text-3xl font-extrabold font-arcade text-white mb-2">GAME OVER</h3>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 w-56">
              <div className="text-xs text-slate-400">Final Score</div>
              <div className="text-3xl font-bold font-arcade text-emerald-400 mb-2">{score}</div>
              <div className="text-xs text-slate-400">Best Score: <span className="text-amber-400 font-bold">{highScore}</span></div>
            </div>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all transform active:scale-95"
            >
              <RotateCcw className="w-5 h-5" />
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Onscreen Controls for Mobile or Touch */}
      <div className="mt-4 flex flex-col items-center gap-1 sm:hidden">
        <button
          onClick={() => changeDirection(0, -1)}
          className="w-14 h-12 bg-slate-800 text-slate-200 rounded-lg flex items-center justify-center active:bg-slate-700 shadow"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => changeDirection(-1, 0)}
            className="w-14 h-12 bg-slate-800 text-slate-200 rounded-lg flex items-center justify-center active:bg-slate-700 shadow"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => changeDirection(0, 1)}
            className="w-14 h-12 bg-slate-800 text-slate-200 rounded-lg flex items-center justify-center active:bg-slate-700 shadow"
          >
            <ArrowDown className="w-6 h-6" />
          </button>
          <button
            onClick={() => changeDirection(1, 0)}
            className="w-14 h-12 bg-slate-800 text-slate-200 rounded-lg flex items-center justify-center active:bg-slate-700 shadow"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
