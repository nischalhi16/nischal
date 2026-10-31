import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/60">
      <div className="relative w-full max-w-sm bg-[#131715] border-2 border-amber-700/60 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Ancient decorative corner brackets */}
        <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-500/80 rounded-tl-lg" />
        <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-500/80 rounded-tr-lg" />
        <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-500/80 rounded-bl-lg" />
        <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-500/80 rounded-br-lg" />

        <h2 className="font-cinzel text-2xl font-black text-amber-300 tracking-wider mb-1">
          EXPEDITION PAUSED
        </h2>
        <p className="text-xs text-stone-400 mb-6">Take a breath, adventurer.</p>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black py-3 px-6 rounded-xl transition-all shadow-md focus:outline-none"
          >
            <Play className="w-4 h-4 fill-current" />
            <span className="font-cinzel text-sm tracking-wider">RESUME RUN</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 bg-[#181d1a] hover:bg-[#202723] text-amber-200 border border-amber-900/50 py-2.5 px-6 rounded-xl font-bold transition-all focus:outline-none"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span className="font-cinzel text-xs tracking-wider">RESTART</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full flex items-center justify-center gap-2 bg-[#181d1a] hover:bg-[#202723] text-stone-300 border border-amber-900/30 py-2.5 px-6 rounded-xl font-medium transition-all focus:outline-none"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            <span className="text-xs">{isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}</span>
          </button>

          <button
            onClick={onHome}
            className="w-full flex items-center justify-center gap-2 bg-[#181d1a] hover:bg-[#202723] text-stone-400 border border-amber-900/30 py-2.5 px-6 rounded-xl font-medium transition-all focus:outline-none"
          >
            <Home className="w-4 h-4" />
            <span className="text-xs">MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
