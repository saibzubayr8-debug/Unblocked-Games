import React, { useState } from 'react';
import {
  Gamepad2,
  Search,
  ShieldAlert,
  Eye,
  Star,
  PlusCircle,
  Volume2,
  VolumeX,
  X,
  ExternalLink,
} from 'lucide-react';
import { CLOAK_PROFILES } from '../utils/cloaker';
import { sound } from '../utils/audio';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCloak: string;
  onSelectCloak: (id: string) => void;
  onTriggerPanic: () => void;
  onOpenCustomGameModal: () => void;
  favoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  favoriteCount: number;
}

export default function Header({
  searchQuery,
  onSearchChange,
  activeCloak,
  onSelectCloak,
  onTriggerPanic,
  onOpenCustomGameModal,
  favoritesOnly,
  onToggleFavoritesOnly,
  favoriteCount,
}: HeaderProps) {
  const [showCloakDropdown, setShowCloakDropdown] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleCloakChange = (id: string) => {
    onSelectCloak(id);
    setShowCloakDropdown(false);
    sound.playClick();
  };

  const currentCloakProfile = CLOAK_PROFILES.find((p) => p.id === activeCloak) || CLOAK_PROFILES[0];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 transition-all select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold font-arcade text-xl sm:text-2xl tracking-wider text-white">
                NOVA
              </span>
              <span className="font-extrabold font-arcade text-xl sm:text-2xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                UNBLOCKED
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono hidden sm:block">
              HTML5 • RETRO • CLOAKED
            </div>
          </div>
        </div>

        {/* Center Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search games (Snake, 2048, Shooter, Pong...)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-9 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:bg-slate-900/90 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Favorites Filter button */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleFavoritesOnly();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              favoritesOnly
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
            title="Filter favorite games"
          >
            <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-amber-400' : ''}`} />
            <span className="hidden sm:inline">Favorites</span>
            {favoriteCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-[10px] rounded-full font-bold">
                {favoriteCount}
              </span>
            )}
          </button>

          {/* Add Custom Game / Sandbox */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenCustomGameModal();
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors hidden sm:flex"
            title="Add custom HTML or embed game"
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Custom</span>
          </button>

          {/* Tab Cloaker Selector */}
          <div className="relative">
            <button
              onClick={() => setShowCloakDropdown(!showCloakDropdown)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Disguise tab as Google Docs or Classroom"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">{currentCloakProfile.name.split(' ')[0]}</span>
            </button>

            {showCloakDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-fade-in">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 tracking-wider border-b border-slate-800 mb-1">
                  Tab Disguise / Cloaker
                </div>
                {CLOAK_PROFILES.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleCloakChange(profile.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                      activeCloak === profile.id
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{profile.name}</span>
                    {activeCloak === profile.id && <span className="text-[10px]">Active</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Emergency Panic Key */}
          <button
            onClick={() => {
              sound.playClick();
              onTriggerPanic();
            }}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all transform active:scale-95"
            title="Instant Panic Key (Press ~ or Esc)"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PANIC</span>
            <kbd className="hidden sm:inline font-mono bg-rose-700 px-1 py-0.2 rounded text-[10px]">~</kbd>
          </button>
        </div>
      </div>

      {/* Mobile search input */}
      <div className="px-4 pb-3 md:hidden">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-9 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>
      </div>
    </header>
  );
}
