'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import {
  RiFireLine,
  RiCheckboxCircleLine,
  RiTimerLine,
  RiBarChartLine,
} from 'react-icons/ri';
import { format, parseISO } from 'date-fns';

export default function AnalyticsDashboard() {
  const { analytics, fetchAnalytics } = useStore();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (!analytics) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Analytics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse bg-gray-800 h-24" />
          ))}
        </div>
      </div>
    );
  }

  const focusHours = (analytics.today.focus_minutes / 60).toFixed(1);
  const totalFocusHours = (analytics.allTime.focus_minutes / 60).toFixed(1);

  const statCards = [
    {
      label: 'Today\'s Tasks',
      value: analytics.today.tasks_completed,
      icon: RiCheckboxCircleLine,
      color: 'text-green-400',
      bg: 'bg-green-900/20 border-green-800/30',
    },
    {
      label: 'Focus Time Today',
      value: `${focusHours}h`,
      icon: RiTimerLine,
      color: 'text-indigo-400',
      bg: 'bg-indigo-900/20 border-indigo-800/30',
    },
    {
      label: 'Current Streak',
      value: `${analytics.streak}d`,
      icon: RiFireLine,
      color: 'text-orange-400',
      bg: 'bg-orange-900/20 border-orange-800/30',
    },
    {
      label: 'All-Time Tasks',
      value: analytics.allTime.tasks_completed,
      icon: RiBarChartLine,
      color: 'text-purple-400',
      bg: 'bg-purple-900/20 border-purple-800/30',
    },
  ];

  const chartData = analytics.weekly.chartData;
  const maxTasks = Math.max(...chartData.map((d) => d.tasks_completed), 1);
  const maxFocus = Math.max(...chartData.map((d) => d.focus_minutes), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Analytics</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          {analytics.weekly.tasks_completed} tasks completed this week
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`card border ${stat.bg}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <Icon className={`text-2xl ${stat.color} opacity-60`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks chart */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Tasks Completed (Last 7 Days)</h3>
          {chartData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
              No data yet — complete some tasks!
            </div>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {chartData.map((day, i) => {
                const height = maxTasks > 0 ? (day.tasks_completed / maxTasks) * 100 : 0;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-indigo-400 font-medium">{day.tasks_completed || ''}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                      className="w-full bg-indigo-600 rounded-t-md min-h-[4px]"
                      title={`${day.tasks_completed} tasks`}
                    />
                    <span className="text-xs text-gray-500">
                      {day.date ? format(parseISO(day.date), 'EEE') : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Focus time chart */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Focus Minutes (Last 7 Days)</h3>
          {chartData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
              No data yet — run some Pomodoro sessions!
            </div>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {chartData.map((day, i) => {
                const height = maxFocus > 0 ? (day.focus_minutes / maxFocus) * 100 : 0;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-green-400 font-medium">
                      {day.focus_minutes ? `${day.focus_minutes}m` : ''}
                    </span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                      className="w-full bg-green-600 rounded-t-md min-h-[4px]"
                      title={`${day.focus_minutes} min`}
                    />
                    <span className="text-xs text-gray-500">
                      {day.date ? format(parseISO(day.date), 'EEE') : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* All-time summary */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">All-Time Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Total Focus Hours</p>
            <p className="text-2xl font-bold text-indigo-400">{totalFocusHours}h</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Total Tasks Done</p>
            <p className="text-2xl font-bold text-green-400">{analytics.allTime.tasks_completed}</p>
          </div>
        </div>

        {analytics.streak >= 7 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 bg-orange-900/20 border border-orange-800/40 rounded-xl p-3 flex items-center gap-3"
          >
            <span className="text-2xl">🏆</span>
            <div>
              <p className="text-sm font-semibold text-orange-300">
                {analytics.streak >= 30 ? 'Month-long streak!' : analytics.streak >= 7 ? 'Week streak!' : ''}
              </p>
              <p className="text-xs text-orange-500">{analytics.streak} days in a row. Keep it going!</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
