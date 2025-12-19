
import React, { useState } from 'react';
import Game from './components/Game';
import UIOverlay from './components/UIOverlay';
import { GameStatus, PowerUpType } from './types';
import { LOCAL_STORAGE_KEY } from './constants';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>('START');
  const [score, setScore] = useState(0);
  const [activePowerUps, setActivePowerUps] = useState<{ type: PowerUpType, duration: number }[]>([]);

  const startGame = () => {
    setScore(0);
    setActivePowerUps([]);
    setStatus('PLAYING');
  };

  const handleGameOver = (finalScore: number) => {
    const highScore = parseInt(localStorage.getItem(LOCAL_STORAGE_KEY) || '0', 10);
    if (finalScore > highScore) {
      localStorage.setItem(LOCAL_STORAGE_KEY, finalScore.toString());
    }
    setStatus('GAMEOVER');
  };

  const togglePause = () => {
    if (status === 'PLAYING') setStatus('PAUSED');
    else if (status === 'PAUSED') setStatus('PLAYING');
  };

  const handleScoreUpdate = (newScore: number, powerUps: { type: PowerUpType, duration: number }[]) => {
    setScore(newScore);
    setActivePowerUps(powerUps);
  };

  return (
    <div className="relative w-screen h-screen flex items-center justify-center bg-[#050505] font-sans selection:bg-cyan-500 overflow-hidden">
      <div className="relative aspect-[400/700] h-full max-w-full overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)]">
        <Game 
          status={status} 
          onGameOver={handleGameOver} 
          onScoreUpdate={handleScoreUpdate} 
        />
        <UIOverlay 
          status={status} 
          score={score} 
          activePowerUps={activePowerUps}
          onStart={startGame} 
          onTogglePause={togglePause} 
        />
      </div>

      <div className="fixed inset-0 pointer-events-none -z-10 opacity-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-cyan-900/20 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/10 blur-[120px] rounded-full"></div>
      </div>
    </div>
  );
};

export default App;
