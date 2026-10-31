/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import {
  ActivePowerUp,
  CharacterSkin,
  GameState,
  PlayerStats,
  RunSummary,
} from './types';
import { sound } from './audio/SoundEffects';
import { GameHUD } from './components/GameHUD';
import { TitleScreen } from './components/TitleScreen';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { UpgradesModal } from './components/UpgradesModal';

// Default explorer skins
const DEFAULT_SKINS: CharacterSkin[] = [
  {
    id: 'guy_dangerous',
    name: 'Guy Dangerous',
    subtitle: 'Classic Explorer',
    shirtColor: 0xd8c8b0,
    pantsColor: 0x5a4838,
    hatColor: 0x5c3b1e,
    skinTone: 0xf5cda4,
    price: 0,
    unlocked: true,
    perkDescription: 'Balanced stamina and agile lane reflexes.',
  },
  {
    id: 'scarlett_fox',
    name: 'Scarlett Fox',
    subtitle: 'Nimble Tracker',
    shirtColor: 0x991b1b,
    pantsColor: 0x27272a,
    hatColor: 0x18181b,
    skinTone: 0xfad8b8,
    price: 350,
    unlocked: false,
    perkDescription: 'Swift sprint recovery from obstacle stumbles.',
  },
  {
    id: 'karma_lee',
    name: 'Karma Lee',
    subtitle: 'Mystic Monk',
    shirtColor: 0xd97706,
    pantsColor: 0x78350f,
    hatColor: 0xb45309,
    skinTone: 0xe6b98d,
    price: 800,
    unlocked: false,
    perkDescription: 'Greater magnet radius for golden temple relics.',
  },
];

