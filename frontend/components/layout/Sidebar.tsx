'use client';

import { motion } from 'framer-motion';
import {
  RiCheckboxMultipleLine,
  RiTimerLine,
  RiBarChartLine,
  RiRobotLine,
  RiFireLine,
} from 'react-icons/ri';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  streak: number;
}

const navItems = [
  { id: 'tasks', label: 'Tasks', icon: RiCheckboxMultipleLine },
  { id: 'pomodoro', label: 'Pomodoro', icon: RiTimerLine },
  { id: 'analytics', label: 'Analytics', icon: RiBarChartLine },
  { id: 'chat', label: 'AI Chat', icon: RiRobotLine },
];

export default function Sidebar({ activeTab, onTabChange, streak }: SidebarProps) {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-lg">
            ⚡
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-none">FocusForge</h1>
            <p className="text-xs text-gray-500 mt-0.5">AI Productivity Hub</p>
          </div>
        </div>
      </div>

      {/* Streak badge */}
      {streak > 0 && (
        <div className="mx-4 mt-4 bg-orange-950/60 border border-orange-800/50 rounded-xl p-3 flex items-center gap-2">
          <RiFireLine className="text-orange-400 text-xl shrink-0" />
          <div>
            <p className="text-xs text-orange-300 font-semibold">{streak} Day Streak!</p>
            <p className="text-xs text-orange-500">Keep it up 🔥</p>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              }`}
            >
              <Icon className="text-xl shrink-0" />
              {item.label}
              {item.id === 'chat' && (
                <span className="ml-auto text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">AI</span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-600 text-center">FocusForge v1.0 · Phase 1</p>
      </div>
    </aside>
  );
}
