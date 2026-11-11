import React, { useEffect, useRef, useState } from 'react';
import { sound } from '../utils/audio';
import { Play, RotateCcw, Zap, Flame } from 'lucide-react';

interface TurboRacerGameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  isMuted?: boolean;
}

interface TrafficCar {
  lane: number;
  y: number;
  speed: number;
  color: string;
}

interface RoadItem {
  lane: number;
  y: number;
  type: 'coin' | 'nitro';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export default function TurboRacerGame({ onScoreUpdate, onGameOver }: TurboRacerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('racer_highscore') || '0', 10);
  });
  const [nitro, setNitro] = useState<number>(100);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');

  // Player position
  const playerLaneRef = useRef<number>(1); // 0: Left, 1: Center, 2: Right
  const playerXRef = useRef<number>(200);
  const isNitroRef = useRef<boolean>(false);
  const trafficRef = useRef<TrafficCar[]>([]);
  const itemsRef = useRef<RoadItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const spawnTimerRef = useRef<number>(0);
  const roadScrollRef = useRef<number>(0);
  const scoreAccRef = useRef<number>(0);

  const LANE_X = [120, 200, 280];
  const CAR_WIDTH = 38;
  const CAR_HEIGHT = 65;

  const resetGame = () => {
    playerLaneRef.current = 1;
    playerXRef.current = LANE_X[1];
    trafficRef.current = [];
    itemsRef.current = [];
    particlesRef.current = [];
    spawnTimerRef.current = 0;
    scoreAccRef.current = 0;
    setScore(0);
    setNitro(100);
    setGameState('playing');
    sound.playClick();
  };

  const steerLeft = () => {
    if (playerLaneRef.current > 0) {
      playerLaneRef.current -= 1;
      sound.playHit(400);
    }
  };

  const steerRight = () => {
    if (playerLaneRef.current < 2) {
      playerLaneRef.current += 1;
      sound.playHit(400);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') steerLeft();
      else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') steerRight();
      else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') isNitroRef.current = true;
      else if (e.key === ' ' && (gameState === 'idle' || gameState === 'gameover')) resetGame();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') isNitroRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Highway background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grass/Shoulder
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, 70, canvas.height);
      ctx.fillRect(canvas.width - 70, 0, 70, canvas.height);

      // Asphalt Road
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(70, 0, 260, canvas.height);

      // Road Borders
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(68, 0, 4, canvas.height);
      ctx.fillRect(canvas.width - 72, 0, 4, canvas.height);

      const targetX = LANE_X[playerLaneRef.current];
      playerXRef.current += (targetX - playerXRef.current) * 0.25;

      const baseSpeed = isNitroRef.current && nitro > 0 ? 12 : 7;

      if (gameState === 'playing') {
        // Nitro consumption
        if (isNitroRef.current && nitro > 0) {
          setNitro((n) => Math.max(0, n - 0.5));
        }

        // Score
        scoreAccRef.current += (baseSpeed / 7) * 0.5;
        const pts = Math.floor(scoreAccRef.current);
        if (pts !== score) {
          setScore(pts);
          if (onScoreUpdate) onScoreUpdate(pts);
        }

        // Road scroll
        roadScrollRef.current = (roadScrollRef.current + baseSpeed) % 40;

        // Spawn traffic
        spawnTimerRef.current++;
        if (spawnTimerRef.current > 42) {
          spawnTimerRef.current = 0;
          const randomLane = Math.floor(Math.random() * 3);
          const colors = ['#f43f5e', '#3b82f6', '#eab308', '#a855f7'];
          trafficRef.current.push({
            lane: randomLane,
            y: -80,
            speed: Math.random() * 2 + 3.5,
            color: colors[Math.floor(Math.random() * colors.length)],
          });

          // Chance to spawn coin or nitro
          if (Math.random() < 0.35) {
            const itemLane = (randomLane + 1) % 3;
            itemsRef.current.push({
              lane: itemLane,
              y: -50,
              type: Math.random() < 0.3 ? 'nitro' : 'coin',
            });
          }
        }

        // Move Traffic & Check Collision
        const pY = canvas.height - 100;
        for (let i = trafficRef.current.length - 1; i >= 0; i--) {
          const car = trafficRef.current[i];
          car.y += baseSpeed - car.speed;
          const carX = LANE_X[car.lane];

          // Collision box
          if (
            Math.abs(carX - playerXRef.current) < CAR_WIDTH - 6 &&
            Math.abs(car.y - pY) < CAR_HEIGHT - 8
          ) {
            setGameState('gameover');
            sound.playExplosion();
            if (pts > highScore) {
              setHighScore(pts);
              localStorage.setItem('racer_highscore', pts.toString());
            }
            if (onGameOver) onGameOver(pts);
            return;
          }

          if (car.y > canvas.height + 100) {
            trafficRef.current.splice(i, 1);
          }
        }

        // Move Items & Collect
        for (let i = itemsRef.current.length - 1; i >= 0; i--) {
          const item = itemsRef.current[i];
          item.y += baseSpeed;
          const itemX = LANE_X[item.lane];

          if (
            Math.abs(itemX - playerXRef.current) < 28 &&
            Math.abs(item.y - pY) < 30
          ) {
            sound.playPoint();
            if (item.type === 'coin') {
              scoreAccRef.current += 50;
            } else {
              setNitro((n) => Math.min(100, n + 35));
            }
            itemsRef.current.splice(i, 1);
            continue;
          }

          if (item.y > canvas.height + 40) {
            itemsRef.current.splice(i, 1);
          }
        }
      }

      // Draw dashed lane markings
      ctx.fillStyle = '#f8fafc';
      const laneDividers = [155, 235];
      laneDividers.forEach((lx) => {
        for (let y = -40 + roadScrollRef.current; y < canvas.height; y += 40) {
          ctx.fillRect(lx, y, 4, 20);
        }
      });

      // Draw Items
      itemsRef.current.forEach((item) => {
        const ix = LANE_X[item.lane];
        ctx.save();
        if (item.type === 'coin') {
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(ix, item.y, 10, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(ix, item.y, 11, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Draw Traffic Cars
      trafficRef.current.forEach((car) => {
        const cx = LANE_X[car.lane];
        ctx.save();
        ctx.fillStyle = car.color;
        ctx.beginPath();
        ctx.roundRect(cx - CAR_WIDTH / 2, car.y, CAR_WIDTH, CAR_HEIGHT, 8);
        ctx.fill();

        // Windshield
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - CAR_WIDTH / 2 + 6, car.y + 16, CAR_WIDTH - 12, 12);
        // Taillights
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cx - CAR_WIDTH / 2 + 4, car.y + CAR_HEIGHT - 6, 8, 4);
        ctx.fillRect(cx + CAR_WIDTH / 2 - 12, car.y + CAR_HEIGHT - 6, 8, 4);
        ctx.restore();
      });

      // Draw Player Car
      const pX = playerXRef.current;
      const pY = canvas.height - 100;
      ctx.save();

      // Nitro exhaust flame
      if (isNitroRef.current && nitro > 0) {
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        const flameLen = Math.random() * 12 + 16;
        ctx.beginPath();
        ctx.moveTo(pX - 8, pY + CAR_HEIGHT);
        ctx.lineTo(pX + 8, pY + CAR_HEIGHT);
        ctx.lineTo(pX, pY + CAR_HEIGHT + flameLen);
        ctx.closePath();
        ctx.fill();
      }

      // Car Body (Red sports speedster)
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(pX - CAR_WIDTH / 2, pY, CAR_WIDTH, CAR_HEIGHT, 8);
      ctx.fill();

      // Roof / Hood stripes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(pX - 3, pY, 6, CAR_HEIGHT);

      // Windshield
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(pX - CAR_WIDTH / 2 + 6, pY + 18, CAR_WIDTH - 12, 14);

      // Headlights
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#fef08a';
      ctx.shadowBlur = 12;
      ctx.fillRect(pX - CAR_WIDTH / 2 + 3, pY + 2, 7, 4);
      ctx.fillRect(pX + CAR_WIDTH / 2 - 10, pY + 2, 7, 4);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, nitro, score, highScore, onScoreUpdate, onGameOver]);

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full select-none">
      {/* Top HUD */}
      <div className="flex items-center justify-between w-full max-w-[400px] mb-3 px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-sm">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Distance</div>
          <div className="text-xl font-bold font-arcade text-rose-400">{score}m</div>
        </div>

        {/* Nitro Gauge */}
        <div className="w-28">
          <div className="flex items-center justify-between text-[10px] text-cyan-400 font-semibold mb-1">
            <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> NITRO</span>
            <span>{Math.floor(nitro)}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all"
              style={{ width: `${nitro}%` }}
            />
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium text-right">Best</div>
          <div className="text-xl font-bold font-arcade text-amber-400 text-right">{Math.max(score, highScore)}m</div>
        </div>
      </div>

      {/* Screen Canvas */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-black">
        <canvas
          ref={canvasRef}
          width={400}
          height={500}
          className="w-[300px] h-[375px] sm:w-[360px] sm:h-[450px] md:w-[400px] md:h-[500px] block"
        />

        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
            <h2 className="text-3xl font-extrabold font-arcade text-rose-400 mb-2">TURBO HIGHWAY</h2>
            <p className="text-sm text-slate-300 max-w-xs mb-6">
              Use Left/Right to change lanes. Hold UP or W to ignite Nitro Boost!
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-rose-500/25 flex items-center gap-2 transform active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" /> START DRIFTING
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-fade-in">
            <h3 className="text-3xl font-extrabold font-arcade text-rose-400 mb-2">HIGHWAY CRASH!</h3>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 w-56">
              <div className="text-xs text-slate-400">Total Distance</div>
              <div className="text-3xl font-bold font-arcade text-rose-400 mb-1">{score}m</div>
            </div>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-rose-500/25 flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> TRY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Onscreen touch steering */}
      <div className="flex items-center justify-center gap-4 mt-3 sm:hidden">
        <button
          onClick={steerLeft}
          className="w-16 h-12 bg-slate-800 active:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center justify-center"
        >
          LEFT
        </button>
        <button
          onTouchStart={() => (isNitroRef.current = true)}
          onTouchEnd={() => (isNitroRef.current = false)}
          className="w-20 h-12 bg-cyan-600 active:bg-cyan-500 text-white rounded-xl font-bold flex items-center justify-center"
        >
          NITRO
        </button>
        <button
          onClick={steerRight}
          className="w-16 h-12 bg-slate-800 active:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center justify-center"
        >
          RIGHT
        </button>
      </div>
    </div>
  );
}
