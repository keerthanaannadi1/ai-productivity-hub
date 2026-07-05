'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import Sidebar from '@/components/layout/Sidebar';
import TaskManager from '@/components/tasks/TaskManager';
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import AIChatbot from '@/components/chat/AIChatbot';
import CelebrationOverlay from '@/components/celebration/CelebrationOverlay';
import DailyCompletionPopup from '@/components/celebration/DailyCompletionPopup';

type Tab = 'tasks' | 'pomodoro' | 'analytics' | 'chat';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const { analytics, fetchAnalytics, fetchTasks } = useStore();

  useEffect(() => {
    fetchAnalytics();
    fetchTasks();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'tasks': return <TaskManager />;
      case 'pomodoro': return <PomodoroTimer />;
      case 'analytics': return <AnalyticsDashboard />;
      case 'chat': return <AIChatbot />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as Tab)}
        streak={analytics?.streak ?? 0}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Global overlays */}
      <CelebrationOverlay />
      <DailyCompletionPopup />
    </div>
  );
}
