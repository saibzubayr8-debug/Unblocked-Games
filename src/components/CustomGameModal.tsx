import React, { useState } from 'react';
import { X, Globe, Code, Play, AlertCircle, Check } from 'lucide-react';
import { sound } from '../utils/audio';

interface CustomGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchCustomGame: (title: string, srcDocOrUrl: string, isUrl: boolean) => void;
}

const PRESET_CUSTOM_GAMES = [
  {
    title: 'Tic-Tac-Toe Neon',
    description: 'Quick 2-Player neon grid game built in pure HTML/JS.',
    code: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin:0; background:#090d16; color:#fff; font-family:sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; }
    h2 { margin:0 0 10px; color:#38bdf8; font-size:24px; }
    #status { margin-bottom:15px; font-size:16px; color:#cbd5e1; }
    .grid { display:grid; grid-template-columns:repeat(3, 90px); grid-template-rows:repeat(3, 90px); gap:8px; }
    .cell { background:#1e293b; border:2px solid #334155; border-radius:12px; font-size:36px; font-weight:bold; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.15s; }
    .cell:hover { background:#334155; }
    .cell.x { color:#38bdf8; text-shadow:0 0 10px #38bdf8; }
    .cell.o { color:#f43f5e; text-shadow:0 0 10px #f43f5e; }
    button { margin-top:20px; padding:10px 20px; background:#0284c7; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer; }
    button:hover { background:#0369a1; }
  </style>
</head>
<body>
  <h2>TIC-TAC-TOE NEON</h2>
  <div id="status">Player X's Turn</div>
  <div class="grid" id="board"></div>
  <button onclick="resetGame()">Restart Game</button>
  <script>
    let board = Array(9).fill('');
    let turn = 'X';
    let gameOver = false;
    const boardEl = document.getElementById('board');
    const statusEl = document.getElementById('status');

    function render() {
      boardEl.innerHTML = '';
      board.forEach((val, i) => {
        const div = document.createElement('div');
        div.className = 'cell ' + (val.toLowerCase());
        div.innerText = val;
        div.onclick = () => makeMove(i);
        boardEl.appendChild(div);
      });
    }

    function makeMove(i) {
      if (board[i] || gameOver) return;
      board[i] = turn;
      if (checkWin()) {
        statusEl.innerText = 'Player ' + turn + ' Wins!';
        gameOver = true;
      } else if (board.every(Boolean)) {
        statusEl.innerText = "It's a Draw!";
        gameOver = true;
      } else {
        turn = turn === 'X' ? 'O' : 'X';
        statusEl.innerText = "Player " + turn + "'s Turn";
      }
      render();
    }

    function checkWin() {
      const wins = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
      ];
      return wins.some(([a,b,c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
    }

    function resetGame() {
      board = Array(9).fill('');
      turn = 'X';
      gameOver = false;
      statusEl.innerText = "Player X's Turn";
      render();
    }
    render();
  </script>
</body>
</html>`,
  },
  {
    title: 'Neon Gravity Sandbox',
    description: 'Interactive physics particle simulation with mouse gravity attractor.',
    code: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin:0; background:#050811; overflow:hidden; font-family:sans-serif; }
    canvas { display:block; width:100vw; height:100vh; }
    .hint { position:absolute; top:12px; left:50%; transform:translateX(-50%); color:#94a3b8; font-size:13px; pointer-events:none; }
  </style>
</head>
<body>
  <div class="hint">Click or Drag anywhere to spawn glowing gravity particles</div>
  <canvas id="c"></canvas>
  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const particles = [];
    const colors = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#34d399', '#fbbf24'];

    function spawn(x, y) {
      for(let i=0; i<15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 4 + 2,
          life: 1
        });
      }
    }

    let isDown = false;
    window.addEventListener('pointerdown', (e) => { isDown = true; spawn(e.clientX, e.clientY); });
    window.addEventListener('pointerup', () => isDown = false);
    window.addEventListener('pointermove', (e) => { if(isDown) spawn(e.clientX, e.clientY); });

    function loop() {
      ctx.fillStyle = 'rgba(5, 8, 17, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for(let i=particles.length-1; i>=0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.life -= 0.008;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -0.7;
        if (p.y > canvas.height) { p.y = canvas.height; p.vy *= -0.6; }

        if (p.life <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
          ctx.fill();
          ctx.restore();
        }
      }
      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`,
  },
];

export default function CustomGameModal({ isOpen, onClose, onLaunchCustomGame }: CustomGameModalProps) {
  const [mode, setMode] = useState<'url' | 'code' | 'presets'>('presets');
  const [urlInput, setUrlInput] = useState<string>('');
  const [codeTitle, setCodeTitle] = useState<string>('My Custom Web Game');
  const [codeContent, setCodeContent] = useState<string>('');

  if (!isOpen) return null;

  const handleLaunchUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    let url = urlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    sound.playPoint();
    onLaunchCustomGame('Web Sandbox Game', url, true);
    onClose();
  };

  const handleLaunchCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeContent.trim()) return;
    sound.playPoint();
    onLaunchCustomGame(codeTitle || 'Custom HTML Game', codeContent, false);
    onClose();
  };

  const handleLaunchPreset = (title: string, code: string) => {
    sound.playPoint();
    onLaunchCustomGame(title, code, false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div>
            <h3 className="text-xl font-bold font-arcade text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              ADD CUSTOM / UNBLOCKED GAME
            </h3>
            <p className="text-xs text-slate-400">Run any HTML5 game or external web game in an unblocked sandbox.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-3 gap-3">
          <button
            onClick={() => setMode('presets')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
              mode === 'presets'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Instant Presets
          </button>
          <button
            onClick={() => setMode('url')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
              mode === 'url'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Embed Game URL
          </button>
          <button
            onClick={() => setMode('code')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
              mode === 'code'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Paste HTML / JS Code
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto">
          {mode === 'presets' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Choose a pre-packaged lightweight unblocked game to launch instantly in the player sandbox:
              </p>
              <div className="grid gap-3">
                {PRESET_CUSTOM_GAMES.map((p, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/50 transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-bold text-white font-arcade">{p.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{p.description}</div>
                    </div>
                    <button
                      onClick={() => handleLaunchPreset(p.title, p.code)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Play
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === 'url' && (
            <form onSubmit={handleLaunchUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  External Game URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="https://example.com/game.html"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                    required
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow"
                  >
                    <Play className="w-4 h-4 fill-current" /> Load
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-indigo-950/30 border border-indigo-900/50 rounded-xl text-xs text-indigo-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
                <span>
                  The game will be loaded securely inside an unblocked iframe sandbox. External sites must allow iframe embedding.
                </span>
              </div>
            </form>
          )}

          {mode === 'code' && (
            <form onSubmit={handleLaunchCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Game Title
                </label>
                <input
                  type="text"
                  value={codeTitle}
                  onChange={(e) => setCodeTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-indigo-500 mb-3"
                  required
                />

                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  HTML5 / JS / Canvas Code
                </label>
                <textarea
                  rows={8}
                  placeholder="<!DOCTYPE html><html><head>...</head><body><canvas></canvas><script>...</script></body></html>"
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-xl p-3 text-emerald-400 placeholder-slate-600 outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Launch Code
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
