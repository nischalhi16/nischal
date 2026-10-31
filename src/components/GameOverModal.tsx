import React from 'react';
import { RunSummary } from '../types';
import { RotateCcw, Home, Trophy, Coins, Compass, Sparkles } from 'lucide-react';

interface GameOverModalProps {
  summary: RunSummary;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ summary, onRestart, onHome }) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/75">
      <div className="relative w-full max-w-md bg-[#131715] border-2 border-amber-700/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col items-center text-center">
        {/* Ancient decorative corner brackets */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-500/80 rounded-tl-lg" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-500/80 rounded-tr-lg" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-500/80 rounded-bl-lg" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-500/80 rounded-br-lg" />

        {/* Header */}
        <div className="flex flex-col items-center mb-5">
          <span className="text-[11px] font-cinzel font-black tracking-[0.3em] text-red-400 uppercase">
            THE GUARDIAN CLAIMS YOU
          </span>
          <h2 className="font-cinzel text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-yellow-400 mt-1">
            RUN OVER
          </h2>
          {summary.isNewHigh && (
            <div className="mt-2 flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/60 px-3 py-1 rounded-full text-amber-300 text-xs font-bold tracking-wider animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              NEW RECORD RUN!
            </div>
          )}
        </div>

        {/* Main Score readout */}
        <div className="w-full bg-[#0c0f0e] border border-amber-900/40 rounded-2xl p-4 mb-5 flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400/70">TOTAL SCORE</span>
          <span className="font-mono tabular-nums text-4xl sm:text-5xl font-black text-[#f7eedc] mt-0.5 tracking-tight">
            {summary.score.toLocaleString()}
          </span>
        </div>

        {/* Run Details Grid */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#181d1a] border border-amber-900/30 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-950/80 border border-amber-700/40 flex items-center justify-center text-amber-400">
              <Compass className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase text-stone-400 font-bold">DISTANCE</span>
              <span className="font-mono tabular-nums font-bold text-amber-100 text-base">{summary.distance}m</span>
            </div>
          </div>

          <div className="bg-[#181d1a] border border-amber-900/30 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-950/80 border border-amber-700/40 flex items-center justify-center text-yellow-400">
              <Coins className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase text-stone-400 font-bold">COINS</span>
              <span className="font-mono tabular-nums font-bold text-yellow-300 text-base">+{summary.coins}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black py-3.5 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="font-cinzel text-base tracking-widest">RUN AGAIN</span>
            <span className="text-[10px] font-mono bg-black/20 text-stone-900 px-2 py-0.5 rounded ml-1 font-bold">
              SPACE / R
            </span>
          </button>

          <button
            onClick={onHome}
            className="w-full flex items-center justify-center gap-2 bg-[#181d1a] hover:bg-[#202723] text-amber-300 border border-amber-900/50 py-3 px-6 rounded-xl font-bold transition-all focus:outline-none"
          >
            <Home className="w-4 h-4 text-amber-400" />
            <span className="font-cinzel text-xs tracking-wider">RETURN TO TEMPLE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
