export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type Lane = -1 | 0 | 1;

export type PowerUpType = 'MAGNET' | 'SHIELD' | 'BOOST' | 'MULTIPLIER';

export interface ActivePowerUp {
  type: PowerUpType;
  duration: number; // remaining seconds
  maxDuration: number;
}

export type ObstacleType =
  | 'TREE_HURDLE'      // Low obstacle: Jump over
  | 'STONE_ARCH'       // High obstacle: Slide under
  | 'FIRE_JET'         // Lane hazard: Dodge left/right
  | 'SPIKE_ROLLER'     // Low-mid obstacle: Jump or Slide
  | 'BROKEN_FLOOR'     // Floor gap: Jump over or switch lane
  | 'TEMPLE_PILLAR';   // Side blocker: Steer around

export interface CharacterSkin {
  id: string;
  name: string;
  subtitle: string;
  shirtColor: number;
  pantsColor: number;
  hatColor: number;
  skinTone: number;
  price: number;
  unlocked: boolean;
  perkDescription: string;
}

export interface PlayerStats {
  coins: number;
  highScore: number;
  maxDistance: number;
  runsCount: number;
  totalCoinsCollected: number;
  selectedSkinId: string;
  upgrades: {
    magnetDuration: number; // 1 - 5
    shieldDuration: number; // 1 - 5
    boostSpeed: number;     // 1 - 5
    coinMultiplier: number; // 1 - 5
  };
}

export interface RunSummary {
  distance: number;
  coins: number;
  score: number;
  isNewHigh: boolean;
  powerUpsUsed: number;
  stumbles: number;
}

export interface GameHUDProps {
  score: number;
  distance: number;
  coins: number;
  multiplier: number;
  activePowerUps: ActivePowerUp[];
  beastProximity: number; // 0 to 1 (1 = directly on your neck!)
  onPause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}
