'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useStore } from '@/store/useStore';
import { RiPlayLine, RiPauseLine, RiRestartLine, RiTimerLine } from 'react-icons/ri';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const PRESETS = [
  { label: '25 min', minutes: 25, desc: 'Classic Pomodoro' },
  { label: '50 min', minutes: 50, desc: 'Deep Work' },
  { label: '90 min', minutes: 90, desc: 'Ultradian Rhythm' },
];

const BREAK_PRESETS = [
  { label: '5 min', minutes: 5 },
  { label: '10 min', minutes: 10 },
  { label: '15 min', minutes: 15 },
];

type Phase = 'idle' | 'work' | 'break';

export default function PomodoroTimer() {
  const { tasks, triggerCelebration, fetchAnalytics } = useStore();
  const [phase, setPhase] = useState<Phase>('idle');
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(25);
  const [customMinutes, setCustomMinutes] = useState('');
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [linkedTaskId, setLinkedTaskId] = useState<string>('');
  const [completedSessions, setCompletedSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const pendingTasks = tasks.filter((t) => t.status !== 'completed');

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progress = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;
  const circumference = 2 * Math.PI * 90;
  const dashOffset = circumference - (progress / 100) * circumference;

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
  }, []);

  const handleSessionComplete = useCallback(async () => {
    stopTimer();
    if (sessionId) {
      try {
        await axios.patch(`${API}/api/pomodoro/${sessionId}/complete`);
        await fetchAnalytics();
      } catch (e) {
        console.error(e);
      }
    }

    if (phase === 'work') {
      setCompletedSessions((n) => n + 1);
      triggerCelebration('🍅 Focus session complete! Take a break.');
      setPhase('break');
      setTotalSeconds(breakMinutes * 60);
      setRemaining(breakMinutes * 60);
      setSessionId(null);
    } else {
      triggerCelebration('✅ Break done! Ready for another session?');
      setPhase('idle');
      setTotalSeconds(selectedPreset * 60);
      setRemaining(selectedPreset * 60);
      setSessionId(null);
    }
  }, [phase, sessionId, breakMinutes, selectedPreset, stopTimer, triggerCelebration, fetchAnalytics]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, handleSessionComplete]);

  // Update document title
  useEffect(() => {
    if (isRunning) {
      document.title = `${formatTime(remaining)} — ${phase === 'work' ? '🍅 Focus' : '☕ Break'} | FocusForge`;
    } else {
      document.title = 'FocusForge — AI Productivity Hub';
    }
  }, [remaining, isRunning, phase]);

  const startWork = async () => {
    const mins = customMinutes ? parseInt(customMinutes) : selectedPreset;
    if (!mins || mins < 1) return;

    try {
      const res = await axios.post(`${API}/api/pomodoro/start`, {
        task_id: linkedTaskId || null,
        duration_minutes: mins,
        session_type: 'work',
      });
      setSessionId(res.data.data.id);
    } catch (e) {
      console.error(e);
    }

    setPhase('work');
    setTotalSeconds(mins * 60);
    setRemaining(mins * 60);
    setIsRunning(true);
  };

  const startBreak = async () => {
    try {
      const res = await axios.post(`${API}/api/pomodoro/start`, {
        duration_minutes: breakMinutes,
        session_type: 'break',
      });
      setSessionId(res.data.data.id);
    } catch (e) { console.error(e); }

    setPhase('break');
    setTotalSeconds(breakMinutes * 60);
    setRemaining(breakMinutes * 60);
    setIsRunning(true);
  };

  const reset = () => {
    stopTimer();
    setPhase('idle');
    setRemaining(selectedPreset * 60);
    setTotalSeconds(selectedPreset * 60);
    setSessionId(null);
  };

  const selectPreset = (mins: number) => {
    setSelectedPreset(mins);
    setCustomMinutes('');
    if (phase === 'idle') {
      setTotalSeconds(mins * 60);
      setRemaining(mins * 60);
    }
  };

  const phaseColor = phase === 'work' ? '#6366f1' : phase === 'break' ? '#10b981' : '#4b5563';
  const phaseLabel = phase === 'work' ? '🍅 Focus Session' : phase === 'break' ? '☕ Break Time' : '⏱ Ready';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Pomodoro Timer</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          {completedSessions} session{completedSessions !== 1 ? 's' : ''} completed today
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timer circle */}
        <div className="card flex flex-col items-center">
          <p className="text-sm font-medium text-gray-400 mb-6">{phaseLabel}</p>

          {/* SVG circle */}
          <div className="relative w-52 h-52">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle cx="100" cy="100" r="90" fill="none" stroke="#1f2937" strokeWidth="10" />
              {/* Progress circle */}
              <motion.circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={phaseColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transition={{ duration: 0.5 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-white tabular-nums">{formatTime(remaining)}</span>
              <span className="text-xs text-gray-400 mt-1">{phase === 'idle' ? 'Ready' : isRunning ? 'Running' : 'Paused'}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mt-8">
            {phase === 'idle' ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={startWork}
                className="btn-primary flex items-center gap-2 px-6 py-3"
              >
                <RiPlayLine className="text-xl" /> Start Focus
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsRunning((v) => !v)}
                  className="btn-primary flex items-center gap-2 px-5 py-3"
                >
                  {isRunning ? <RiPauseLine className="text-xl" /> : <RiPlayLine className="text-xl" />}
                  {isRunning ? 'Pause' : 'Resume'}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={reset}
                  className="btn-ghost flex items-center gap-2 px-5 py-3 border border-gray-700"
                >
                  <RiRestartLine className="text-xl" /> Reset
                </motion.button>
              </>
            )}
          </div>

          {/* Break button when idle after work */}
          {phase === 'idle' && completedSessions > 0 && (
            <button onClick={startBreak} className="mt-3 text-green-400 text-sm hover:text-green-300 underline">
              Start break instead ({breakMinutes} min)
            </button>
          )}
        </div>

        {/* Settings */}
        <div className="space-y-4">
          {/* Presets */}
          <div className="card">
            <p className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <RiTimerLine /> Focus Duration
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {PRESETS.map((p) => (
                <button
                  key={p.minutes}
                  onClick={() => selectPreset(p.minutes)}
                  className={`p-3 rounded-xl border text-sm transition-all ${
                    selectedPreset === p.minutes && !customMinutes
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="font-bold">{p.label}</div>
                  <div className="text-xs opacity-70">{p.desc}</div>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="input text-sm"
                placeholder="Custom minutes"
                value={customMinutes}
                onChange={(e) => {
                  setCustomMinutes(e.target.value);
                  if (phase === 'idle' && e.target.value) {
                    const mins = parseInt(e.target.value);
                    if (mins > 0) { setTotalSeconds(mins * 60); setRemaining(mins * 60); }
                  }
                }}
                min={1}
              />
              <span className="text-gray-500 text-sm whitespace-nowrap">min</span>
            </div>
          </div>

          {/* Break duration */}
          <div className="card">
            <p className="text-sm font-medium text-gray-300 mb-3">Break Duration</p>
            <div className="flex gap-2">
              {BREAK_PRESETS.map((b) => (
                <button
                  key={b.minutes}
                  onClick={() => setBreakMinutes(b.minutes)}
                  className={`flex-1 p-2 rounded-xl border text-sm transition-all ${
                    breakMinutes === b.minutes
                      ? 'bg-green-600/20 border-green-600 text-green-300'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Link to task */}
          {pendingTasks.length > 0 && (
            <div className="card">
              <p className="text-sm font-medium text-gray-300 mb-3">Link to Task (optional)</p>
              <select
                className="input text-sm"
                value={linkedTaskId}
                onChange={(e) => setLinkedTaskId(e.target.value)}
              >
                <option value="">— No task linked —</option>
                {pendingTasks.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sessions count */}
          {completedSessions > 0 && (
            <div className="card">
              <p className="text-xs text-gray-400 mb-2">Today's Sessions</p>
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: completedSessions }).map((_, i) => (
                  <span key={i} className="text-xl" title={`Session ${i + 1}`}>🍅</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
