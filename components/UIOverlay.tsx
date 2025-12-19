
import React from 'react';
import { GameStatus, PowerUpType } from '../types';
import { LOCAL_STORAGE_KEY, POWERUP_DURATION, COLORS } from '../constants';

interface UIOverlayProps {
  status: GameStatus;
  score: number;
  activePowerUps: { type: PowerUpType, duration: number }[];
  onStart: () => void;
  onTogglePause: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ status, score, activePowerUps, onStart, onTogglePause }) => {
  const highScore = parseInt(localStorage.getItem(LOCAL_STORAGE_KEY) || '0', 10);

  const getPowerUpLabel = (type: PowerUpType) => {
    switch (type) {
      case 'SHIELD': return 'SHIELD';
      case 'INVINCIBILITY': return 'INVINCIBLE';
      case 'MAGNET': return 'MAGNET';
      case 'SCORE_BOOST': return 'SCORE x2';
      case 'SLOW': return 'SLOW';
      default: return '';
    }
  };

  const getPowerUpIcon = (type: PowerUpType) => {
    switch (type) {
      case 'SHIELD': return <i className="fas fa-shield-alt"></i>;
      case 'INVINCIBILITY': return <i className="fas fa-star"></i>;
      case 'MAGNET': return <i className="fas fa-magnet"></i>;
      case 'SCORE_BOOST': return <i className="fas fa-bolt text-orange-400"></i>;
      case 'SLOW': return <i className="fas fa-clock"></i>;
      default: return null;
    }
  };

  const getPowerUpColor = (type: PowerUpType) => {
    switch (type) {
      case 'SHIELD': return COLORS.SHIELD;
      case 'INVINCIBILITY': return COLORS.INVINCIBILITY;
      case 'MAGNET': return COLORS.MAGNET;
      case 'SCORE_BOOST': return COLORS.SCORE_BOOST;
      default: return COLORS.POWERUP;
    }
  };

  if (status === 'START') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-20 p-6 text-center">
        <h1 className="text-6xl font-black mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
          NEON PULSE
        </h1>
        <p className="text-cyan-200 mb-8 uppercase tracking-widest font-bold animate-pulse-slow">Infinite Climb</p>
        
        <div className="grid grid-cols-1 gap-3 w-full max-w-xs mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-4 text-xs">
            <div className="bg-cyan-500/20 p-2 rounded-lg text-cyan-400"><i className="fas fa-hand-pointer"></i></div>
            <div className="text-left"><p className="text-white/50 uppercase font-bold">Control</p><p>Drag to move</p></div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-4 text-xs">
            <div className="bg-red-500/20 p-2 rounded-lg text-red-400"><i className="fas fa-skull"></i></div>
            <div className="text-left"><p className="text-white/50 uppercase font-bold">Warning</p><p>Avoid Red Walls</p></div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-4 text-xs">
            <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-400"><i className="fas fa-bolt"></i></div>
            <div className="text-left"><p className="text-white/50 uppercase font-bold">Powerups</p><p>Star: Invincible, Magnet: Attracts Gems, Bolt: x2 Score</p></div>
          </div>
        </div>

        <button 
          onClick={onStart}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-black px-12 py-4 rounded-full text-2xl transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.5)]"
        >
          PLAY NOW
        </button>

        <p className="mt-8 text-white/30 text-xs uppercase tracking-widest">Best Session: {highScore}</p>
      </div>
    );
  }

  if (status === 'GAMEOVER') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white z-20 p-6 text-center">
        <h2 className="text-4xl font-black mb-2 text-red-500 uppercase tracking-tighter">System Crash</h2>
        <p className="text-white/50 mb-8 uppercase text-sm tracking-widest">Connection Lost</p>
        
        <div className="flex gap-8 mb-12">
          <div className="text-center">
            <p className="text-xs text-white/50 uppercase mb-1">Final Score</p>
            <p className="text-4xl font-black text-cyan-400">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-white/50 uppercase mb-1">Record</p>
            <p className="text-4xl font-black text-purple-400">{highScore}</p>
          </div>
        </div>

        <button 
          onClick={onStart}
          className="bg-white text-black font-black px-10 py-3 rounded-full text-xl transition-all hover:bg-cyan-400"
        >
          RETRY
        </button>
      </div>
    );
  }

  if (status === 'PAUSED') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm text-white z-20">
        <button 
          onClick={onTogglePause}
          className="bg-cyan-500 p-6 rounded-full text-4xl shadow-xl transform transition-transform hover:scale-110 active:scale-90"
        >
          <i className="fas fa-play"></i>
        </button>
        <p className="mt-4 font-bold uppercase tracking-widest">Paused</p>
      </div>
    );
  }

  return (
    <>
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-10">
        <div className="bg-black/30 backdrop-blur-md p-3 rounded-xl border border-white/10">
          <p className="text-[10px] text-white/50 uppercase font-black leading-none">Total Score</p>
          <p className="text-2xl font-black text-cyan-400 leading-none">{score}</p>
        </div>
        <button 
          onClick={onTogglePause}
          className="pointer-events-auto bg-black/30 hover:bg-white/10 backdrop-blur-md w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 transition-colors"
        >
          <i className="fas fa-pause"></i>
        </button>
      </div>

      <div className="absolute top-20 left-4 flex flex-col gap-2 z-10 pointer-events-none">
        {activePowerUps.map((pu, idx) => (
          <div key={idx} className="flex flex-col gap-1 bg-black/40 backdrop-blur-sm p-2 rounded-lg border border-white/5 min-w-[120px]">
            <div className="flex items-center gap-2">
              <span style={{ color: getPowerUpColor(pu.type) }} className="text-xs">
                {getPowerUpIcon(pu.type)}
              </span>
              <span className="text-[10px] font-bold text-white uppercase tracking-tighter">
                {getPowerUpLabel(pu.type)}
              </span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-100 ease-linear"
                style={{ 
                  width: `${(pu.duration / POWERUP_DURATION) * 100}%`,
                  backgroundColor: getPowerUpColor(pu.type)
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default UIOverlay;
