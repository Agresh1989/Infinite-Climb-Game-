
export type GameStatus = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type PowerUpType = 'SHIELD' | 'SLOW' | 'SCORE_BOOST' | 'INVINCIBILITY' | 'MAGNET';

export type MovementPattern = 'LINEAR' | 'SINE' | 'BOUNCE' | 'STATIONARY';
export type EntityShape = 'RECT' | 'TRIANGLE' | 'HEXAGON' | 'CIRCLE';

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: 'OBSTACLE' | 'POWERUP' | 'GEM';
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  active: boolean;
  value?: number;
  powerType?: PowerUpType;
  movementPattern?: MovementPattern;
  shape?: EntityShape;
  phase?: number;
  dir?: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
  hasShield: boolean;
  shieldTimer: number;
  invincibilityTimer: number;
  magnetTimer: number;
  score: number;
  multiplier: number;
  multiplierTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}
