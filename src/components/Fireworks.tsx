import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  size: number;
  shape: 'circle' | 'star' | 'ribbon' | 'sparkle';
  duration: number;
  delay: number;
}

interface FireworkBurst {
  id: string;
  originX: number; // percentage (0 - 100)
  originY: number; // percentage (0 - 100)
  colorTheme: string[];
  delay: number;
}

const FESTIVE_PALETTES = [
  ['#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#10B981', '#3B82F6'],
  ['#FBBF24', '#F43F5E', '#A855F7', '#06B6D4', '#EAB308'],
  ['#10B981', '#34D399', '#6EE7B7', '#FBBF24', '#F472B6'],
  ['#818CF8', '#C084FC', '#F472B6', '#38BDF8', '#FDE047'],
];

// Optional gentle celebratory sound synthesizer using Web Audio API
export const playCelebrationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Victory musical arpeggio: C5 -> E5 -> G5 -> C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.5);
    });

    // Firework soft sparkle noise
    for (let i = 0; i < 3; i++) {
      const burstTime = now + 0.1 + i * 0.35;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300 + Math.random() * 200, burstTime);
      osc.frequency.exponentialRampToValueAtTime(80, burstTime + 0.25);

      gain.gain.setValueAtTime(0.1, burstTime);
      gain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(burstTime);
      osc.stop(burstTime + 0.25);
    }
  } catch {
    // Gracefully ignore audio autoplay restrictions
  }
};

interface FireworksProps {
  /** Trigger count to replay fireworks */
  triggerKey?: number;
  /** Whether to play gentle triumph chime sound */
  playSound?: boolean;
}

