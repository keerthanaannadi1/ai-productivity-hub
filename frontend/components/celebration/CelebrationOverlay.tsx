'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useStore } from '@/store/useStore';

export default function CelebrationOverlay() {
  const { showCelebration, celebrationMessage, clearCelebration } = useStore();

  useEffect(() => {
    if (showCelebration) {
      // Fire confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6'],
      });
    }
  }, [showCelebration]);

  return (
    <AnimatePresence>
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-gray-900 border border-indigo-500/50 shadow-2xl shadow-indigo-500/20 rounded-2xl px-6 py-4 flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <p className="text-white font-semibold">{celebrationMessage}</p>
            <button
              onClick={clearCelebration}
              className="text-gray-500 hover:text-gray-300 ml-2 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
