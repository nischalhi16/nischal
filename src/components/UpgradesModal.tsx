import React, { useState } from 'react';
import { CharacterSkin, PlayerStats } from '../types';
import { X, Zap, Shield, Flame, Sparkles, Check, Lock, ChevronUp } from 'lucide-react';

interface UpgradesModalProps {
  stats: PlayerStats;
  skins: CharacterSkin[];
  onClose: () => void;
  onUpgrade: (statKey: keyof PlayerStats['upgrades'], cost: number) => void;
  onSelectSkin: (skinId: string) => void;
  onUnlockSkin: (skin: CharacterSkin) => void;
}

export const UpgradesModal: React.FC<UpgradesModalProps> = ({
  stats,
  skins,
  onClose,
  onUpgrade,
  onSelectSkin,
  onUnlockSkin,
}) => {
  const [activeTab, setActiveTab] = useState<'UPGRADES' | 'SKINS'>('UPGRADES');

  // Upgrade definitions
  const upgradeItems = [
    {
      key: 'magnetDuration' as const,
      name: 'GOLD MAGNET',
      desc: 'Pulls nearby relics and golden coins toward your path.',
      level: stats.upgrades.magnetDuration,
      cost: stats.upgrades.magnetDuration * 150,
      icon: <Zap className="w-5 h-5 text-amber-400" />,
    },
    {
      key: 'shieldDuration' as const,
      name: 'AEGIS SHIELD',
      desc: 'Mystical barrier that absorbs fatal obstacles and spike traps.',
      level: stats.upgrades.shieldDuration,
      cost: stats.upgrades.shieldDuration * 200,
      icon: <Shield className="w-5 h-5 text-cyan-400" />,
    },
    {
      key: 'boostSpeed' as const,
      name: 'JUNGLE SPRINT',
      desc: 'Invulnerable turbo burst rushing through ancient hazards.',
      level: stats.upgrades.boostSpeed,
      cost: stats.upgrades.boostSpeed * 250,
      icon: <Flame className="w-5 h-5 text-orange-500" />,
    },
    {
      key: 'coinMultiplier' as const,
      name: 'RUBY MULTIPLIER',
      desc: 'Doubles all score and relic gains during active run.',
      level: stats.upgrades.coinMultiplier,
      cost: stats.upgrades.coinMultiplier * 300,
      icon: <Sparkles className="w-5 h-5 text-pink-400" />,
    },
  ];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/75">
      <div className="relative w-full max-w-xl bg-[#131715] border-2 border-amber-700/60 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh]">
        {/* Ancient decorative corner brackets */}
        <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-500/80 rounded-tl-lg" />
        <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-500/80 rounded-tr-lg" />
        <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-500/80 rounded-bl-lg" />
        <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-500/80 rounded-br-lg" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-900/40">
          <div className="flex items-center gap-3">
            <h2 className="font-cinzel text-xl sm:text-2xl font-black text-amber-300 tracking-wider">
              TEMPLE VAULT
            </h2>
            {/* Coins balance */}
            <div className="flex items-center gap-1.5 bg-[#0d100f] border border-amber-800/40 px-2.5 py-1 rounded-lg">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-300 to-amber-600 border border-amber-200 flex items-center justify-center">
                <span className="text-[9px] font-black text-amber-950">¢</span>
              </div>
              <span className="font-mono font-bold text-amber-300 text-sm">{stats.coins}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-200 hover:bg-amber-950/40 transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 my-4 bg-[#0d100f] p-1 rounded-xl border border-amber-900/40">
          <button
            onClick={() => setActiveTab('UPGRADES')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'UPGRADES'
                ? 'bg-amber-600/30 text-amber-200 border border-amber-500/50 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            POWER-UP ABILITIES
          </button>
          <button
            onClick={() => setActiveTab('SKINS')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'SKINS'
                ? 'bg-amber-600/30 text-amber-200 border border-amber-500/50 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            EXPLORERS ROSTER
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
          {activeTab === 'UPGRADES' ? (
            upgradeItems.map((item) => {
              const isMax = item.level >= 5;
              const canAfford = stats.coins >= item.cost;
              return (
                <div
                  key={item.key}
                  className="bg-[#181d1a] border border-amber-900/30 rounded-2xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-black/40 border border-amber-700/30 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-cinzel font-bold text-amber-200 text-sm tracking-wide">
                          {item.name}
                        </span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <div
                              key={lvl}
                              className={`w-2.5 h-2.5 rounded-sm ${
                                lvl <= item.level ? 'bg-amber-400 shadow-sm' : 'bg-stone-800 border border-stone-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-stone-400 mt-1 max-w-xs">{item.desc}</p>
                    </div>
                  </div>

                  {isMax ? (
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-950/40 border border-amber-800/50 px-3 py-1.5 rounded-lg uppercase tracking-wider shrink-0">
                      MAX LEVEL
                    </span>
                  ) : (
                    <button
                      onClick={() => onUpgrade(item.key, item.cost)}
                      disabled={!canAfford}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 transition-all ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 shadow-md cursor-pointer'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                      }`}
                    >
                      <ChevronUp className="w-4 h-4" />
                      <span>{item.cost} ¢</span>
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {skins.map((skin) => {
                const isSelected = stats.selectedSkinId === skin.id;
                const canAfford = stats.coins >= skin.price;

                return (
                  <div
                    key={skin.id}
                    className={`bg-[#181d1a] border rounded-2xl p-4 flex flex-col items-center text-center justify-between transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-950/20 shadow-md'
                        : 'border-amber-900/30 hover:border-amber-700/50'
                    }`}
                  >
                    {/* Visual Preview Swatches */}
                    <div className="w-14 h-14 rounded-full border-2 border-amber-500/50 mb-3 flex items-center justify-center p-1 bg-black/40">
                      <div
                        className="w-full h-full rounded-full"
                        style={{
                          background: `linear-gradient(135deg, #${skin.hatColor.toString(16).padStart(6, '0')}, #${skin.shirtColor.toString(16).padStart(6, '0')})`,
                        }}
                      />
                    </div>

                    <div className="flex flex-col mb-4">
                      <span className="font-cinzel font-bold text-amber-200 text-sm">{skin.name}</span>
                      <span className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider">
                        {skin.subtitle}
                      </span>
                      <p className="text-[11px] text-stone-400 mt-2">{skin.perkDescription}</p>
                    </div>

                    {skin.unlocked ? (
                      isSelected ? (
                        <div className="w-full py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          EQUIPPED
                        </div>
                      ) : (
                        <button
                          onClick={() => onSelectSkin(skin.id)}
                          className="w-full py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-200 border border-stone-600 text-xs font-bold transition-colors cursor-pointer"
                        >
                          SELECT
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => onUnlockSkin(skin)}
                        disabled={!canAfford}
                        className={`w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 shadow-md cursor-pointer'
                            : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>UNLOCK {skin.price} ¢</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
