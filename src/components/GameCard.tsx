import React from 'react';
import { GameMetadata } from '../types/game';
import { Star, Play, Zap, Rocket, Grid, Layers, Feather, Activity, Swords, Gauge, Bomb, BrainCircuit } from 'lucide-react';
import { sound } from '../utils/audio';

interface GameCardProps {
  game: GameMetadata;
  onSelect: (game: GameMetadata) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  highScore?: number;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  Rocket,
  Grid,
  Layers,
  Feather,
  Activity,
  Swords,
  Gauge,
  Bomb,
  BrainCircuit,
};

export default function GameCard({
  game,
  onSelect,
  isFavorite,
  onToggleFavorite,
  highScore = 0,
}: GameCardProps) {
  const IconComponent = ICON_MAP[game.iconName] || Zap;

  return (
    <div
      onClick={() => {
        sound.playClick();
        onSelect(game);
      }}
      className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Top Graphic Banner */}
      <div
        className="relative w-full h-36 rounded-xl overflow-hidden flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-[1.02]"
        style={{
          background: `radial-gradient(circle at center, ${game.accentColor}25 0%, #090d16 85%)`,
          borderColor: `${game.accentColor}30`,
        }}
      >
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px]" />

        {/* Center Glow Icon */}
        <div
          className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg"
          style={{
            backgroundColor: `${game.accentColor}20`,
            border: `1.5px solid ${game.accentColor}60`,
            boxShadow: `0 0 20px ${game.accentColor}30`,
          }}
        >
          <IconComponent className="w-8 h-8" style={{ color: game.accentColor }} />
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(game.id, e);
          }}
          className={`absolute top-2.5 right-2.5 z-20 p-2 rounded-xl backdrop-blur-md transition-all ${
            isFavorite
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-900'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
        </button>

        {/* Badge */}
        {game.badge && (
          <div className="absolute top-2.5 left-2.5 z-20 px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-950/80 backdrop-blur-md text-slate-200 border border-slate-800">
            {game.badge}
          </div>
        )}

        {/* Play Overlay on Hover */}
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/40 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Play className="w-4 h-4 fill-current" /> PLAY NOW
          </div>
        </div>
      </div>

      {/* Info Content */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold font-arcade text-white text-base group-hover:text-indigo-400 transition-colors">
            {game.title}
          </h3>
          {highScore > 0 && (
            <span className="text-[11px] font-arcade text-amber-400 font-semibold">
              Best: {highScore}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {game.description}
        </p>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-800 text-slate-300">
            {game.category}
          </span>
          {game.releaseYear && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-800/60 text-slate-400">
              {game.releaseYear}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
