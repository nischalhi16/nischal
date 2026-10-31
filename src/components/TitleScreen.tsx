import React from 'react';
import { PlayerStats } from '../types';
import { Play, ShoppingBag, Trophy, Volume2, VolumeX, Shield, Zap, Sparkles, Flame } from 'lucide-react';

interface TitleScreenProps {
  stats: PlayerStats;
  onStart: () => void;
  onOpenUpgrades: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  stats,
  onStart,
  onOpenUpgrades,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Top Header: Stats Badge & Mute Toggle */}
      <div className="w-full flex items-center justify-between">
        {/* High Score & Gold Badge */}
        <div className="pointer-events-auto flex items-center gap-4 bg-[#121614]/90 border border-amber-900/50 px-4 py-2 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-amber-500/80 font-bold">BEST RUN</span>
              <span className="font-mono text-sm font-extrabold text-[#f5ebd7] leading-tight">
                {stats.highScore.toLocaleString()} pts ({stats.maxDistance}m)
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-amber-900/40" />

          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-300 to-amber-600 border border-amber-200 flex items-center justify-center">
              <span className="text-[9px] font-black text-amber-950">¢</span>
            </div>
            <span className="font-mono font-bold text-amber-300 text-sm">{stats.coins}</span>
          </div>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={onToggleMute}
          className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-xl bg-[#121614]/90 border border-amber-900/50 text-amber-300 hover:text-amber-100 hover:bg-amber-950/60 transition-colors shadow-lg"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Center 30-40% Negative Space with bespoke Inline SVG Title Lockup */}
      <div className="w-full flex flex-col items-center text-center my-auto">
        <div className="max-w-xl w-full flex flex-col items-center">
          {/* Bespoke inline SVG Title Lockup */}
          <div className="w-full max-w-[480px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
            <svg viewBox="0 0 500 130" className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fff2a1" />
                  <stop offset="35%" stopColor="#e5a919" />
                  <stop offset="70%" stopColor="#ad7500" />
                  <stop offset="100%" stopColor="#684200" />
                </linearGradient>
                <linearGradient id="stoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#e2ded4" />
                  <stop offset="50%" stopColor="#9a9284" />
                  <stop offset="100%" stopColor="#4f483c" />
                </linearGradient>
                <filter id="relicGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Top Banner Tag */}
              <text
                x="250"
                y="24"
                textAnchor="middle"
                className="font-cinzel text-[11px] font-bold tracking-[0.35em] fill-amber-400"
              >
                — ANCIENT RUNNER 3D —
              </text>

              {/* Main TEMPLE ESCAPE Title */}
              <text
                x="250"
                y="74"
                textAnchor="middle"
                className="font-cinzel text-5xl sm:text-6xl font-black tracking-wider"
                fill="url(#goldGrad)"
                stroke="#1a1200"
                strokeWidth="2.5"
                filter="url(#relicGlow)"
              >
                TEMPLE ESCAPE
              </text>

              {/* Subtitle Bar: RELIC RUN */}
              <rect x="130" y="90" width="240" height="24" rx="12" fill="#181410" stroke="#b27f12" strokeWidth="1.5" />
              <text
                x="250"
                y="107"
                textAnchor="middle"
                className="font-cinzel text-xs font-black tracking-[0.4em] fill-amber-200"
              >
                RELIC RUN 3D
              </text>
            </svg>
          </div>

          <p className="mt-4 text-xs sm:text-sm text-stone-300/80 max-w-md font-medium tracking-wide">
            Escape the sacred temple ruins! Dodge ancient spike traps, leap fiery chasms, and outrun the Demon Guardian beast.
          </p>
        </div>
      </div>

      {/* Bottom Area: Action Buttons & Control Hints */}
      <div className="w-full flex flex-col items-center gap-4">
        {/* Buttons Row */}
        <div className="flex items-center gap-4 pointer-events-auto">
          {/* Start CTA */}
          <button
            onClick={onStart}
            className="group relative flex items-center gap-3 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.35)] hover:shadow-[0_0_40px_rgba(234,179,8,0.55)] transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none"
          >
            <Play className="w-5 h-5 fill-current" />
            <span className="font-cinzel text-lg tracking-widest">START RUN</span>
            <span className="text-[10px] font-mono bg-black/20 text-stone-900 px-2 py-0.5 rounded ml-1 font-bold">
              SPACE / ENTER
            </span>
          </button>

          {/* Upgrades & Vault */}
          <button
            onClick={onOpenUpgrades}
            className="flex items-center gap-2.5 bg-[#141816]/95 hover:bg-[#1c221f] text-amber-300 border border-amber-700/60 hover:border-amber-500 font-bold px-6 py-4 rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none"
          >
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <span className="font-cinzel text-sm tracking-wider">RELIC VAULT</span>
          </button>
        </div>

        {/* Single flat control-hint line */}
        <div className="text-xs text-amber-300/70 font-mono tracking-wider bg-black/50 px-4 py-1.5 rounded-full border border-amber-900/40">
          WASD or Arrow Keys to Move · Space Action · Esc Pause
        </div>
      </div>
    </div>
  );
};
