export type GameCategory = 'all' | 'action' | 'retro' | 'arcade' | 'puzzle' | '2-player' | 'casual';

export interface GameMetadata {
  id: string;
  title: string;
  description: string;
  category: GameCategory;
  tags: string[];
  controls: {
    keyboard: string[];
    description: string;
  };
  releaseYear?: string;
  badge?: string;
  accentColor: string;
  bgColor: string;
  iconName: string;
}

export interface GameScore {
  gameId: string;
  highScore: number;
  playCount: number;
  lastPlayed: number;
}

export interface CloakProfile {
  id: string;
  name: string;
  title: string;
  favicon: string; // SVG or data URL
}
