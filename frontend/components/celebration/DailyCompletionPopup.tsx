'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useStore } from '@/store/useStore';

const MESSAGES = [
  "You crushed it today! All tasks done! 🏆",
  "Day complete! You're on fire! 🔥",
  "All done! Tomorrow, you do it again. 💪",
  "Perfect day! Every task checked off! ⭐",
  "That's what a productive day looks like! 🚀",
];

export default function DailyCompletionPopup() {
  const { showDailyPopup, setShowDailyPopup, analytics } = useStore();

  useEffect(() => {
    if (showDailyPopup) {
      // Bigger celebration for all tasks done!
      const end = Date.now() + 2000;
      const frame = () => {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#6366f1', '#f59e0b', '#10b981'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#6366f1', '#f59e0b', '#10b981'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [showDailyPopup]);

  const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  return (
    <AnimatePresence>
      {showDailyPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowDailyPopup(false)}
        >
          <motion.div
            initial={{ scale: 0.8, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-gray-900 border border-indigo-500/40 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-white mb-2">Day Complete!</h2>
            <p className="text-gray-300 mb-6">{message}</p>

            {analytics && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-2xl font-bold text-indigo-400">{analytics.today.tasks_completed}</p>
                  <p className="text-xs text-gray-400">Tasks Done</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-2xl font-bold text-green-400">{Math.round(analytics.today.focus_minutes / 60 * 10) / 10}h</p>
                  <p className="text-xs text-gray-400">Focus Time</p>
                </div>
              </div>
            )}

            {analytics?.streak && analytics.streak > 0 && (
              <p className="text-orange-400 text-sm mb-4">🔥 {analytics.streak} day streak maintained!</p>
            )}

            <button
              onClick={() => setShowDailyPopup(false)}
              className="btn-primary w-full"
            >
              Continue ✨
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
