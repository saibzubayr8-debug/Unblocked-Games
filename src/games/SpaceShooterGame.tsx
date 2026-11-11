import React, { useEffect, useRef, useState } from 'react';
import { sound } from '../utils/audio';
import { Play, RotateCcw, Shield, Zap, Heart } from 'lucide-react';

interface SpaceShooterGameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  isMuted?: boolean;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isEnemy?: boolean;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  radius: number;
  color: string;
  type: 'drone' | 'scout' | 'asteroid' | 'boss';
  shootCooldown: number;
}

interface PowerUp {
  x: number;
  y: number;
  vy: number;
  type: 'triple' | 'shield' | 'nuke';
}

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

export default function SpaceShooterGame({ onScoreUpdate, onGameOver }: SpaceShooterGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('space_highscore') || '0', 10);
  });
  const [lives, setLives] = useState<number>(3);
  const [shieldActive, setShieldActive] = useState<boolean>(false);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');

  // Internal game engine references
  const playerRef = useRef({
    x: 240,
    y: 420,
    vx: 0,
    vy: 0,
    speed: 5.5,
    powerLevel: 1, // 1: single, 2: double, 3: triple
    powerTimer: 0,
    shield: false,
    invincibleTimer: 0,
  });

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const spawnTimerRef = useRef<number>(0);
  const shootTimerRef = useRef<number>(0);
  const bossSpawnedRef = useRef<boolean>(false);

  // Initialize starfield
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * 480,
        y: Math.random() * 560,
        speed: Math.random() * 2 + 0.5,
        size: Math.random() * 1.8 + 0.5,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }
    starsRef.current = stars;
  }, []);

  const resetGame = () => {
    playerRef.current = {
      x: 240,
      y: 450,
      vx: 0,
      vy: 0,
      speed: 5.5,
      powerLevel: 1,
      powerTimer: 0,
      shield: false,
      invincibleTimer: 60,
    };
    bulletsRef.current = [];
    enemiesRef.current = [];
    powerUpsRef.current = [];
    particlesRef.current = [];
    spawnTimerRef.current = 0;
    shootTimerRef.current = 0;
    bossSpawnedRef.current = false;

    setScore(0);
    setLives(3);
    setShieldActive(false);
    setGameState('playing');
  };

  const spawnExplosion = (x: number, y: number, color: string, count = 16) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color,
        size: Math.random() * 3 + 1.5,
      });
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current[e.key.toLowerCase()] = true;

      if (e.key === ' ' && gameState === 'idle') {
        resetGame();
      } else if (e.key === ' ' && gameState === 'gameover') {
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

  // Main game animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // 1. Clear background
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Stars
      starsRef.current.forEach((star) => {
        star.y += star.speed;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });

      if (gameState === 'playing') {
        const player = playerRef.current;

        // Player movement
        let dx = 0;
        let dy = 0;
        if (keysRef.current['arrowleft'] || keysRef.current['a']) dx -= 1;
        if (keysRef.current['arrowright'] || keysRef.current['d']) dx += 1;
        if (keysRef.current['arrowup'] || keysRef.current['w']) dy -= 1;
        if (keysRef.current['arrowdown'] || keysRef.current['s']) dy += 1;

        if (dx !== 0 && dy !== 0) {
          dx *= 0.7071;
          dy *= 0.7071;
        }

        player.x += dx * player.speed;
        player.y += dy * player.speed;

        // Boundaries
        player.x = Math.max(20, Math.min(canvas.width - 20, player.x));
        player.y = Math.max(40, Math.min(canvas.height - 30, player.y));

        if (player.invincibleTimer > 0) player.invincibleTimer--;
        if (player.powerTimer > 0) {
          player.powerTimer--;
          if (player.powerTimer === 0) player.powerLevel = 1;
        }

        // Shooting
        shootTimerRef.current++;
        if ((keysRef.current[' '] || keysRef.current['space']) && shootTimerRef.current >= 8) {
          shootTimerRef.current = 0;
          sound.playLaser();

          if (player.powerLevel === 1) {
            bulletsRef.current.push({ x: player.x, y: player.y - 18, vx: 0, vy: -10 });
          } else if (player.powerLevel === 2) {
            bulletsRef.current.push({ x: player.x - 10, y: player.y - 14, vx: 0, vy: -10 });
            bulletsRef.current.push({ x: player.x + 10, y: player.y - 14, vx: 0, vy: -10 });
          } else {
            // Triple
            bulletsRef.current.push({ x: player.x, y: player.y - 18, vx: 0, vy: -10 });
            bulletsRef.current.push({ x: player.x - 12, y: player.y - 12, vx: -2.5, vy: -9.5 });
            bulletsRef.current.push({ x: player.x + 12, y: player.y - 12, vx: 2.5, vy: -9.5 });
          }
        }

        // Spawning Enemies
        spawnTimerRef.current++;
        if (spawnTimerRef.current > 45) {
          spawnTimerRef.current = 0;
          const randType = Math.random();
          if (randType < 0.45) {
            // Drone
            enemiesRef.current.push({
              x: Math.random() * (canvas.width - 60) + 30,
              y: -20,
              vx: (Math.random() - 0.5) * 1.5,
              vy: Math.random() * 1.5 + 2,
              hp: 1,
              maxHp: 1,
              radius: 14,
              color: '#ef4444',
              type: 'drone',
              shootCooldown: 60,
            });
          } else if (randType < 0.75) {
            // Asteroid
            enemiesRef.current.push({
              x: Math.random() * (canvas.width - 60) + 30,
              y: -30,
              vx: (Math.random() - 0.5) * 1,
              vy: Math.random() * 1.2 + 1.2,
              hp: 3,
              maxHp: 3,
              radius: 22,
              color: '#94a3b8',
              type: 'asteroid',
              shootCooldown: 999,
            });
          } else {
            // Scout
            enemiesRef.current.push({
              x: Math.random() * (canvas.width - 60) + 30,
              y: -20,
              vx: (Math.random() - 0.5) * 3,
              vy: Math.random() * 1 + 2.5,
              hp: 2,
              maxHp: 2,
              radius: 16,
              color: '#a855f7',
              type: 'scout',
              shootCooldown: 40,
            });
          }
        }

        // Boss spawn at 400 pts
        if (score >= 400 && !bossSpawnedRef.current && !enemiesRef.current.some((e) => e.type === 'boss')) {
          bossSpawnedRef.current = true;
          enemiesRef.current.push({
            x: canvas.width / 2,
            y: -50,
            vx: 2,
            vy: 1,
            hp: 30,
            maxHp: 30,
            radius: 40,
            color: '#f43f5e',
            type: 'boss',
            shootCooldown: 30,
          });
        }

        // Update Bullets
        for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
          const b = bulletsRef.current[i];
          b.x += b.vx;
          b.y += b.vy;

          if (b.y < -20 || b.y > canvas.height + 20 || b.x < -20 || b.x > canvas.width + 20) {
            bulletsRef.current.splice(i, 1);
            continue;
          }

          // Check bullet hits player
          if (b.isEnemy) {
            const dist = Math.hypot(b.x - player.x, b.y - player.y);
            if (dist < 18 && player.invincibleTimer === 0) {
              bulletsRef.current.splice(i, 1);
              if (player.shield) {
                player.shield = false;
                setShieldActive(false);
                sound.playHit();
              } else {
                takePlayerHit();
              }
              continue;
            }
          } else {
            // Player bullet hits enemy
            for (let j = enemiesRef.current.length - 1; j >= 0; j--) {
              const e = enemiesRef.current[j];
              const dist = Math.hypot(b.x - e.x, b.y - e.y);
              if (dist < e.radius + 6) {
                bulletsRef.current.splice(i, 1);
                e.hp--;
                spawnExplosion(b.x, b.y, '#f59e0b', 4);
                sound.playHit(500);

                if (e.hp <= 0) {
                  const gained = e.type === 'boss' ? 250 : e.type === 'asteroid' ? 25 : 15;
                  const newScore = score + gained;
                  setScore(newScore);
                  if (onScoreUpdate) onScoreUpdate(newScore);
                  sound.playExplosion();
                  spawnExplosion(e.x, e.y, e.color, e.type === 'boss' ? 40 : 16);

                  // Chance to drop power-up
                  if (Math.random() < 0.22) {
                    const pTypes: ('triple' | 'shield' | 'nuke')[] = ['triple', 'shield', 'nuke'];
                    const picked = pTypes[Math.floor(Math.random() * pTypes.length)];
                    powerUpsRef.current.push({
                      x: e.x,
                      y: e.y,
                      vy: 1.5,
                      type: picked,
                    });
                  }

                  enemiesRef.current.splice(j, 1);
                }
                break;
              }
            }
          }
        }

        // Update Enemies
        for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
          const e = enemiesRef.current[i];
          e.x += e.vx;
          e.y += e.vy;

          if (e.type === 'boss') {
            if (e.y < 90) e.vy = 1;
            else e.vy = 0;
            if (e.x < 70 || e.x > canvas.width - 70) e.vx *= -1;
          } else {
            if (e.x < 20 || e.x > canvas.width - 20) e.vx *= -1;
          }

          // Enemy shooting
          e.shootCooldown--;
          if (e.shootCooldown <= 0) {
            if (e.type === 'scout') {
              e.shootCooldown = 65;
              bulletsRef.current.push({ x: e.x, y: e.y + 15, vx: 0, vy: 4.5, isEnemy: true });
            } else if (e.type === 'boss') {
              e.shootCooldown = 35;
              bulletsRef.current.push({ x: e.x - 20, y: e.y + 30, vx: -1.5, vy: 4, isEnemy: true });
              bulletsRef.current.push({ x: e.x + 20, y: e.y + 30, vx: 1.5, vy: 4, isEnemy: true });
              bulletsRef.current.push({ x: e.x, y: e.y + 35, vx: 0, vy: 5, isEnemy: true });
            }
          }

          // Enemy collision with player
          const dist = Math.hypot(e.x - player.x, e.y - player.y);
          if (dist < e.radius + 14 && player.invincibleTimer === 0) {
            spawnExplosion(e.x, e.y, e.color, 15);
            if (e.type !== 'boss') enemiesRef.current.splice(i, 1);
            if (player.shield) {
              player.shield = false;
              setShieldActive(false);
              sound.playHit();
            } else {
              takePlayerHit();
            }
            continue;
          }

          if (e.y > canvas.height + 40) {
            enemiesRef.current.splice(i, 1);
          }
        }

        // Update PowerUps
        for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
          const pu = powerUpsRef.current[i];
          pu.y += pu.vy;
          const dist = Math.hypot(pu.x - player.x, pu.y - player.y);

          if (dist < 28) {
            sound.playPoint();
            if (pu.type === 'triple') {
              player.powerLevel = 3;
              player.powerTimer = 400;
            } else if (pu.type === 'shield') {
              player.shield = true;
              setShieldActive(true);
            } else if (pu.type === 'nuke') {
              // Clear on-screen non-boss enemies
              enemiesRef.current.forEach((en) => {
                if (en.type !== 'boss') {
                  spawnExplosion(en.x, en.y, en.color, 12);
                }
              });
              enemiesRef.current = enemiesRef.current.filter((en) => en.type === 'boss');
              sound.playExplosion();
            }
            powerUpsRef.current.splice(i, 1);
            continue;
          }

          if (pu.y > canvas.height + 20) {
            powerUpsRef.current.splice(i, 1);
          }
        }
      }

      // 3. Draw Bullets
      bulletsRef.current.forEach((b) => {
        ctx.save();
        if (b.isEnemy) {
          ctx.fillStyle = '#f43f5e';
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
          ctx.fillRect(b.x - 2, b.y - 7, 4, 14);
        }
        ctx.restore();
      });

      // 4. Draw Enemies
      enemiesRef.current.forEach((e) => {
        ctx.save();
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 12;

        if (e.type === 'asteroid') {
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (e.type === 'boss') {
          // Boss starcruiser
          ctx.beginPath();
          ctx.moveTo(e.x, e.y + e.radius);
          ctx.lineTo(e.x - e.radius, e.y - e.radius);
          ctx.lineTo(e.x + e.radius, e.y - e.radius);
          ctx.closePath();
          ctx.fill();

          // Boss HP bar
          const barWidth = 90;
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(e.x - barWidth / 2, e.y - e.radius - 16, barWidth, 6);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(e.x - barWidth / 2, e.y - e.radius - 16, (barWidth * e.hp) / e.maxHp, 6);
        } else {
          // Drone / Scout triangular ship
          ctx.beginPath();
          ctx.moveTo(e.x, e.y + e.radius);
          ctx.lineTo(e.x - e.radius * 0.8, e.y - e.radius * 0.8);
          ctx.lineTo(e.x + e.radius * 0.8, e.y - e.radius * 0.8);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });

      // 5. Draw PowerUps
      powerUpsRef.current.forEach((pu) => {
        ctx.save();
        ctx.fillStyle = pu.type === 'triple' ? '#38bdf8' : pu.type === 'shield' ? '#10b981' : '#f59e0b';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px bold sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pu.type === 'triple' ? '3X' : pu.type === 'shield' ? 'S' : 'B', pu.x, pu.y);
        ctx.restore();
      });

      // 6. Draw Player
      const player = playerRef.current;
      const isBlinking = player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 4) % 2 === 0;

      if (!isBlinking && gameState !== 'gameover') {
        ctx.save();
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 12;

        // Thruster flame
        const flamePulse = Math.random() * 6 + 10;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(player.x - 6, player.y + 14);
        ctx.lineTo(player.x + 6, player.y + 14);
        ctx.lineTo(player.x, player.y + 14 + flamePulse);
        ctx.closePath();
        ctx.fill();

        // Ship body
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(player.x, player.y - 18);
        ctx.lineTo(player.x - 16, player.y + 14);
        ctx.lineTo(player.x, player.y + 8);
        ctx.lineTo(player.x + 16, player.y + 14);
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(player.x, player.y - 4, 3, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shield Bubble
        if (player.shield) {
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(player.x, player.y, 25, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 7. Draw Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.035;
        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    const takePlayerHit = () => {
      setLives((prev) => {
        const next = prev - 1;
        sound.playExplosion();
        spawnExplosion(playerRef.current.x, playerRef.current.y, '#38bdf8', 25);
        if (next <= 0) {
          setGameState('gameover');
          sound.playGameOver();
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('space_highscore', score.toString());
          }
          if (onGameOver) onGameOver(score);
        } else {
          playerRef.current.invincibleTimer = 80;
        }
        return next;
      });
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, score, highScore, onScoreUpdate, onGameOver]);

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full select-none">
      {/* Top Bar HUD */}
      <div className="flex items-center justify-between w-full max-w-[480px] mb-3 px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Score</div>
            <div className="text-xl font-bold font-arcade text-sky-400">{score}</div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Best</div>
            <div className="text-xl font-bold font-arcade text-amber-400">{Math.max(score, highScore)}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {shieldActive && (
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/80 rounded">
              <Shield className="w-3.5 h-3.5" /> Shield
            </div>
          )}
          <div className="flex items-center gap-1 text-rose-500">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 ${i < lives ? 'fill-rose-500 text-rose-500' : 'text-slate-700'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Screen Canvas */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-black">
        <canvas
          ref={canvasRef}
          width={480}
          height={520}
          className="w-[320px] h-[360px] sm:w-[420px] sm:h-[460px] md:w-[480px] md:h-[520px] block"
        />

        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
            <h2 className="text-3xl font-extrabold font-arcade text-sky-400 mb-2">GALACTIC DEFENDER</h2>
            <p className="text-sm text-slate-300 max-w-xs mb-6">
              Arrow keys / WASD to fly. Hold SPACE to fire laser cannons. Collect weapon power-ups!
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-sky-500/30 flex items-center gap-2 transform active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              LAUNCH MISSION
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-fade-in">
            <div className="text-xs uppercase tracking-widest text-rose-400 font-bold mb-1">M.I.A.</div>
            <h3 className="text-3xl font-extrabold font-arcade text-white mb-2">STARFIGHTER DESTROYED</h3>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 w-56">
              <div className="text-xs text-slate-400">Final Score</div>
              <div className="text-3xl font-bold font-arcade text-sky-400 mb-2">{score}</div>
              <div className="text-xs text-slate-400">High Score: <span className="text-amber-400 font-bold">{highScore}</span></div>
            </div>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-sky-500/25 flex items-center gap-2 transform active:scale-95"
            >
              <RotateCcw className="w-5 h-5" /> RE-ENGAGE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
