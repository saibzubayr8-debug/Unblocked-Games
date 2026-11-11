import React, { useEffect, useRef, useState } from 'react';
import { sound } from '../utils/audio';
import { Play, RotateCcw } from 'lucide-react';

interface DinoRunnerGameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  isMuted?: boolean;
}

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'cactus' | 'bird';
}

export default function DinoRunnerGame({ onScoreUpdate, onGameOver }: DinoRunnerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('dino_highscore') || '0', 10);
  });
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');

  const dinoRef = useRef({
    x: 50,
    y: 200,
    vy: 0,
    w: 32,
    h: 36,
    isJumping: false,
    isDucking: false,
    legCycle: 0,
  });

  const speedRef = useRef<number>(6);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const spawnTimerRef = useRef<number>(0);
  const groundOffsetRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);

  const GROUND_Y = 220;
  const GRAVITY = 0.65;
  const JUMP_STRENGTH = -12.5;

  const jump = () => {
    if (gameState === 'idle' || gameState === 'gameover') {
      resetGame();
      return;
    }
    const dino = dinoRef.current;
    if (!dino.isJumping) {
      dino.vy = JUMP_STRENGTH;
      dino.isJumping = true;
      sound.playJump();
    }
  };

  const duck = (ducking: boolean) => {
    const dino = dinoRef.current;
    dino.isDucking = ducking;
    dino.h = ducking ? 20 : 36;
    if (ducking && !dino.isJumping) {
      dino.y = GROUND_Y - 20;
    }
  };

  const resetGame = () => {
    dinoRef.current = {
      x: 50,
      y: GROUND_Y - 36,
      vy: 0,
      w: 32,
      h: 36,
      isJumping: false,
      isDucking: false,
      legCycle: 0,
    };
    obstaclesRef.current = [];
    spawnTimerRef.current = 0;
    speedRef.current = 6;
    scoreRef.current = 0;
    setScore(0);
    setGameState('playing');
    sound.playClick();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ([' ', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        jump();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        duck(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        duck(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Main animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Background (day/night inversion based on score)
      const isNight = Math.floor(scoreRef.current / 400) % 2 === 1;
      ctx.fillStyle = isNight ? '#090d16' : '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const dino = dinoRef.current;

      if (gameState === 'playing') {
        // Score accumulator
        scoreRef.current += 0.2;
        const currentScoreInt = Math.floor(scoreRef.current);
        if (currentScoreInt !== score) {
          setScore(currentScoreInt);
          if (onScoreUpdate) onScoreUpdate(currentScoreInt);
          if (currentScoreInt > 0 && currentScoreInt % 100 === 0) {
            sound.playPoint();
          }
        }

        // Acceleration
        speedRef.current = 6 + Math.min(8, scoreRef.current * 0.005);

        // Dino gravity
        if (dino.isJumping) {
          dino.vy += GRAVITY;
          dino.y += dino.vy;

          if (dino.y >= GROUND_Y - dino.h) {
            dino.y = GROUND_Y - dino.h;
            dino.vy = 0;
            dino.isJumping = false;
          }
        }

        dino.legCycle += 0.25;

        // Obstacles spawn
        spawnTimerRef.current++;
        const spawnInterval = Math.max(50, 110 - speedRef.current * 4);
        if (spawnTimerRef.current > spawnInterval) {
          spawnTimerRef.current = 0;
          const isBird = scoreRef.current > 150 && Math.random() < 0.35;
          if (isBird) {
            const birdHeight = Math.random() > 0.5 ? GROUND_Y - 45 : GROUND_Y - 26;
            obstaclesRef.current.push({
              x: canvas.width + 20,
              y: birdHeight,
              w: 30,
              h: 18,
              type: 'bird',
            });
          } else {
            const cactusH = Math.random() > 0.5 ? 38 : 28;
            obstaclesRef.current.push({
              x: canvas.width + 20,
              y: GROUND_Y - cactusH,
              w: 18,
              h: cactusH,
              type: 'cactus',
            });
          }
        }

        // Move obstacles and check collisions
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          const obs = obstaclesRef.current[i];
          obs.x -= speedRef.current;

          // Hitbox collision check
          if (
            dino.x + dino.w - 4 > obs.x &&
            dino.x + 4 < obs.x + obs.w &&
            dino.y + dino.h > obs.y + 2 &&
            dino.y < obs.y + obs.h
          ) {
            setGameState('gameover');
            sound.playGameOver();
            if (currentScoreInt > highScore) {
              setHighScore(currentScoreInt);
              localStorage.setItem('dino_highscore', currentScoreInt.toString());
            }
            if (onGameOver) onGameOver(currentScoreInt);
            return;
          }

          if (obs.x + obs.w < -20) {
            obstaclesRef.current.splice(i, 1);
          }
        }

        groundOffsetRef.current = (groundOffsetRef.current + speedRef.current) % 20;
      }

      // Draw Ground
      ctx.strokeStyle = isNight ? '#334155' : '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(canvas.width, GROUND_Y);
      ctx.stroke();

      // Ground bumps
      ctx.fillStyle = isNight ? '#334155' : '#475569';
      for (let x = -groundOffsetRef.current; x < canvas.width; x += 30) {
        ctx.fillRect(x, GROUND_Y + 4, 12, 2);
        ctx.fillRect(x + 18, GROUND_Y + 8, 6, 2);
      }

      // Draw Obstacles
      obstaclesRef.current.forEach((obs) => {
        if (obs.type === 'cactus') {
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(obs.x + 6, obs.y, 6, obs.h);
          ctx.fillRect(obs.x, obs.y + 8, 6, 12);
          ctx.fillRect(obs.x + 12, obs.y + 12, 6, 10);
        } else {
          // Bird / Pterodactyl
          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          // Wing flapping
          const flapWing = Math.sin(Date.now() * 0.015) > 0;
          ctx.fillRect(obs.x + 10, flapWing ? obs.y - 8 : obs.y + obs.h, 8, 8);
        }
      });

      // Draw Dino
      const legOffset = Math.sin(dino.legCycle) > 0 ? 4 : -4;
      ctx.fillStyle = '#f1f5f9';

      if (dino.isDucking) {
        // Ducking body
        ctx.fillRect(dino.x, dino.y + 6, dino.w + 10, 14);
        ctx.fillRect(dino.x + dino.w, dino.y, 10, 8);
        // Eye
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(dino.x + dino.w + 4, dino.y + 2, 2, 2);
      } else {
        // Standing T-Rex Body
        ctx.fillRect(dino.x + 8, dino.y + 8, 16, 20); // torso
        ctx.fillRect(dino.x + 16, dino.y, 14, 14); // head
        ctx.fillRect(dino.x + 22, dino.y + 16, 6, 3); // tiny arm
        ctx.fillRect(dino.x, dino.y + 16, 10, 8); // tail

        // Eye
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(dino.x + 24, dino.y + 4, 3, 3);

        // Legs
        ctx.fillStyle = '#f1f5f9';
        if (dino.isJumping) {
          ctx.fillRect(dino.x + 10, dino.y + 28, 4, 6);
          ctx.fillRect(dino.x + 18, dino.y + 28, 4, 6);
        } else {
          ctx.fillRect(dino.x + 10, dino.y + 28, 4, 8 + legOffset);
          ctx.fillRect(dino.x + 18, dino.y + 28, 4, 8 - legOffset);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, score, highScore, onScoreUpdate, onGameOver]);

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full select-none">
      {/* HUD Bar */}
      <div className="flex items-center justify-between w-full max-w-[520px] mb-3 px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Distance</div>
            <div className="text-xl font-bold font-arcade text-emerald-400">{score}m</div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Record</div>
            <div className="text-xl font-bold font-arcade text-amber-400">{Math.max(score, highScore)}m</div>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Space: Jump | Down: Duck
        </div>
      </div>

      {/* Screen Canvas */}
      <div
        onClick={jump}
        className="relative rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-black cursor-pointer"
      >
        <canvas
          ref={canvasRef}
          width={520}
          height={260}
          className="w-[320px] h-[160px] sm:w-[460px] sm:h-[230px] md:w-[520px] md:h-[260px] block"
        />

        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
            <h2 className="text-2xl font-extrabold font-arcade text-slate-200 mb-1">CHROME DINO RUN</h2>
            <p className="text-xs text-slate-400 mb-4">Jump over desert cacti and duck under flying pterodactyls.</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetGame();
              }}
              className="px-5 py-2.5 bg-slate-200 hover:bg-white text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-2 text-sm"
            >
              <Play className="w-4 h-4 fill-current" /> PRESS SPACE TO RUN
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-fade-in">
            <h3 className="text-2xl font-extrabold font-arcade text-rose-400 mb-2">GAME OVER</h3>
            <div className="text-xs text-slate-400 mb-4">Distance: <span className="font-bold text-emerald-400 font-arcade text-base">{score}m</span></div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetGame();
              }}
              className="px-5 py-2.5 bg-slate-200 hover:bg-white text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-2 text-sm"
            >
              <RotateCcw className="w-4 h-4" /> RESTART
            </button>
          </div>
        )}
      </div>

      {/* Touch controls for mobile */}
      <div className="flex items-center gap-4 mt-3 sm:hidden">
        <button
          onClick={jump}
          className="px-6 py-2.5 bg-slate-800 text-slate-200 rounded-xl font-bold active:bg-slate-700"
        >
          JUMP
        </button>
        <button
          onTouchStart={() => duck(true)}
          onTouchEnd={() => duck(false)}
          className="px-6 py-2.5 bg-slate-800 text-slate-200 rounded-xl font-bold active:bg-slate-700"
        >
          DUCK
        </button>
      </div>
    </div>
  );
}
