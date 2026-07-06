'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';

const EMOJIS = ['🎉', '✨', '🎊', '⭐', '💫'];

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number; // left position in vw
}

export default function CelebrationOverlay() {
  const { showCelebration, clearCelebration } = useStore();
  const [particles, setParticles] = useState<FloatingEmoji[]>([]);

  useEffect(() => {
    if (showCelebration) {
      // Spawn 6 emoji particles at random horizontal positions
      const burst: FloatingEmoji[] = Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        x: 30 + Math.random() * 40, // 30–70 vw, centred on screen
      }));
      setParticles(burst);

      const timer = setTimeout(() => {
        clearCelebration();
        setParticles([]);
      }, 1400);

      return () => clearTimeout(timer);
    }
  }, [showCelebration, clearCelebration]);

  return (
    <AnimatePresence>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, y: 0, scale: 0.6 }}
          animate={{ opacity: 0, y: -120, scale: 1.4 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="fixed z-50 pointer-events-none select-none text-3xl"
          style={{ left: `${p.x}vw`, bottom: '80px' }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </AnimatePresence>
  );
}