export const Fireworks: React.FC<FireworksProps> = ({ triggerKey = 0, playSound = true }) => {
  const [active, setActive] = useState(true);

  // Auto-play sound on mount or triggerKey change
  useEffect(() => {
    setActive(true);
    if (playSound) {
      playCelebrationSound();
    }
  }, [triggerKey, playSound]);

  // Generate explosion burst centers
  const bursts: FireworkBurst[] = useMemo(() => [
    { id: 'b1', originX: 25, originY: 30, colorTheme: FESTIVE_PALETTES[0], delay: 0 },
    { id: 'b2', originX: 75, originY: 28, colorTheme: FESTIVE_PALETTES[1], delay: 0.25 },
    { id: 'b3', originX: 50, originY: 20, colorTheme: FESTIVE_PALETTES[2], delay: 0.5 },
    { id: 'b4', originX: 35, originY: 45, colorTheme: FESTIVE_PALETTES[3], delay: 0.9 },
    { id: 'b5', originX: 68, originY: 42, colorTheme: FESTIVE_PALETTES[0], delay: 1.2 },
    { id: 'b6', originX: 18, originY: 22, colorTheme: FESTIVE_PALETTES[1], delay: 1.6 },
    { id: 'b7', originX: 82, originY: 24, colorTheme: FESTIVE_PALETTES[2], delay: 1.9 },
  ], [triggerKey]);

  // Generate falling confetti particles
  const confettiPieces = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      id: `confetti-${i}`,
      startX: Math.random() * 100,
      color: FESTIVE_PALETTES[i % 4][i % FESTIVE_PALETTES[i % 4].length],
      size: Math.random() * 8 + 6,
      rotateX: Math.random() * 360,
      rotateZ: Math.random() * 360,
      drift: (Math.random() - 0.5) * 120,
      duration: Math.random() * 2 + 2.5,
      delay: Math.random() * 1.5,
      shape: i % 3 === 0 ? 'star' : i % 2 === 0 ? 'rect' : 'circle',
    }));
  }, [triggerKey]);

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden" 
      aria-hidden="true"
    >
      <AnimatePresence>
        {active && (
          <>
            {/* 1. Firework Bursts */}
            {bursts.map((burst) => (
              <BurstGroup key={`${triggerKey}-${burst.id}`} burst={burst} />
            ))}

            {/* 2. Falling Confetti Streamers */}
            {confettiPieces.map((piece) => (
              <motion.div
                key={`${triggerKey}-${piece.id}`}
                initial={{
                  x: `${piece.startX}vw`,
                  y: '-5vh',
                  opacity: 0,
                  scale: 0,
                  rotate: piece.rotateZ,
                }}
                animate={{
                  y: '105vh',
                  x: `calc(${piece.startX}vw + ${piece.drift}px)`,
                  opacity: [0, 1, 1, 0.8, 0],
                  scale: [0, 1.2, 1, 0.9, 0.6],
                  rotate: piece.rotateZ + 720,
                  rotateY: [0, 180, 360, 540],
                }}
                transition={{
                  duration: piece.duration,
                  delay: piece.delay,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                style={{
                  position: 'absolute',
                  width: piece.size,
                  height: piece.shape === 'rect' ? piece.size * 1.8 : piece.size,
                  backgroundColor: piece.shape === 'star' ? 'transparent' : piece.color,
                  borderRadius: piece.shape === 'circle' ? '50%' : piece.shape === 'rect' ? '2px' : '0',
                }}
              >
                {piece.shape === 'star' && (
                  <span 
                    style={{ color: piece.color, fontSize: `${piece.size + 4}px` }} 
                    className="select-none leading-none block"
                  >
                    ★
                  </span>
                )}
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Individual Firework Explosion Cluster
interface BurstGroupProps {
  burst: FireworkBurst;
}

const BurstGroup: React.FC<BurstGroupProps> = ({ burst }) => {
  // Generate sparks around the explosion center
  const sparkCount = 28;
  const sparks = useMemo(() => {
    return Array.from({ length: sparkCount }).map((_, i) => {
      const angle = (i / sparkCount) * 2 * Math.PI + (Math.random() * 0.2 - 0.1);
      const distance = Math.random() * 110 + 65; // radius
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance + 20; // slight gravity pull
      const color = burst.colorTheme[i % burst.colorTheme.length];
      const size = Math.random() * 5 + 3;
      const isStar = i % 5 === 0;

      return {
        id: `spark-${i}`,
        targetX,
        targetY,
        color,
        size,
        isStar,
      };
    });
  }, [burst]);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${burst.originX}%`,
        top: `${burst.originY}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Central Flash / Ring Wave */}
      <motion.div
        initial={{ scale: 0, opacity: 0.9 }}
        animate={{ scale: [0, 2.5, 4], opacity: [0.9, 0.4, 0] }}
        transition={{ duration: 0.7, delay: burst.delay, ease: 'easeOut' }}
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${burst.colorTheme[0]} 0%, rgba(255,255,255,0.8) 40%, transparent 70%)`,
          position: 'absolute',
          left: '-25px',
          top: '-25px',
        }}
      />

      {/* Radiating Sparks */}
      {sparks.map((spark) => (
        <motion.div
          key={spark.id}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: spark.targetX,
            y: spark.targetY,
            scale: [0, 1.4, 0.9, 0],
            opacity: [1, 1, 0.8, 0],
          }}
          transition={{
            duration: 1.1 + Math.random() * 0.3,
            delay: burst.delay,
            ease: [0.1, 0.8, 0.3, 1],
          }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: spark.size,
            height: spark.size,
            borderRadius: spark.isStar ? '0%' : '50%',
            backgroundColor: spark.isStar ? 'transparent' : spark.color,
            boxShadow: spark.isStar ? 'none' : `0 0 8px ${spark.color}`,
          }}
        >
          {spark.isStar && (
            <span
              style={{
                color: spark.color,
                fontSize: `${spark.size + 6}px`,
                lineHeight: 1,
                display: 'block',
                transform: 'translate(-50%, -50%)',
                filter: `drop-shadow(0 0 4px ${spark.color})`,
              }}
            >
              ✦
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
};
