import React, { useState, useRef, useEffect } from 'react';
import { GameMetadata } from '../types/game';
import { sound } from '../utils/audio';
import {
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Star,
  ExternalLink,
  ShieldAlert,
  Info,
  Keyboard,
  Share2,
  RotateCcw,
} from 'lucide-react';

// Game components
import SnakeGame from '../games/SnakeGame';
import Game2048 from '../games/Game2048';
import SpaceShooterGame from '../games/SpaceShooterGame';
import BrickBreakerGame from '../games/BrickBreakerGame';
import FlappyBirdGame from '../games/FlappyBirdGame';
import DinoRunnerGame from '../games/DinoRunnerGame';
import PongGame from '../games/PongGame';
import MinesweeperGame from '../games/MinesweeperGame';
import TurboRacerGame from '../games/TurboRacerGame';
import MemoryMatchGame from '../games/MemoryMatchGame';

interface GamePlayerProps {
  game: GameMetadata | null;
  customGame?: { title: string; srcDocOrUrl: string; isUrl: boolean } | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onPanicTrigger: () => void;
}

export default function GamePlayer({
  game,
  customGame,
  onClose,
  isFavorite,
  onToggleFavorite,
  onPanicTrigger,
}: GamePlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [showControlsGuide, setShowControlsGuide] = useState<boolean>(false);
  const [gameKey, setGameKey] = useState<number>(0);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleRestart = () => {
    setGameKey((k) => k + 1);
  };

  const openAboutBlankCloaked = () => {
    // Standard stealth unblocked technique: open about:blank window and embed content
    const win = window.open('about:blank', '_blank');
    if (!win) return;
    win.document.title = 'Google Docs';
    const iframe = win.document.createElement('iframe');
    iframe.style.width = '100vw';
    iframe.style.height = '100vh';
    iframe.style.border = 'none';
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.src = window.location.href;
    win.document.body.style.margin = '0';
    win.document.body.appendChild(iframe);
  };

  if (!game && !customGame) return null;

  const title = customGame ? customGame.title : game!.title;
  const description = customGame ? 'Custom Sandboxed Web Game' : game!.description;
  const controls = game?.controls;

  const renderActiveGame = () => {
    if (customGame) {
      if (customGame.isUrl) {
        return (
          <iframe
            src={customGame.srcDocOrUrl}
            title={customGame.title}
            className="w-full h-full border-0 rounded-2xl bg-black min-h-[500px]"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        );
      } else {
        return (
          <iframe
            srcDoc={customGame.srcDocOrUrl}
            title={customGame.title}
            className="w-full h-full border-0 rounded-2xl bg-black min-h-[500px]"
            sandbox="allow-scripts allow-same-origin"
          />
        );
      }
    }

    switch (game!.id) {
      case 'snake':
        return <SnakeGame key={gameKey} isMuted={isMuted} />;
      case '2048':
        return <Game2048 key={gameKey} isMuted={isMuted} />;
      case 'space-shooter':
        return <SpaceShooterGame key={gameKey} isMuted={isMuted} />;
      case 'brick-breaker':
        return <BrickBreakerGame key={gameKey} isMuted={isMuted} />;
      case 'flappy-bird':
        return <FlappyBirdGame key={gameKey} isMuted={isMuted} />;
      case 'dino-runner':
        return <DinoRunnerGame key={gameKey} isMuted={isMuted} />;
      case 'pong':
        return <PongGame key={gameKey} isMuted={isMuted} />;
      case 'minesweeper':
        return <MinesweeperGame key={gameKey} isMuted={isMuted} />;
      case 'turbo-racer':
        return <TurboRacerGame key={gameKey} isMuted={isMuted} />;
      case 'memory-match':
        return <MemoryMatchGame key={gameKey} isMuted={isMuted} />;
      default:
        return <div className="text-white p-8">Game module loading...</div>;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-4 md:p-6'
      }`}
    >
      {/* Top Player Action Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between shadow-2xl mb-3 shrink-0">
        {/* Game Title & Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="Back to Hub"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold font-arcade text-white tracking-wide">
                {title}
              </h2>
              {game?.badge && (
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {game.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 hidden md:block line-clamp-1">{description}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {game && (
            <button
              onClick={() => onToggleFavorite(game.id)}
              className={`p-2 rounded-xl border transition-colors ${
                isFavorite
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700/60'
              }`}
              title="Add to Favorites"
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
          )}

          {controls && (
            <button
              onClick={() => setShowControlsGuide(!showControlsGuide)}
              className={`p-2 rounded-xl border transition-colors ${
                showControlsGuide
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700/60'
              }`}
              title="Controls Guide"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={handleRestart}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title="Restart Game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={openAboutBlankCloaked}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold"
            title="Pop out game into about:blank to hide browser history"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Stealth Tab</span>
          </button>

          <button
            onClick={onPanicTrigger}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/70 text-rose-300 border border-rose-800/80 text-xs font-bold hover:bg-rose-900 transition-colors"
            title="Emergency Panic Key (or press ~)"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Panic [~]</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/30"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Optional Controls overlay dropdown */}
      {showControlsGuide && controls && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-xl mb-3 shrink-0 flex flex-wrap items-center justify-between gap-4 animate-fade-in">
          <div>
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Keyboard className="w-4 h-4" /> Controls & Keybindings
            </div>
            <div className="flex flex-wrap gap-2">
              {controls.keyboard.map((k, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-sm">{controls.description}</p>
        </div>
      )}

      {/* Main Game Screen Canvas Arena */}
      <div className="flex-1 bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-inner">
        {renderActiveGame()}
      </div>
    </div>
  );
}
