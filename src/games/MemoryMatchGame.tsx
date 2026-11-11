import React, { useState, useEffect } from 'react';
import { sound } from '../utils/audio';
import { RotateCcw, Trophy, Sparkles, Zap, Shield, Flame, Compass, Eye, Heart, Cpu, Rocket } from 'lucide-react';

interface MemoryMatchGameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  isMuted?: boolean;
}

interface Card {
  id: number;
  symbolIndex: number;
  isFlipped: boolean;
  isMatched: boolean;
}

const SYMBOL_ICONS = [Zap, Shield, Flame, Compass, Eye, Heart, Cpu, Rocket];
const SYMBOL_COLORS = [
  'text-amber-400',
  'text-cyan-400',
  'text-rose-400',
  'text-emerald-400',
  'text-purple-400',
  'text-pink-400',
  'text-blue-400',
  'text-orange-400',
];

export default function MemoryMatchGame({ onScoreUpdate }: MemoryMatchGameProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);

  const initGame = () => {
    const symbols = [0, 1, 2, 3, 4, 5, 6, 7];
    const deck = [...symbols, ...symbols]
      .sort(() => Math.random() - 0.5)
      .map((sym, idx) => ({
        id: idx,
        symbolIndex: sym,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(deck);
    setFlippedCards([]);
    setMoves(0);
    setScore(0);
    setStreak(0);
    setIsWon(false);
    sound.playClick();
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    sound.playClick();
    const newCards = cards.map((c) => (c.id === id ? { ...c, isFlipped: true } : c));
    const newFlipped = [...flippedCards, id];
    setCards(newCards);
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstId, secondId] = newFlipped;
      const c1 = newCards.find((c) => c.id === firstId)!;
      const c2 = newCards.find((c) => c.id === secondId)!;

      if (c1.symbolIndex === c2.symbolIndex) {
        // Matched
        sound.playPoint();
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        const gainedScore = 100 * nextStreak;
        const totalScore = score + gainedScore;
        setScore(totalScore);
        if (onScoreUpdate) onScoreUpdate(totalScore);

        setTimeout(() => {
          const matchedCards = newCards.map((c) =>
            c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
          );
          setCards(matchedCards);
          setFlippedCards([]);

          if (matchedCards.every((c) => c.isMatched)) {
            setIsWon(true);
            sound.playVictory();
          }
        }, 400);
      } else {
        // No match
        setStreak(0);
        setTimeout(() => {
          setCards(
            newCards.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedCards([]);
        }, 850);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full select-none">
      {/* HUD Bar */}
      <div className="flex items-center justify-between w-full max-w-[420px] mb-4 px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-sm">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Score</div>
          <div className="text-xl font-bold font-arcade text-purple-400">{score}</div>
        </div>

        <div className="text-center">
          <div className="text-[10px] text-slate-400">Streak Combo</div>
          <div className="text-sm font-bold text-amber-400 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> {streak}x
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Moves</div>
          <div className="text-xl font-bold font-arcade text-slate-200">{moves}</div>
        </div>
      </div>

      {/* Grid */}
      <div className="relative bg-slate-900 border-2 border-slate-800 rounded-2xl p-3 shadow-2xl w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] md:w-[420px] md:h-[420px]">
        <div className="grid grid-cols-4 grid-rows-4 gap-2.5 w-full h-full">
          {cards.map((card) => {
            const Icon = SYMBOL_ICONS[card.symbolIndex];
            const colorClass = SYMBOL_COLORS[card.symbolIndex];

            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={card.isFlipped || card.isMatched}
                className={`relative rounded-xl border flex items-center justify-center transition-all duration-300 transform perspective-1000 ${
                  card.isFlipped || card.isMatched
                    ? 'bg-slate-950 border-purple-500/60 shadow-lg shadow-purple-500/20 rotate-y-180'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 shadow active:scale-95'
                }`}
              >
                {card.isFlipped || card.isMatched ? (
                  <Icon className={`w-8 h-8 sm:w-10 sm:h-10 ${colorClass}`} />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-slate-700/80 border border-slate-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Win Modal */}
        {isWon && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <Trophy className="w-16 h-16 text-amber-400 mb-2 animate-bounce" />
            <h3 className="text-3xl font-extrabold font-arcade text-purple-400 mb-2">MATRIX SOLVED!</h3>
            <p className="text-sm text-slate-300 mb-4">You matched all cyber symbols in {moves} moves!</p>
            <div className="text-lg font-bold font-arcade text-amber-400 mb-6">Final Score: {score}</div>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4" /> PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
