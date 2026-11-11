import React, { useEffect, useRef, useState } from 'react';
import { sound } from '../utils/audio';
import { Play, RotateCcw, Heart } from 'lucide-react';

interface BrickBreakerGameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  isMuted?: boolean;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  color: string;
  points: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export default function BrickBreakerGame({ onScoreUpdate, onGameOver }: BrickBreakerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('breakout_highscore') || '0', 10);
  });
  const [lives, setLives] = useState<number>(3);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover' | 'victory'>('idle');

  // Game internals
  const paddleRef = useRef({
    x: 200,
    y: 470,
    w: 80,
    h: 12,
    speed: 7,
  });

  const ballsRef = useRef<Ball[]>([]);
  const bricksRef = useRef<Brick[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  const initBricks = () => {
    const rows = 5;
    const cols = 8;
    const padding = 6;
    const brickW = (480 - padding * (cols + 1)) / cols;
    const brickH = 18;
    const topOffset = 50;
    const colors = ['#ef4444', '#f97316', '#eab308', '#10b981', '#06b6d4'];
    const hps = [2, 1, 1, 1, 1];

    const list: Brick[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        list.push({
          x: padding + c * (brickW + padding),
          y: topOffset + r * (brickH + padding),
          w: brickW,
          h: brickH,
          hp: hps[r],
          color: colors[r],
          points: (rows - r) * 10,
        });
      }
    }
    bricksRef.current = list;
  };

  const resetGame = () => {
    paddleRef.current = {
      x: 200,
      y: 470,
      w: 84,
      h: 12,
      speed: 7,
    };
    ballsRef.current = [
      {
        x: 240,
        y: 450,
        vx: 3.5 * (Math.random() > 0.5 ? 1 : -1),
        vy: -4.5,
        radius: 6,
      },
    ];
    particlesRef.current = [];
    initBricks();
    setScore(0);
    setLives(3);
    setGameState('playing');
    sound.playClick();
  };

  const spawnParticles = (x: number, y: number, color: string, count = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color,
      });
    }
  };

  // Keyboard and mouse controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' && (gameState === 'idle' || gameState === 'gameover' || gameState === 'victory')) {
        resetGame();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    paddleRef.current.x = Math.max(0, Math.min(canvas.width - paddleRef.current.w, mouseX - paddleRef.current.w / 2));
  };

  // Main game animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (gameState === 'playing') {
        const paddle = paddleRef.current;

        // Paddle keyboard control
        if (keysRef.current['arrowleft'] || keysRef.current['a']) {
          paddle.x = Math.max(0, paddle.x - paddle.speed);
        }
        if (keysRef.current['arrowright'] || keysRef.current['d']) {
          paddle.x = Math.min(canvas.width - paddle.w, paddle.x + paddle.speed);
        }

        // Balls update
        for (let i = ballsRef.current.length - 1; i >= 0; i--) {
          const ball = ballsRef.current[i];
          ball.x += ball.vx;
          ball.y += ball.vy;

          // Wall collision
          if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.vx *= -1;
            sound.playHit(350);
          } else if (ball.x + ball.radius > canvas.width) {
            ball.x = canvas.width - ball.radius;
            ball.vx *= -1;
            sound.playHit(350);
          }

          if (ball.y - ball.radius < 0) {
            ball.y = ball.radius;
            ball.vy *= -1;
            sound.playHit(350);
          }

          // Paddle collision
          if (
            ball.y + ball.radius >= paddle.y &&
            ball.y - ball.radius <= paddle.y + paddle.h &&
            ball.x >= paddle.x &&
            ball.x <= paddle.x + paddle.w
          ) {
            ball.y = paddle.y - ball.radius;
            const hitPos = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
            ball.vx = hitPos * 5.5;
            ball.vy = -Math.abs(ball.vy);
            sound.playHit(420);
          }

          // Brick collision
          for (let j = bricksRef.current.length - 1; j >= 0; j--) {
            const br = bricksRef.current[j];
            if (
              ball.x + ball.radius > br.x &&
              ball.x - ball.radius < br.x + br.w &&
              ball.y + ball.radius > br.y &&
              ball.y - ball.radius < br.y + br.h
            ) {
              ball.vy *= -1;
              br.hp--;
              spawnParticles(ball.x, ball.y, br.color, 8);
              sound.playHit(520);

              if (br.hp <= 0) {
                const newScore = score + br.points;
                setScore(newScore);
                if (onScoreUpdate) onScoreUpdate(newScore);
                sound.playPoint();
                bricksRef.current.splice(j, 1);

                if (bricksRef.current.length === 0) {
                  setGameState('victory');
                  sound.playVictory();
                  break;
                }
              }
              break;
            }
          }

          // Bottom pit check
          if (ball.y - ball.radius > canvas.height) {
            ballsRef.current.splice(i, 1);
          }
        }

        // Check if lost all balls
        if (ballsRef.current.length === 0) {
          setLives((prev) => {
            const next = prev - 1;
            if (next <= 0) {
              setGameState('gameover');
              sound.playGameOver();
              if (score > highScore) {
                setHighScore(score);
                localStorage.setItem('breakout_highscore', score.toString());
              }
              if (onGameOver) onGameOver(score);
            } else {
              ballsRef.current = [
                {
                  x: 240,
                  y: 450,
                  vx: 3.5 * (Math.random() > 0.5 ? 1 : -1),
                  vy: -4.5,
                  radius: 6,
                },
              ];
            }
            return next;
          });
        }
      }

      // Draw Bricks
      bricksRef.current.forEach((br) => {
        ctx.save();
        ctx.fillStyle = br.color;
        ctx.shadowColor = br.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.roundRect(br.x, br.y, br.w, br.h, 3);
        ctx.fill();
        ctx.restore();
      });

      // Draw Paddle
      const paddle = paddleRef.current;
      ctx.save();
      ctx.fillStyle = '#ec4899';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 6);
      ctx.fill();
      ctx.restore();

      // Draw Balls
      ballsRef.current.forEach((b) => {
        ctx.save();
        ctx.fillStyle = '#fdf2f8';
        ctx.shadowColor = '#f472b6';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Particles
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
          ctx.fillRect(p.x, p.y, 3, 3);
          ctx.restore();
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
      <div className="flex items-center justify-between w-full max-w-[480px] mb-3 px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Score</div>
            <div className="text-xl font-bold font-arcade text-pink-400">{score}</div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Best</div>
            <div className="text-xl font-bold font-arcade text-amber-400">{Math.max(score, highScore)}</div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-pink-500">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={`w-4 h-4 ${i < lives ? 'fill-pink-500 text-pink-500' : 'text-slate-700'}`}
            />
          ))}
        </div>
      </div>

      {/* Screen Canvas */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-black">
        <canvas
          ref={canvasRef}
          width={480}
          height={500}
          onMouseMove={handleMouseMove}
          className="w-[320px] h-[330px] sm:w-[420px] sm:h-[440px] md:w-[480px] md:h-[500px] block cursor-pointer"
        />

        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
            <h2 className="text-3xl font-extrabold font-arcade text-pink-400 mb-2">BREAKOUT DELUXE</h2>
            <p className="text-sm text-slate-300 max-w-xs mb-6">
              Move mouse or arrow keys to control the paddle. Smash all the bricks to win!
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-pink-500 hover:bg-pink-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-pink-500/25 flex items-center gap-2 transform active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              START PLAYING
            </button>
          </div>
        )}

        {gameState === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-fade-in">
            <h3 className="text-3xl font-extrabold font-arcade text-emerald-400 mb-2">STAGE CLEARED!</h3>
            <p className="text-sm text-slate-300 mb-6">You shattered every brick in the wall.</p>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-pink-500 hover:bg-pink-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-pink-500/25 flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> PLAY AGAIN
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-fade-in">
            <h3 className="text-3xl font-extrabold font-arcade text-rose-400 mb-2">OUT OF BALLS</h3>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 w-56">
              <div className="text-xs text-slate-400">Score</div>
              <div className="text-3xl font-bold font-arcade text-pink-400">{score}</div>
            </div>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-pink-500 hover:bg-pink-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-pink-500/25 flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> RETRY
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
