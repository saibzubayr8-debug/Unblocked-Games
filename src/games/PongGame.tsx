import React, { useEffect, useRef, useState } from 'react';
import { sound } from '../utils/audio';
import { Play, RotateCcw, Users, User } from 'lucide-react';

interface PongGameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  isMuted?: boolean;
}

export default function PongGame({ onScoreUpdate }: PongGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<'1p' | '2p'>('1p');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [score1, setScore1] = useState<number>(0);
  const [score2, setScore2] = useState<number>(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [winner, setWinner] = useState<string>('');

  const p1Ref = useRef({ y: 150, h: 70, w: 10, speed: 6.5 });
  const p2Ref = useRef({ y: 150, h: 70, w: 10, speed: 6.5 });
  const ballRef = useRef({
    x: 250,
    y: 175,
    vx: 5,
    vy: 2.5,
    radius: 6,
    speedMultiplier: 1,
  });

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const WINNING_SCORE = 7;

  const resetBall = (toP1 = false) => {
    ballRef.current = {
      x: 250,
      y: 175,
      vx: (toP1 ? -5 : 5),
      vy: (Math.random() - 0.5) * 4,
      radius: 6,
      speedMultiplier: 1,
    };
  };

  const resetGame = () => {
    p1Ref.current.y = 150;
    p2Ref.current.y = 150;
    resetBall(Math.random() > 0.5);
    setScore1(0);
    setScore2(0);
    setWinner('');
    setGameState('playing');
    sound.playClick();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'w', 's', 'W', 'S', ' '].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' && (gameState === 'idle' || gameState === 'gameover')) {
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

  // Main animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Clear court
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Center divider net
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      const p1 = p1Ref.current;
      const p2 = p2Ref.current;
      const ball = ballRef.current;

      if (gameState === 'playing') {
        // Player 1 input (W / S)
        if (keysRef.current['w'] || (mode === '1p' && keysRef.current['arrowup'])) {
          p1.y = Math.max(0, p1.y - p1.speed);
        }
        if (keysRef.current['s'] || (mode === '1p' && keysRef.current['arrowdown'])) {
          p1.y = Math.min(canvas.height - p1.h, p1.y + p1.speed);
        }

        // Player 2 input / AI
        if (mode === '2p') {
          if (keysRef.current['arrowup']) {
            p2.y = Math.max(0, p2.y - p2.speed);
          }
          if (keysRef.current['arrowdown']) {
            p2.y = Math.min(canvas.height - p2.h, p2.y + p2.speed);
          }
        } else {
          // AI logic
          const aiTarget = ball.y - p2.h / 2;
          const aiSpeed = aiDifficulty === 'easy' ? 3.5 : aiDifficulty === 'medium' ? 5.2 : 6.8;
          if (p2.y < aiTarget - 6) {
            p2.y = Math.min(canvas.height - p2.h, p2.y + aiSpeed);
          } else if (p2.y > aiTarget + 6) {
            p2.y = Math.max(0, p2.y - aiSpeed);
          }
        }

        // Ball physics
        ball.x += ball.vx * ball.speedMultiplier;
        ball.y += ball.vy * ball.speedMultiplier;

        // Top/Bottom bounce
        if (ball.y - ball.radius <= 0) {
          ball.y = ball.radius;
          ball.vy *= -1;
          sound.playHit(300);
        } else if (ball.y + ball.radius >= canvas.height) {
          ball.y = canvas.height - ball.radius;
          ball.vy *= -1;
          sound.playHit(300);
        }

        // Left Paddle (P1) hit
        if (
          ball.x - ball.radius <= 24 + p1.w &&
          ball.x + ball.radius >= 24 &&
          ball.y >= p1.y &&
          ball.y <= p1.y + p1.h
        ) {
          ball.x = 24 + p1.w + ball.radius;
          const hitDelta = (ball.y - (p1.y + p1.h / 2)) / (p1.h / 2);
          ball.vx = Math.abs(ball.vx);
          ball.vy = hitDelta * 5;
          ball.speedMultiplier = Math.min(1.7, ball.speedMultiplier + 0.05);
          sound.playHit(480);
        }

        // Right Paddle (P2) hit
        const p2X = canvas.width - 24 - p2.w;
        if (
          ball.x + ball.radius >= p2X &&
          ball.x - ball.radius <= p2X + p2.w &&
          ball.y >= p2.y &&
          ball.y <= p2.y + p2.h
        ) {
          ball.x = p2X - ball.radius;
          const hitDelta = (ball.y - (p2.y + p2.h / 2)) / (p2.h / 2);
          ball.vx = -Math.abs(ball.vx);
          ball.vy = hitDelta * 5;
          ball.speedMultiplier = Math.min(1.7, ball.speedMultiplier + 0.05);
          sound.playHit(480);
        }

        // Score check
        if (ball.x < 0) {
          // P2 scores
          const nextP2 = score2 + 1;
          setScore2(nextP2);
          sound.playPoint();
          if (nextP2 >= WINNING_SCORE) {
            setWinner(mode === '2p' ? 'Player 2 Wins!' : 'Computer Wins!');
            setGameState('gameover');
            sound.playGameOver();
          } else {
            resetBall(false);
          }
        } else if (ball.x > canvas.width) {
          // P1 scores
          const nextP1 = score1 + 1;
          setScore1(nextP1);
          sound.playPoint();
          if (onScoreUpdate) onScoreUpdate(nextP1 * 10);
          if (nextP1 >= WINNING_SCORE) {
            setWinner(mode === '2p' ? 'Player 1 Wins!' : 'You Win!');
            setGameState('gameover');
            sound.playVictory();
          } else {
            resetBall(true);
          }
        }
      }

      // Draw Paddles
      // P1 (Cyan)
      ctx.save();
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(24, p1.y, p1.w, p1.h, 4);
      ctx.fill();
      ctx.restore();

      // P2 (Indigo)
      ctx.save();
      ctx.fillStyle = '#6366f1';
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(canvas.width - 24 - p2.w, p2.y, p2.w, p2.h, 4);
      ctx.fill();
      ctx.restore();

      // Draw Ball (Glow Amber)
      ctx.save();
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mode, aiDifficulty, score1, score2, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full select-none">
      {/* Top HUD with Mode & Difficulty */}
      <div className="flex items-center justify-between w-full max-w-[500px] mb-3 px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMode('1p');
              resetGame();
            }}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              mode === '1p' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" /> 1-Player
          </button>
          <button
            onClick={() => {
              setMode('2p');
              resetGame();
            }}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              mode === '2p' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> 2-Player
          </button>
        </div>

        {/* Scores */}
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black font-arcade text-cyan-400">{score1}</span>
          <span className="text-slate-500 font-bold">:</span>
          <span className="text-2xl font-black font-arcade text-indigo-400">{score2}</span>
        </div>

        {mode === '1p' && (
          <select
            value={aiDifficulty}
            onChange={(e) => setAiDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            className="bg-slate-800 text-xs text-slate-300 border border-slate-700 rounded-lg px-2 py-1 outline-none"
          >
            <option value="easy">Easy AI</option>
            <option value="medium">Medium AI</option>
            <option value="hard">Hard AI</option>
          </select>
        )}
      </div>

      {/* Screen Canvas */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-black">
        <canvas
          ref={canvasRef}
          width={500}
          height={350}
          className="w-[320px] h-[224px] sm:w-[440px] sm:h-[308px] md:w-[500px] md:h-[350px] block"
        />

        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
            <h2 className="text-3xl font-extrabold font-arcade text-cyan-400 mb-2">CYBER PONG</h2>
            <p className="text-sm text-slate-300 max-w-xs mb-6">
              {mode === '1p' ? 'Control with W/S or Arrow Keys. First to 7 points wins!' : 'P1: W/S | P2: Up/Down. First to 7 points wins!'}
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" /> SERVE BALL
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-fade-in">
            <h3 className="text-3xl font-extrabold font-arcade text-amber-400 mb-2">{winner}</h3>
            <div className="text-sm text-slate-300 mb-6">Final Score: {score1} - {score2}</div>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> REMATCH
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
