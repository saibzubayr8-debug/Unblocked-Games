import React, { useEffect, useRef, useState } from 'react';
import { sound } from '../utils/audio';
import { Play, RotateCcw, Award } from 'lucide-react';

interface FlappyBirdGameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  isMuted?: boolean;
}

interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number;
  passed: boolean;
}

export default function FlappyBirdGame({ onScoreUpdate, onGameOver }: FlappyBirdGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('flappy_highscore') || '0', 10);
  });
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');

  const birdRef = useRef({
    x: 90,
    y: 200,
    vy: 0,
    gravity: 0.38,
    jumpForce: -6.5,
    radius: 13,
    tilt: 0,
  });

  const pipesRef = useRef<Pipe[]>([]);
  const pipeTimerRef = useRef<number>(0);
  const groundOffsetRef = useRef<number>(0);

  const GAP_SIZE = 135;
  const PIPE_WIDTH = 56;

  const flap = () => {
    if (gameState === 'idle') {
      resetGame();
      return;
    }
    if (gameState === 'gameover') {
      resetGame();
      return;
    }
    birdRef.current.vy = birdRef.current.jumpForce;
    sound.playJump();
  };

  const resetGame = () => {
    birdRef.current = {
      x: 90,
      y: 200,
      vy: -3,
      gravity: 0.38,
      jumpForce: -6.5,
      radius: 13,
      tilt: 0,
    };
    pipesRef.current = [];
    pipeTimerRef.current = 0;
    setScore(0);
    setGameState('playing');
    sound.playClick();
  };

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ([' ', 'ArrowUp', 'w', 'W'].includes(e.key)) {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // 1. Sky Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.7, '#38bdf8');
      skyGrad.addColorStop(1, '#7dd3fc');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(100, 100, 30, 0, Math.PI * 2);
      ctx.arc(130, 90, 40, 0, Math.PI * 2);
      ctx.arc(160, 100, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(320, 140, 25, 0, Math.PI * 2);
      ctx.arc(350, 130, 35, 0, Math.PI * 2);
      ctx.arc(380, 140, 25, 0, Math.PI * 2);
      ctx.fill();

      const bird = birdRef.current;
      const groundY = canvas.height - 40;

      if (gameState === 'playing') {
        // Bird physics
        bird.vy += bird.gravity;
        bird.y += bird.vy;
        bird.tilt = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.vy * 0.08));

        // Pipes generator
        pipeTimerRef.current++;
        if (pipeTimerRef.current > 95) {
          pipeTimerRef.current = 0;
          const minPipe = 50;
          const maxPipe = groundY - GAP_SIZE - 50;
          const topH = Math.floor(Math.random() * (maxPipe - minPipe)) + minPipe;
          pipesRef.current.push({
            x: canvas.width,
            topHeight: topH,
            bottomY: topH + GAP_SIZE,
            passed: false,
          });
        }

        // Pipe movements & collisions
        for (let i = pipesRef.current.length - 1; i >= 0; i--) {
          const p = pipesRef.current[i];
          p.x -= 2.8;

          // Check pass
          if (!p.passed && p.x + PIPE_WIDTH < bird.x) {
            p.passed = true;
            const newScore = score + 1;
            setScore(newScore);
            if (onScoreUpdate) onScoreUpdate(newScore);
            sound.playPoint();
          }

          // Check collision with top pipe
          if (
            bird.x + bird.radius > p.x &&
            bird.x - bird.radius < p.x + PIPE_WIDTH &&
            bird.y - bird.radius < p.topHeight
          ) {
            endRound();
            return;
          }

          // Check collision with bottom pipe
          if (
            bird.x + bird.radius > p.x &&
            bird.x - bird.radius < p.x + PIPE_WIDTH &&
            bird.y + bird.radius > p.bottomY
          ) {
            endRound();
            return;
          }

          if (p.x + PIPE_WIDTH < -10) {
            pipesRef.current.splice(i, 1);
          }
        }

        // Floor / Ceiling collision
        if (bird.y + bird.radius >= groundY || bird.y - bird.radius <= 0) {
          endRound();
          return;
        }

        groundOffsetRef.current = (groundOffsetRef.current + 2.8) % 24;
      }

      // Draw Pipes
      pipesRef.current.forEach((p) => {
        // Top pipe
        ctx.fillStyle = '#15803d';
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topHeight);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(p.x + 4, 0, PIPE_WIDTH - 8, p.topHeight);
        // Top pipe collar
        ctx.fillStyle = '#166534';
        ctx.fillRect(p.x - 3, p.topHeight - 18, PIPE_WIDTH + 6, 18);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(p.x - 1, p.topHeight - 16, PIPE_WIDTH + 2, 14);

        // Bottom pipe
        const bottomH = groundY - p.bottomY;
        ctx.fillStyle = '#15803d';
        ctx.fillRect(p.x, p.bottomY, PIPE_WIDTH, bottomH);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(p.x + 4, p.bottomY, PIPE_WIDTH - 8, bottomH);
        // Bottom pipe collar
        ctx.fillStyle = '#166534';
        ctx.fillRect(p.x - 3, p.bottomY, PIPE_WIDTH + 6, 18);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(p.x - 1, p.bottomY + 2, PIPE_WIDTH + 2, 14);
      });

      // Draw Ground
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, groundY, canvas.width, 10);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, groundY + 10, canvas.width, 30);

      // Ground pattern lines
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      for (let x = -groundOffsetRef.current; x < canvas.width; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, groundY + 10);
        ctx.lineTo(x + 10, canvas.height);
        ctx.stroke();
      }

      // Draw Bird
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(bird.tilt);

      // Yellow Bird body
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Wing
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(-4, 2, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(5, -4, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(7, -4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(8, -1);
      ctx.lineTo(16, 2);
      ctx.lineTo(8, 5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    const endRound = () => {
      setGameState('gameover');
      sound.playGameOver();
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('flappy_highscore', score.toString());
      }
      if (onGameOver) onGameOver(score);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, score, highScore, onScoreUpdate, onGameOver]);

  const getMedal = (pts: number) => {
    if (pts >= 40) return { name: 'Platinum', color: 'text-cyan-400' };
    if (pts >= 25) return { name: 'Gold', color: 'text-yellow-400' };
    if (pts >= 15) return { name: 'Silver', color: 'text-slate-300' };
    if (pts >= 5) return { name: 'Bronze', color: 'text-amber-700' };
    return null;
  };

  const medal = getMedal(score);

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full select-none">
      {/* Top HUD */}
      <div className="flex items-center justify-between w-full max-w-[420px] mb-3 px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-sm">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Score</div>
          <div className="text-xl font-bold font-arcade text-cyan-400">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-slate-400">Controls</div>
          <div className="text-xs font-semibold text-slate-200">Space / Tap</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium text-right">Best</div>
          <div className="text-xl font-bold font-arcade text-amber-400 text-right">{Math.max(score, highScore)}</div>
        </div>
      </div>

      {/* Screen Canvas */}
      <div
        onClick={flap}
        className="relative rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-black cursor-pointer"
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={500}
          className="w-[300px] h-[380px] sm:w-[360px] sm:h-[450px] md:w-[400px] md:h-[500px] block"
        />

        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
            <h2 className="text-3xl font-extrabold font-arcade text-cyan-400 mb-2">FLAPPY PIXEL</h2>
            <p className="text-sm text-slate-300 max-w-xs mb-6">
              Tap screen or press SPACE to flap wings. Avoid pipes and don't hit the ground!
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetGame();
              }}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/30 flex items-center gap-2 transform active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              START FLYING
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-fade-in">
            <h3 className="text-3xl font-extrabold font-arcade text-rose-400 mb-2">CRASHED!</h3>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 w-60">
              <div className="text-xs text-slate-400">Score</div>
              <div className="text-3xl font-bold font-arcade text-cyan-400 mb-2">{score}</div>
              <div className="text-xs text-slate-400 mb-2">Best: <span className="text-amber-400 font-bold">{highScore}</span></div>
              {medal && (
                <div className={`flex items-center justify-center gap-1.5 text-xs font-bold ${medal.color} pt-2 border-t border-slate-800`}>
                  <Award className="w-4 h-4" /> {medal.name} Medal Earned
                </div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetGame();
              }}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> TRY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
