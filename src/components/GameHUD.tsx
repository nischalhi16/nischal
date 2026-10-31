import React from 'react';
import { GameHUDProps, PowerUpType } from '../types';
import { Volume2, VolumeX, Pause, Shield, Zap, Sparkles, Flame } from 'lucide-react';

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  distance,
  coins,
  multiplier,
  activePowerUps,
  beastProximity,
  onPause,
  isMuted,
  onToggleMute,
}) => {
  const getPowerUpIcon = (type: PowerUpType) => {
    switch (type) {
      case 'SHIELD':
        return <Shield className="w-4 h-4 text-cyan-400" />;
      case 'BOOST':
        return <Flame className="w-4 h-4 text-orange-500" />;
      case 'MAGNET':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'MULTIPLIER':
        return <Sparkles className="w-4 h-4 text-pink-400" />;
    }
  };

  const getPowerUpLabel = (type: PowerUpType) => {
    switch (type) {
      case 'SHIELD':
        return 'AEGIS SHIELD';
      case 'BOOST':
        return 'HYPER SPRINT';
      case 'MAGNET':
        return 'GOLD MAGNET';
      case 'MULTIPLIER':
        return '2X SCORE';
    }
  };

  // Threat level indicator
  const isHighDanger = beastProximity > 0.65;
  const isCaution = beastProximity > 0.35;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* Top Bar: Perimeter status clusters */}
      <div className="w-full flex items-start justify-between">
        {/* Left Cluster: Score & Distance */}
        <div className="flex flex-col gap-1.5 pointer-events-auto bg-[#121614]/90 border border-amber-900/40 px-4 py-2.5 rounded-xl shadow-lg">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500/80">SCORE</span>
            <span className="font-mono tabular-nums text-2xl sm:text-3xl font-extrabold text-[#f5ebd7] leading-none tracking-tight">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-amber-200/70 border-t border-amber-900/30 pt-1.5 font-mono">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-amber-400/80">DIST</span>
              <span className="font-bold tabular-nums text-amber-100">{distance}m</span>
            </div>
            {multiplier > 1 && (
              <span className="bg-amber-600/30 text-amber-300 border border-amber-500/40 text-[10px] font-black px-1.5 py-0.5 rounded">
                {multiplier}X
              </span>
            )}
          </div>
        </div>

        {/* Center: Active Power-Ups */}
        <div className="flex flex-col gap-2 items-center">
          {activePowerUps.map((pup) => {
            const pct = Math.max(0, Math.min(100, (pup.duration / pup.maxDuration) * 100));
            return (
              <div
                key={pup.type}
                className="pointer-events-auto flex items-center gap-2 bg-[#141916]/95 border border-amber-700/50 px-3 py-1.5 rounded-lg shadow-md min-w-[150px]"
              >
                {getPowerUpIcon(pup.type)}
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] font-bold tracking-wider text-amber-100">
                    <span>{getPowerUpLabel(pup.type)}</span>
                    <span className="font-mono tabular-nums text-amber-400">{pup.duration.toFixed(1)}s</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-75"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Cluster: Coins & Utility Controls */}
        <div className="flex items-center gap-3">
          {/* Coins badge */}
          <div className="pointer-events-auto flex items-center gap-2 bg-[#121614]/90 border border-amber-800/40 px-3.5 py-2 rounded-xl shadow-lg">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 to-amber-600 border border-amber-200 flex items-center justify-center shadow-inner">
              <span className="text-[10px] font-black text-amber-950">¢</span>
            </div>
            <span className="font-mono tabular-nums font-bold text-lg text-amber-300">{coins}</span>
          </div>

          {/* Controls: Mute & Pause */}
          <div className="pointer-events-auto flex items-center gap-1.5 bg-[#121614]/90 border border-amber-800/40 p-1.5 rounded-xl">
            <button
              onClick={onToggleMute}
              className="p-2 rounded-lg text-amber-300/80 hover:text-amber-100 hover:bg-amber-950/50 transition-colors focus:outline-none"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onPause}
              className="p-2 rounded-lg text-amber-300/80 hover:text-amber-100 hover:bg-amber-950/50 transition-colors focus:outline-none"
              title="Pause Game (Esc)"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Beast Threat Meter & Control Hints */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Beast Proximity Alert Meter */}
        <div
          className={`pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
            isHighDanger
              ? 'bg-red-950/80 border-red-500/70 text-red-200'
              : isCaution
              ? 'bg-amber-950/70 border-amber-500/50 text-amber-200'
              : 'bg-[#121614]/80 border-stone-700/40 text-stone-400'
          }`}
        >
          <div className="text-[11px] font-bold tracking-widest uppercase">
            {isHighDanger ? 'BEAST PURSUIT: CRITICAL!' : isCaution ? 'BEAST: CLOSING IN' : 'BEAST: DISTANT'}
          </div>
          <div className="w-24 h-2 bg-black/60 rounded-full overflow-hidden p-0.5 border border-stone-700/50">
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                isHighDanger ? 'bg-red-500' : isCaution ? 'bg-amber-500' : 'bg-stone-500'
              }`}
              style={{ width: `${Math.round(beastProximity * 100)}%` }}
            />
          </div>
        </div>

        {/* Minimal Control Hint */}
        <div className="text-[11px] text-amber-300/60 font-mono tracking-wide bg-black/40 px-3 py-1 rounded-full border border-amber-900/30">
          A/D or ◄/► Move · W/Space/▲ Jump · S/▼ Slide · Esc Pause
        </div>
      </div>
    </div>
  );
};
