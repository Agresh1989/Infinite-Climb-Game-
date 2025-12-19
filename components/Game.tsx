
import React, { useRef, useEffect, useCallback } from 'react';
import { GameStatus, Entity, Player, Particle, PowerUpType, MovementPattern, EntityShape, FloatingText } from '../types';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, INITIAL_SPEED, SPEED_INCREMENT, MAX_SPEED, POWERUP_DURATION } from '../constants';
import { audioService } from '../services/audioService';

interface GameProps {
  status: GameStatus;
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number, activePowerUps: { type: PowerUpType, duration: number }[]) => void;
}

const Game: React.FC<GameProps> = ({ status, onGameOver, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  const gameSpeed = useRef(INITIAL_SPEED);
  const gridY = useRef(0);
  const entities = useRef<Entity[]>([]);
  const particles = useRef<Particle[]>([]);
  const floatingTexts = useRef<FloatingText[]>([]);
  const nextTextId = useRef(0);
  const shakeIntensity = useRef(0);
  
  const player = useRef<Player>({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 100,
    targetX: GAME_WIDTH / 2,
    width: 30,
    height: 30,
    hasShield: false,
    shieldTimer: 0,
    invincibilityTimer: 0,
    magnetTimer: 0,
    score: 0,
    multiplier: 1,
    multiplierTimer: 0
  });
  
  // Parallax Layers
  const starsLayers = useRef<{x: number, y: number, z: number, color: string, size: number, twinkleSpeed: number, twinkleOffset: number}[][]>([]);
  const nebulae = useRef<{x: number, y: number, r: number, color: string, speed: number, pulseOffset: number, opacity: number, swayOffset: number, swaySpeed: number}[]>([]);
  const atmosphereParticles = useRef<{x: number, y: number, speed: number, size: number, opacity: number, phase: number}[]>([]);

  useEffect(() => {
    starsLayers.current = [
      Array.from({ length: 80 }, () => ({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        z: 12,
        color: '#222244',
        size: 0.6,
        twinkleSpeed: 0.01 + Math.random() * 0.02,
        twinkleOffset: Math.random() * Math.PI * 2
      })),
      Array.from({ length: 50 }, () => ({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        z: 7,
        color: '#444466',
        size: 0.9,
        twinkleSpeed: 0.02 + Math.random() * 0.03,
        twinkleOffset: Math.random() * Math.PI * 2
      })),
      Array.from({ length: 30 }, () => ({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        z: 4,
        color: COLORS.STARS[Math.floor(Math.random() * COLORS.STARS.length)],
        size: 1.4,
        twinkleSpeed: 0.03 + Math.random() * 0.04,
        twinkleOffset: Math.random() * Math.PI * 2
      })),
      Array.from({ length: 15 }, () => ({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        z: 2,
        color: '#ffffff',
        size: 2.2,
        twinkleSpeed: 0.05 + Math.random() * 0.05,
        twinkleOffset: Math.random() * Math.PI * 2
      }))
    ];

    nebulae.current = Array.from({ length: 5 }, () => ({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * GAME_HEIGHT,
      r: Math.random() * 200 + 150,
      color: COLORS.NEBULA[Math.floor(Math.random() * COLORS.NEBULA.length)],
      speed: Math.random() * 0.1 + 0.02,
      pulseOffset: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.15 + 0.1,
      swayOffset: Math.random() * Math.PI * 2,
      swaySpeed: 0.0005 + Math.random() * 0.001
    }));

    atmosphereParticles.current = Array.from({ length: 20 }, () => ({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * GAME_HEIGHT,
      speed: Math.random() * 0.6 + 0.2,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.4 + 0.1,
      phase: Math.random() * Math.PI * 2
    }));
  }, []);

  const addFloatingText = (x: number, y: number, text: string, color: string) => {
    floatingTexts.current.push({
      id: nextTextId.current++,
      x,
      y,
      text,
      color,
      life: 1.0
    });
  };

  const triggerShake = (intensity: number) => {
    shakeIntensity.current = intensity;
  };

  const spawnEntity = useCallback(() => {
    const types: Entity['type'][] = ['OBSTACLE', 'OBSTACLE', 'OBSTACLE', 'GEM', 'GEM', 'POWERUP'];
    const type = types[Math.floor(Math.random() * types.length)];
    const size = type === 'OBSTACLE' ? Math.random() * 30 + 30 : 25;
    
    let powerType: PowerUpType | undefined = undefined;
    let color = type === 'OBSTACLE' ? COLORS.OBSTACLE : COLORS.GEM;
    let movementPattern: MovementPattern = 'LINEAR';
    let shape: EntityShape = 'RECT';

    if (type === 'OBSTACLE') {
      const patterns: MovementPattern[] = ['LINEAR', 'SINE', 'BOUNCE'];
      movementPattern = patterns[Math.floor(Math.random() * patterns.length)];
      shape = (['RECT', 'TRIANGLE', 'HEXAGON', 'CIRCLE'] as EntityShape[])[Math.floor(Math.random() * 4)];
      if (Math.random() > 0.8) movementPattern = 'STATIONARY';
    } else if (type === 'POWERUP') {
      const pTypes: PowerUpType[] = ['SHIELD', 'SLOW', 'SCORE_BOOST', 'INVINCIBILITY', 'MAGNET'];
      powerType = pTypes[Math.floor(Math.random() * pTypes.length)];
      shape = 'CIRCLE';
      
      switch(powerType) {
        case 'SHIELD': color = COLORS.SHIELD; break;
        case 'INVINCIBILITY': color = COLORS.INVINCIBILITY; break;
        case 'MAGNET': color = COLORS.MAGNET; break;
        case 'SCORE_BOOST': color = COLORS.SCORE_BOOST; break;
        default: color = COLORS.POWERUP;
      }
    } else {
      shape = 'TRIANGLE';
    }

    const newEntity: Entity = {
      x: Math.random() * (GAME_WIDTH - size),
      y: -size,
      width: size,
      height: size,
      type,
      color,
      speedY: type === 'OBSTACLE' && movementPattern === 'STATIONARY' 
        ? gameSpeed.current 
        : gameSpeed.current * (0.8 + Math.random() * 0.6),
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      active: true,
      value: type === 'GEM' ? 10 : 0,
      powerType,
      movementPattern,
      shape,
      phase: Math.random() * Math.PI * 2,
      dir: Math.random() > 0.5 ? 1 : -1
    };

    entities.current.push(newEntity);
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count: number = 10) => {
    for (let i = 0; i < count; i++) {
      particles.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color,
        size: Math.random() * 4 + 2
      });
    }
  };

  const update = useCallback(() => {
    // Only update gameplay logic if playing
    if (status === 'PLAYING') {
      gameSpeed.current = Math.min(MAX_SPEED, gameSpeed.current + SPEED_INCREMENT);
      gridY.current = (gridY.current + gameSpeed.current) % 40;

      const dx = player.current.targetX - player.current.x;
      player.current.x += dx * 0.15;
      
      const backgroundDriftX = -dx * 0.05;

      // Update Timers
      if (player.current.shieldTimer > 0) player.current.shieldTimer--;
      else player.current.hasShield = false;
      
      if (player.current.invincibilityTimer > 0) player.current.invincibilityTimer--;
      if (player.current.magnetTimer > 0) player.current.magnetTimer--;
      if (player.current.multiplierTimer > 0) player.current.multiplierTimer--;
      else player.current.multiplier = 1;

      const activePowerUps: { type: PowerUpType, duration: number }[] = [];
      if (player.current.shieldTimer > 0) activePowerUps.push({ type: 'SHIELD', duration: player.current.shieldTimer });
      if (player.current.invincibilityTimer > 0) activePowerUps.push({ type: 'INVINCIBILITY', duration: player.current.invincibilityTimer });
      if (player.current.magnetTimer > 0) activePowerUps.push({ type: 'MAGNET', duration: player.current.magnetTimer });
      if (player.current.multiplierTimer > 0) activePowerUps.push({ type: 'SCORE_BOOST', duration: player.current.multiplierTimer });

      // Update Background
      starsLayers.current.forEach(layer => {
        layer.forEach(star => {
          star.y += (gameSpeed.current * 0.5) / star.z;
          star.x += backgroundDriftX / star.z;
          if (star.y > GAME_HEIGHT) { star.y = -10; star.x = Math.random() * GAME_WIDTH; }
          if (star.x < -20) star.x = GAME_WIDTH + 20;
          if (star.x > GAME_WIDTH + 20) star.x = -20;
        });
      });

      const time = Date.now();
      nebulae.current.forEach(nebula => {
        nebula.y += (gameSpeed.current * nebula.speed);
        nebula.x += Math.sin(time * nebula.swaySpeed + nebula.swayOffset) * 0.2 + (backgroundDriftX * 0.1);
        if (nebula.y - nebula.r > GAME_HEIGHT) { nebula.y = -nebula.r; nebula.x = Math.random() * GAME_WIDTH; }
      });

      atmosphereParticles.current.forEach(ap => {
        ap.phase += 0.02;
        ap.y += gameSpeed.current * ap.speed;
        ap.x += Math.cos(ap.phase) * 0.5 + (backgroundDriftX * 0.2);
        if (ap.y > GAME_HEIGHT) { ap.y = -10; ap.x = Math.random() * GAME_WIDTH; }
      });

      if (Math.random() < 0.02 + (gameSpeed.current / 400)) spawnEntity();

      entities.current.forEach(entity => {
        if (!entity.active) return;
        
        if (entity.movementPattern === 'SINE' && entity.phase !== undefined) {
          entity.phase += 0.05; entity.x += Math.sin(entity.phase) * 3;
        } else if (entity.movementPattern === 'BOUNCE' && entity.dir !== undefined) {
          entity.x += entity.dir * 2.5;
          if (entity.x <= 0 || entity.x + entity.width >= GAME_WIDTH) entity.dir *= -1;
        }

        if (player.current.magnetTimer > 0 && entity.type === 'GEM') {
          const dist = Math.sqrt(Math.pow(entity.x + entity.width/2 - player.current.x, 2) + Math.pow(entity.y + entity.height/2 - player.current.y, 2));
          if (dist < 250) {
            const angle = Math.atan2(player.current.y - (entity.y + entity.height/2), player.current.x - (entity.x + entity.width/2));
            entity.x += Math.cos(angle) * 10; entity.y += Math.sin(angle) * 10;
          }
        }

        entity.y += entity.speedY;
        entity.rotation += entity.rotationSpeed;

        const playerRect = {
          left: player.current.x - player.current.width / 2,
          right: player.current.x + player.current.width / 2,
          top: player.current.y - player.current.height / 2,
          bottom: player.current.y + player.current.height / 2
        };

        const entityRect = {
          left: entity.x,
          right: entity.x + entity.width,
          top: entity.y,
          bottom: entity.y + entity.height
        };

        const isColliding = !(playerRect.right < entityRect.left || 
                              playerRect.left > entityRect.right || 
                              playerRect.bottom < entityRect.top || 
                              playerRect.top > entityRect.bottom);

        if (isColliding) {
          entity.active = false;
          if (entity.type === 'OBSTACLE') {
            triggerShake(10);
            if (player.current.invincibilityTimer > 0) {
              audioService.playCollision();
              addFloatingText(entity.x, entity.y, "SMASH!", COLORS.INVINCIBILITY);
              spawnParticles(entity.x + entity.width/2, entity.y + entity.height/2, entity.color, 15);
            } else if (player.current.hasShield) {
              audioService.playCollision();
              addFloatingText(player.current.x, player.current.y - 40, "SHIELD BROKEN", COLORS.SHIELD);
              spawnParticles(entity.x + entity.width/2, entity.y + entity.height/2, entity.color);
              player.current.hasShield = false;
              player.current.shieldTimer = 0;
            } else {
              audioService.playGameOver();
              addFloatingText(player.current.x, player.current.y - 20, "CRASH!", COLORS.OBSTACLE);
              spawnParticles(player.current.x, player.current.y, COLORS.PLAYER, 30);
              spawnParticles(entity.x + entity.width/2, entity.y + entity.height/2, entity.color, 20);
              onGameOver(Math.floor(player.current.score));
            }
          } else if (entity.type === 'GEM') {
            audioService.playCollect();
            const val = (entity.value || 0) * player.current.multiplier;
            player.current.score += val;
            addFloatingText(entity.x, entity.y, `+${val}`, COLORS.GEM);
            spawnParticles(entity.x + entity.width/2, entity.y + entity.height/2, entity.color);
          } else if (entity.type === 'POWERUP') {
            audioService.playPowerUp();
            spawnParticles(entity.x + entity.width/2, entity.y + entity.height/2, entity.color, 25);
            if (entity.powerType === 'SHIELD') {
              player.current.hasShield = true; player.current.shieldTimer = POWERUP_DURATION;
              addFloatingText(entity.x, entity.y, "SHIELD", COLORS.SHIELD);
            } else if (entity.powerType === 'SLOW') {
              gameSpeed.current = Math.max(INITIAL_SPEED, gameSpeed.current - 3);
              addFloatingText(entity.x, entity.y, "SLOW DOWN", COLORS.POWERUP);
            } else if (entity.powerType === 'SCORE_BOOST') {
              player.current.multiplier = 2; player.current.multiplierTimer = POWERUP_DURATION;
              addFloatingText(entity.x, entity.y, "x2 SCORE", COLORS.SCORE_BOOST);
            } else if (entity.powerType === 'INVINCIBILITY') {
              player.current.invincibilityTimer = POWERUP_DURATION;
              addFloatingText(entity.x, entity.y, "INVINCIBLE", COLORS.INVINCIBILITY);
            } else if (entity.powerType === 'MAGNET') {
              player.current.magnetTimer = POWERUP_DURATION;
              addFloatingText(entity.x, entity.y, "MAGNET", COLORS.MAGNET);
            }
          }
        }
        if (entity.y > GAME_HEIGHT + 100) entity.active = false;
      });

      entities.current = entities.current.filter(e => e.active);
      player.current.score += gameSpeed.current * 0.01 * player.current.multiplier;
      onScoreUpdate(Math.floor(player.current.score), activePowerUps);
    }

    // Update particles and floating texts even if paused or gameover to finish animations
    particles.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.02; });
    particles.current = particles.current.filter(p => p.life > 0);
    
    floatingTexts.current.forEach(t => { t.y -= 2; t.life -= 0.02; });
    floatingTexts.current = floatingTexts.current.filter(t => t.life > 0);

    // Damping screen shake
    if (shakeIntensity.current > 0) {
      shakeIntensity.current *= 0.9;
      if (shakeIntensity.current < 0.1) shakeIntensity.current = 0;
    }

  }, [status, onGameOver, onScoreUpdate, spawnEntity]);

  const drawShape = (ctx: CanvasRenderingContext2D, shape: EntityShape, width: number, height: number) => {
    switch (shape) {
      case 'RECT': ctx.fillRect(-width / 2, -height / 2, width, height); ctx.strokeRect(-width / 2, -height / 2, width, height); break;
      case 'TRIANGLE': ctx.beginPath(); ctx.moveTo(0, -height / 2); ctx.lineTo(width / 2, height / 2); ctx.lineTo(-width / 2, height / 2); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
      case 'CIRCLE': ctx.beginPath(); ctx.arc(0, 0, width / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); break;
      case 'HEXAGON':
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const x = (width / 2) * Math.cos(angle);
          const y = (height / 2) * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke(); break;
    }
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const time = Date.now();
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    ctx.save();
    // Screen Shake Offset
    if (shakeIntensity.current > 0) {
      const offsetX = (Math.random() - 0.5) * shakeIntensity.current;
      const offsetY = (Math.random() - 0.5) * shakeIntensity.current;
      ctx.translate(offsetX, offsetY);
    }

    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 1. Nebulae
    nebulae.current.forEach(nebula => {
      const pulse = 1 + Math.sin(time / 1500 + nebula.pulseOffset) * 0.15;
      const currentR = nebula.r * pulse;
      const currentOpacity = nebula.opacity * (1 + Math.sin(time / 2000 + nebula.pulseOffset) * 0.3);
      const grad = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, currentR);
      grad.addColorStop(0, nebula.color);
      grad.addColorStop(1, 'transparent');
      ctx.save(); ctx.globalAlpha = currentOpacity; ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(nebula.x, nebula.y, currentR, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });

    // 2. Stars
    starsLayers.current.forEach(layer => {
      layer.forEach(star => {
        const twinkle = 0.5 + Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.5;
        ctx.save(); ctx.fillStyle = star.color; ctx.globalAlpha = (1 / (star.z / 3)) * twinkle;
        ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      });
    });

    // 3. Grid
    const gridPulse = 0.5 + Math.sin(time / 1000) * 0.2;
    ctx.strokeStyle = `rgba(26, 26, 46, ${gridPulse})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= GAME_WIDTH; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, GAME_HEIGHT); }
    for (let y = gridY.current; y <= GAME_HEIGHT; y += 40) { ctx.moveTo(0, y); ctx.lineTo(GAME_WIDTH, y); }
    ctx.stroke();

    // 4. Atmosphere
    atmosphereParticles.current.forEach(ap => {
      ctx.save(); ctx.globalAlpha = ap.opacity; ctx.fillStyle = COLORS.PLAYER;
      ctx.beginPath(); ctx.arc(ap.x, ap.y, ap.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });

    // 5. Particles
    particles.current.forEach(p => {
      ctx.save(); ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); ctx.restore();
    });

    // 6. Entities
    entities.current.forEach(entity => {
      ctx.save();
      let offsetY = 0; let scale = 1.0;
      if (entity.type !== 'OBSTACLE') {
        offsetY = Math.sin(time / 200 + entity.x) * 5; scale = 1.0 + Math.sin(time / 300 + entity.x) * 0.05;
      }
      ctx.translate(entity.x + entity.width / 2, entity.y + entity.height / 2 + offsetY);
      ctx.scale(scale, scale); ctx.rotate(entity.rotation);
      ctx.shadowBlur = 15; ctx.shadowColor = entity.color; ctx.fillStyle = entity.color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      if (entity.type === 'OBSTACLE') {
        drawShape(ctx, entity.shape || 'RECT', entity.width, entity.height);
      } else if (entity.type === 'GEM') {
        ctx.beginPath(); ctx.moveTo(0, -entity.height/2); ctx.lineTo(entity.width/2, 0); ctx.lineTo(0, entity.height/2); ctx.lineTo(-entity.width/2, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, entity.width / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 12px Arial';
        let icon = 'P'; if (entity.powerType === 'SHIELD') icon = 'S'; if (entity.powerType === 'INVINCIBILITY') icon = 'I'; if (entity.powerType === 'MAGNET') icon = 'M'; if (entity.powerType === 'SCORE_BOOST') icon = 'X'; if (entity.powerType === 'SLOW') icon = 'L';
        ctx.fillText(icon, 0, 0);
      }
      ctx.restore();
    });

    // 7. Player (only draw if alive or briefly after crash)
    if (status !== 'GAMEOVER' || shakeIntensity.current > 2) {
      ctx.save();
      ctx.translate(player.current.x, player.current.y);
      if (player.current.magnetTimer > 0) {
        ctx.beginPath(); ctx.arc(0, 0, 80 + Math.sin(time / 100) * 10, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.MAGNET; ctx.setLineDash([5, 5]); ctx.lineWidth = 1; ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 0.05; ctx.fillStyle = COLORS.MAGNET; ctx.fill(); ctx.globalAlpha = 1.0;
      }
      if (player.current.invincibilityTimer > 0) {
        const hue = (time / 5) % 360;
        ctx.beginPath(); ctx.arc(0, 0, player.current.width * 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 0.8)`; ctx.lineWidth = 4; ctx.stroke();
      }
      if (player.current.hasShield) {
        ctx.beginPath(); ctx.arc(0, 0, player.current.width * 1.2, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.SHIELD; ctx.lineWidth = 3; ctx.stroke();
      }
      ctx.shadowBlur = 20; ctx.shadowColor = COLORS.PLAYER; ctx.fillStyle = COLORS.PLAYER;
      if (player.current.invincibilityTimer > 0) { const s = 1 + Math.sin(time / 100) * 0.1; ctx.scale(s, s); }
      ctx.beginPath(); ctx.moveTo(0, -player.current.height / 2); ctx.lineTo(player.current.width / 2, player.current.height / 2); ctx.lineTo(-player.current.width / 2, player.current.height / 2); ctx.closePath(); ctx.fill();
      const thrust = 15 + Math.random() * 10;
      const gradThrust = ctx.createLinearGradient(0, 15, 0, 15 + thrust);
      gradThrust.addColorStop(0, COLORS.PLAYER); gradThrust.addColorStop(1, 'transparent');
      ctx.fillStyle = gradThrust; ctx.beginPath(); ctx.moveTo(-5, 15); ctx.lineTo(5, 15); ctx.lineTo(0, 15 + thrust); ctx.fill();
      ctx.restore();
    }

    floatingTexts.current.forEach(t => {
      ctx.save(); ctx.globalAlpha = t.life; ctx.fillStyle = t.color; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x, t.y); ctx.restore();
    });

    ctx.restore(); // end screen shake
  }, [status]);

  const frame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    update();
    draw(ctx);
    requestRef.current = requestAnimationFrame(frame);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(frame);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [frame]);

  const handlePointer = (e: React.PointerEvent | React.TouchEvent) => {
    if (status !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? (e as React.TouchEvent).touches[0].clientX : (e as React.PointerEvent).clientX;
    const relativeX = x - rect.left;
    player.current.targetX = Math.max(player.current.width / 2, Math.min(GAME_WIDTH - player.current.width / 2, relativeX));
  };

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="max-h-full max-w-full rounded-lg shadow-2xl border-4 border-white/5"
      onPointerMove={handlePointer}
      onPointerDown={handlePointer}
      onTouchMove={handlePointer}
      onTouchStart={handlePointer}
    />
  );
};

export default Game;
