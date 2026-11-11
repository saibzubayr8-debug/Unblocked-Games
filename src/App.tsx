/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import GameCard from './components/GameCard';
import GamePlayer from './components/GamePlayer';
import PanicScreen from './components/PanicScreen';
import CustomGameModal from './components/CustomGameModal';
import { GAMES_LIST } from './data/gamesList';
import { GameCategory, GameMetadata } from './types/game';
import { applyCloak, getSavedCloak } from './utils/cloaker';
import { sound } from './utils/audio';
import {
  Sparkles,
  Gamepad2,
  Flame,
  Shield,
  Zap,
  Star,
  ExternalLink,
  Code,
  Layers,
  HelpCircle,
  Play,
  RotateCcw,
  PlusCircle,
  Award,
} from 'lucide-react';

const CATEGORIES: { id: GameCategory; label: string }[] = [
  { id: 'all', label: 'All Games' },
  { id: 'retro', label: 'Retro' },
  { id: 'arcade', label: 'Arcade' },
  { id: 'action', label: 'Action' },
  { id: 'puzzle', label: 'Puzzle' },
  { id: '2-player', label: '2-Player' },
  { id: 'casual', label: 'Casual' },
];

export default function App() {
  const [selectedGame, setSelectedGame] = useState<GameMetadata | null>(null);
  const [customGame, setCustomGame] = useState<{ title: string; srcDocOrUrl: string; isUrl: boolean } | null>(null);
  const [activeCategory, setActiveCategory] = useState<GameCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [isPanicActive, setIsPanicActive] = useState<boolean>(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [activeCloak, setActiveCloak] = useState<string>(() => getSavedCloak());

  // Favorites stored in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nova_favorites');
      return saved ? JSON.parse(saved) : ['snake', 'space-shooter', '2048'];
    } catch {
      return ['snake', 'space-shooter', '2048'];
    }
  });

  // High scores stored in localStorage
  const [highScores, setHighScores] = useState<Record<string, number>>(() => {
    return {
      snake: parseInt(localStorage.getItem('snake_highscore') || '0', 10),
      '2048': parseInt(localStorage.getItem('2048_highscore') || '0', 10),
      'space-shooter': parseInt(localStorage.getItem('space_highscore') || '0', 10),
      'brick-breaker': parseInt(localStorage.getItem('breakout_highscore') || '0', 10),
      'flappy-bird': parseInt(localStorage.getItem('flappy_highscore') || '0', 10),
      'dino-runner': parseInt(localStorage.getItem('dino_highscore') || '0', 10),
      'turbo-racer': parseInt(localStorage.getItem('racer_highscore') || '0', 10),
    };
  });

  // Apply saved cloak profile on mount
  useEffect(() => {
    applyCloak(activeCloak);
  }, [activeCloak]);

  // Global Panic Key listener (`~` or `Esc`)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        setIsPanicActive((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSelectCloak = (id: string) => {
    setActiveCloak(id);
    applyCloak(id);
  };

  const toggleFavorite = (gameId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sound.playClick();
    setFavorites((prev) => {
      const next = prev.includes(gameId) ? prev.filter((id) => id !== gameId) : [...prev, gameId];
      localStorage.setItem('nova_favorites', JSON.stringify(next));
      return next;
    });
  };

  const handleLaunchCustomGame = (title: string, srcDocOrUrl: string, isUrl: boolean) => {
    setCustomGame({ title, srcDocOrUrl, isUrl });
    setSelectedGame(null);
  };

  // Filtered games
  const filteredGames = useMemo(() => {
    return GAMES_LIST.filter((game) => {
      // Category match
      if (activeCategory !== 'all' && game.category !== activeCategory) {
        return false;
      }
      // Favorites filter
      if (favoritesOnly && !favorites.includes(game.id)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = game.title.toLowerCase().includes(q);
        const matchesDesc = game.description.toLowerCase().includes(q);
        const matchesTags = game.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [activeCategory, favoritesOnly, favorites, searchQuery]);

  // Featured hero game
  const featuredGame = GAMES_LIST.find((g) => g.id === 'space-shooter') || GAMES_LIST[0];

  return (
    <div className="min-h-screen bg-[#080c16] text-slate-100 flex flex-col font-sans">
      {/* Panic Screen Disguise Overlay */}
      {isPanicActive && <PanicScreen onDismiss={() => setIsPanicActive(false)} />}

      {/* Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCloak={activeCloak}
        onSelectCloak={handleSelectCloak}
        onTriggerPanic={() => setIsPanicActive(true)}
        onOpenCustomGameModal={() => setIsCustomModalOpen(true)}
        favoritesOnly={favoritesOnly}
        onToggleFavoritesOnly={() => setFavoritesOnly(!favoritesOnly)}
        favoriteCount={favorites.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Hero Featured Game Banner (shown when no search/favorites filter is active) */}
        {!searchQuery && !favoritesOnly && activeCategory === 'all' && (
          <div className="relative rounded-3xl overflow-hidden border border-indigo-900/60 shadow-2xl bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Background neon grid pattern */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="relative z-10 max-w-xl space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>HOT RELEASE • UNBLOCKED & FULLY PLAYABLE</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black font-arcade tracking-wide text-white leading-tight">
                {featuredGame.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {featuredGame.description} Complete with multi-directional thrusters, shield powerups, and boss battles!
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  onClick={() => {
                    sound.playClick();
                    setSelectedGame(featuredGame);
                  }}
                  className="px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 font-extrabold rounded-2xl shadow-xl shadow-indigo-500/25 flex items-center gap-2.5 transition-all transform active:scale-95 text-sm"
                >
                  <Play className="w-5 h-5 fill-current" />
                  PLAY NOW
                </button>

                <button
                  onClick={() => setIsCustomModalOpen(true)}
                  className="px-5 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-semibold rounded-2xl border border-slate-700/80 text-sm flex items-center gap-2 transition-colors"
                >
                  <PlusCircle className="w-4 h-4 text-indigo-400" />
                  Add Custom Game
                </button>
              </div>
            </div>

            {/* Quick feature callouts badge */}
            <div className="relative z-10 grid grid-cols-2 gap-3 w-full max-w-sm">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Stealth Tab Cloak</div>
                <div className="text-[11px] text-slate-400">Masks as Docs & Classroom</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center mb-2">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Panic Key [~]</div>
                <div className="text-[11px] text-slate-400">Instant emergency disguise</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2">
                  <Award className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">High Score Tracker</div>
                <div className="text-[11px] text-slate-400">Locally saved progress</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2">
                  <Code className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">HTML5 & Web Audio</div>
                <div className="text-[11px] text-slate-400">Zero plugins or ads</div>
              </div>
            </div>
          </div>
        )}

        {/* Category Filter Navigation Bar */}
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  sound.playClick();
                  setActiveCategory(cat.id);
                  if (favoritesOnly) setFavoritesOnly(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-arcade tracking-wider transition-all whitespace-nowrap ${
                  activeCategory === cat.id && !favoritesOnly
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400 font-medium whitespace-nowrap hidden sm:block">
            Showing <strong className="text-indigo-400">{filteredGames.length}</strong> games
          </div>
        </div>

        {/* Game Cards Grid */}
        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onSelect={(g) => setSelectedGame(g)}
                isFavorite={favorites.includes(game.id)}
                onToggleFavorite={toggleFavorite}
                highScore={highScores[game.id]}
              />
            ))}

            {/* Custom Game Creation Card */}
            <div
              onClick={() => {
                sound.playClick();
                setIsCustomModalOpen(true);
              }}
              className="group border-2 border-dashed border-slate-800 hover:border-indigo-500/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:bg-indigo-950/10 min-h-[260px]"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <PlusCircle className="w-7 h-7" />
              </div>
              <h3 className="font-bold font-arcade text-white text-base group-hover:text-indigo-400 mb-1">
                Custom Web Game
              </h3>
              <p className="text-xs text-slate-400 max-w-[200px] mb-3">
                Load external HTML5 games, iframes, or run custom code sandbox.
              </p>
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                Launch Sandbox →
              </span>
            </div>
          </div>
        ) : (
          /* Empty Search / Filter State */
          <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800">
            <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold font-arcade text-white mb-1">No Games Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              We couldn't find any games matching "{searchQuery}". Try searching for snake, 2048, or shooter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
                setFavoritesOnly(false);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Interactive Game Player Arena */}
      {(selectedGame || customGame) && (
        <GamePlayer
          game={selectedGame}
          customGame={customGame}
          onClose={() => {
            setSelectedGame(null);
            setCustomGame(null);
          }}
          isFavorite={selectedGame ? favorites.includes(selectedGame.id) : false}
          onToggleFavorite={(id) => toggleFavorite(id)}
          onPanicTrigger={() => setIsPanicActive(true)}
        />
      )}

      {/* Custom Game Embed Modal */}
      <CustomGameModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onLaunchCustomGame={handleLaunchCustomGame}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/80 py-8 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold font-arcade text-slate-300">NOVA UNBLOCKED</span>
            <span>•</span>
            <span>Fast, lightweight HTML5 arcade games with stealth tab cloaking.</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPanicActive(true)}
              className="hover:text-rose-400 transition-colors"
            >
              Panic Mode [~]
            </button>
            <span>•</span>
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="hover:text-indigo-400 transition-colors"
            >
              Sandbox Embed
            </button>
            <span>•</span>
            <span className="text-slate-600">Local Storage Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
