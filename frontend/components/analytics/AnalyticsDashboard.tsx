'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import {
  RiFireLine,
  RiCheckboxCircleLine,
  RiTimerLine,
  RiBarChartLine,
} from 'react-icons/ri';
import { format, parseISO, isToday } from 'date-fns';

type GraphTab = 'daily' | 'weekly';

export default function AnalyticsDashboard() {
  const { analytics, fetchAnalytics, tasks } = useStore();
  const [graphTab, setGraphTab] = useState<GraphTab>('daily');

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
      label: "Today's Tasks",
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

  // --- Daily graph: tasks completed per hour today ---
  const hours = Array.from({ length: 24 }, (_, h) => h);
  const completedToday = tasks.filter(
    (t) => t.status === 'completed' && t.completed_at && isToday(new Date(t.completed_at))
  );
  const tasksByHour = hours.map((h) => ({
    hour: h,
    count: completedToday.filter((t) => new Date(t.completed_at!).getHours() === h).length,
  }));
  // Only show hours 6am–11pm for a cleaner chart
  const dailyChartData = tasksByHour.filter((d) => d.hour >= 6 && d.hour <= 23);
  const maxDailyTasks = Math.max(...dailyChartData.map((d) => d.count), 1);

  // --- Weekly graph: last 7 days ---
  const weeklyChartData = analytics.weekly.chartData;
  const maxWeeklyTasks = Math.max(...weeklyChartData.map((d) => d.tasks_completed), 1);
  const maxWeeklyFocus = Math.max(...weeklyChartData.map((d) => d.focus_minutes), 1);

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

      {/* Graph section */}
      <div className="card space-y-4">
        {/* Tab switcher */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-300">
            {graphTab === 'daily' ? 'Tasks Completed Today (by hour)' : 'Last 7 Days Overview'}
          </h3>
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            {(['daily', 'weekly'] as GraphTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setGraphTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  graphTab === tab
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab === 'daily' ? '📅 Daily' : '📆 Weekly'}
              </button>
            ))}
          </div>
        </div>

        {/* Daily graph */}
        {graphTab === 'daily' && (
          <motion.div
            key="daily"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {completedToday.length === 0 ? (
              <div className="h-36 flex items-center justify-center text-gray-500 text-sm">
                No tasks completed yet today — get started! 💪
              </div>
            ) : (
              <div className="flex items-end gap-1 h-36">
                {dailyChartData.map((d, i) => {
                  const height = (d.count / maxDailyTasks) * 100;
                  return (
                    <div key={d.hour} className="flex-1 flex flex-col items-center gap-1">
                      {d.count > 0 && (
                        <span className="text-xs text-indigo-400 font-medium">{d.count}</span>
                      )}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: d.count > 0 ? `${height}%` : '4px' }}
                        transition={{ delay: i * 0.03, duration: 0.35 }}
                        className={`w-full rounded-t-md ${
                          d.count > 0 ? 'bg-indigo-600' : 'bg-gray-800'
                        }`}
                        style={{ minHeight: '4px' }}
                        title={`${d.count} task${d.count !== 1 ? 's' : ''} at ${d.hour}:00`}
                      />
                      {/* Show label every 3 hours */}
                      <span className="text-xs text-gray-600">
                        {d.hour % 3 === 0 ? `${d.hour}h` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Weekly graph */}
        {graphTab === 'weekly' && (
          <motion.div
            key="weekly"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {weeklyChartData.length === 0 ? (
              <div className="h-36 flex items-center justify-center text-gray-500 text-sm">
                No data yet — complete some tasks!
              </div>
            ) : (
              <>
                {/* Tasks bar chart */}
                <div>
                  <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Tasks Completed</p>
                  <div className="flex items-end gap-2 h-32">
                    {weeklyChartData.map((day, i) => {
                      const height = (day.tasks_completed / maxWeeklyTasks) * 100;
                      return (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs text-indigo-400 font-medium">
                            {day.tasks_completed || ''}
                          </span>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: i * 0.05, duration: 0.4 }}
                            className="w-full bg-indigo-600 rounded-t-md"
                            style={{ minHeight: '4px' }}
                            title={`${day.tasks_completed} tasks`}
                          />
                          <span className="text-xs text-gray-500">
                            {day.date ? format(parseISO(day.date), 'EEE') : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Focus minutes bar chart */}
                <div>
                  <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Focus Minutes</p>
                  <div className="flex items-end gap-2 h-32">
                    {weeklyChartData.map((day, i) => {
                      const height = (day.focus_minutes / maxWeeklyFocus) * 100;
                      return (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs text-green-400 font-medium">
                            {day.focus_minutes ? `${day.focus_minutes}m` : ''}
                          </span>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: i * 0.05, duration: 0.4 }}
                            className="w-full bg-green-600 rounded-t-md"
                            style={{ minHeight: '4px' }}
                            title={`${day.focus_minutes} min`}
                          />
                          <span className="text-xs text-gray-500">
                            {day.date ? format(parseISO(day.date), 'EEE') : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
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
                {analytics.streak >= 30 ? 'Month-long streak!' : 'Week streak!'}
              </p>
              <p className="text-xs text-orange-500">{analytics.streak} days in a row. Keep it going!</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