const DEFAULT_STATS: PlayerStats = {
  coins: 0,
  highScore: 0,
  maxDistance: 0,
  runsCount: 0,
  totalCoinsCollected: 0,
  selectedSkinId: 'guy_dangerous',
  upgrades: {
    magnetDuration: 1,
    shieldDuration: 1,
    boostSpeed: 1,
    coinMultiplier: 1,
  },
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // React state for HUD and UI overlays
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [score, setScore] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [coinsRun, setCoinsRun] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
  const [beastProximity, setBeastProximity] = useState<number>(0);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [showUpgrades, setShowUpgrades] = useState<boolean>(false);

  // Persistent Player Stats & Skins
  const [stats, setStats] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem('temple_run_stats');
      if (saved) return { ...DEFAULT_STATS, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to load stats', e);
    }
    return DEFAULT_STATS;
  });

  const [skins, setSkins] = useState<CharacterSkin[]>(() => {
    try {
      const saved = localStorage.getItem('temple_run_skins');
      if (saved) {
        const parsed = JSON.parse(saved);
        return DEFAULT_SKINS.map((def) => {
          const match = parsed.find((p: CharacterSkin) => p.id === def.id);
          return match ? { ...def, unlocked: match.unlocked } : def;
        });
      }
    } catch (e) {
      console.warn('Failed to load skins', e);
    }
    return DEFAULT_SKINS;
  });

  // Save stats to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem('temple_run_stats', JSON.stringify(stats));
    } catch (e) {
      console.warn('Failed to save stats', e);
    }
  }, [stats]);

  // Save skins to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem('temple_run_skins', JSON.stringify(skins));
    } catch (e) {
      console.warn('Failed to save skins', e);
    }
  }, [skins]);

  // Initialize Three.js GameEngine once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const currentSkin = skins.find((s) => s.id === stats.selectedSkinId) || skins[0];

    const engine = new GameEngine(canvasMountRef.current, stats, currentSkin, {
      onScoreUpdate: (s, d, c, m) => {
        setScore(s);
        setDistance(d);
        setCoinsRun(c);
        setMultiplier(m);
      },
      onPowerUpsUpdate: (pups) => {
        setActivePowerUps(pups);
      },
      onBeastProximityUpdate: (prox) => {
        setBeastProximity(prox);
      },
      onGameOver: (summary) => {
        setRunSummary(summary);
        setGameState('GAMEOVER');

        // Update persistent stats
        setStats((prev) => ({
          ...prev,
          coins: prev.coins + summary.coins,
          totalCoinsCollected: prev.totalCoinsCollected + summary.coins,
          runsCount: prev.runsCount + 1,
          highScore: Math.max(prev.highScore, summary.score),
          maxDistance: Math.max(prev.maxDistance, summary.distance),
        }));
      },
      onStateChange: (state) => {
        setGameState(state);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Update engine when skin or stats changes
  useEffect(() => {
    if (engineRef.current) {
      const currentSkin = skins.find((s) => s.id === stats.selectedSkinId) || skins[0];
      engineRef.current.setSkin(currentSkin);
      engineRef.current.setStats(stats);
    }
  }, [stats.selectedSkinId, stats.upgrades]);

  // UI Handlers
  const handleStart = () => {
    engineRef.current?.startGame();
  };

  const handlePause = () => {
    engineRef.current?.togglePause();
  };

  const handleResume = () => {
    engineRef.current?.togglePause();
  };

  const handleRestart = () => {
    setRunSummary(null);
    engineRef.current?.restartGame();
  };

  const handleHome = () => {
    setRunSummary(null);
    setGameState('TITLE');
    engineRef.current?.dispose();
    if (canvasMountRef.current) {
      const currentSkin = skins.find((s) => s.id === stats.selectedSkinId) || skins[0];
      const engine = new GameEngine(canvasMountRef.current, stats, currentSkin, {
        onScoreUpdate: (s, d, c, m) => {
          setScore(s);
          setDistance(d);
          setCoinsRun(c);
          setMultiplier(m);
        },
        onPowerUpsUpdate: (pups) => {
          setActivePowerUps(pups);
        },
        onBeastProximityUpdate: (prox) => {
          setBeastProximity(prox);
        },
        onGameOver: (summary) => {
          setRunSummary(summary);
          setGameState('GAMEOVER');
          setStats((prev) => ({
            ...prev,
            coins: prev.coins + summary.coins,
            totalCoinsCollected: prev.totalCoinsCollected + summary.coins,
            runsCount: prev.runsCount + 1,
            highScore: Math.max(prev.highScore, summary.score),
            maxDistance: Math.max(prev.maxDistance, summary.distance),
          }));
        },
        onStateChange: (state) => {
          setGameState(state);
        },
      });
      engineRef.current = engine;
    }
  };

  const handleToggleMute = () => {
    const nextMute = sound.toggleMute();
    setIsMuted(nextMute);
  };

  const handleUpgrade = (statKey: keyof PlayerStats['upgrades'], cost: number) => {
    if (stats.coins >= cost) {
      setStats((prev) => ({
        ...prev,
        coins: prev.coins - cost,
        upgrades: {
          ...prev.upgrades,
          [statKey]: prev.upgrades[statKey] + 1,
        },
      }));
    }
  };

  const handleSelectSkin = (skinId: string) => {
    setStats((prev) => ({
      ...prev,
      selectedSkinId: skinId,
    }));
  };

  const handleUnlockSkin = (skinToUnlock: CharacterSkin) => {
    if (stats.coins >= skinToUnlock.price) {
      setStats((prev) => ({
        ...prev,
        coins: prev.coins - skinToUnlock.price,
        selectedSkinId: skinToUnlock.id,
      }));
      setSkins((prev) =>
        prev.map((s) => (s.id === skinToUnlock.id ? { ...s, unlocked: true } : s))
      );
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#091412]">
      {/* 1. Isolated WebGL Canvas Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 2. Active Game HUD */}
      {gameState === 'PLAYING' && (
        <GameHUD
          score={score}
          distance={distance}
          coins={coinsRun}
          multiplier={multiplier}
          activePowerUps={activePowerUps}
          beastProximity={beastProximity}
          onPause={handlePause}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 3. Title Screen */}
      {gameState === 'TITLE' && !showUpgrades && (
        <TitleScreen
          stats={stats}
          onStart={handleStart}
          onOpenUpgrades={() => setShowUpgrades(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 4. Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onHome={handleHome}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 5. Game Over Modal */}
      {gameState === 'GAMEOVER' && runSummary && (
        <GameOverModal
          summary={runSummary}
          onRestart={handleRestart}
          onHome={handleHome}
        />
      )}

      {/* 6. Temple Vault / Upgrades Modal */}
      {showUpgrades && (
        <UpgradesModal
          stats={stats}
          skins={skins}
          onClose={() => setShowUpgrades(false)}
          onUpgrade={handleUpgrade}
          onSelectSkin={handleSelectSkin}
          onUnlockSkin={handleUnlockSkin}
        />
      )}
    </div>
  );
}
