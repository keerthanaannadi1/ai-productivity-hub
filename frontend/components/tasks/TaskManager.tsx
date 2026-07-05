'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, Task, ViewType, Priority } from '@/store/useStore';
import {
  RiAddLine,
  RiDeleteBinLine,
  RiCheckLine,
  RiTimeLine,
  RiCalendarLine,
  RiArrowUpLine,
  RiArrowDownLine,
} from 'react-icons/ri';
import { format } from 'date-fns';

const VIEW_TABS: { id: ViewType; label: string; emoji: string }[] = [
  { id: 'daily', label: 'Daily', emoji: '📅' },
  { id: 'weekly', label: 'Weekly', emoji: '📆' },
  { id: 'monthly', label: 'Monthly', emoji: '🗓️' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'high', label: '🔴 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low', label: '🟢 Low' },
];

export default function TaskManager() {
  const { tasks, activeView, setActiveView, addTask, completeTask, deleteTask, fetchTasks } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newEstimate, setNewEstimate] = useState(25);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchTasks(activeView);
  }, []);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setIsAdding(true);
    try {
      await addTask({
        title: newTitle.trim(),
        priority: newPriority,
        view_type: activeView,
        estimated_minutes: newEstimate,
        due_date: new Date().toISOString().split('T')[0],
      });
      setNewTitle('');
      setNewPriority('medium');
      setNewEstimate(25);
      setShowForm(false);
    } finally {
      setIsAdding(false);
    }
  };

  const pending = tasks.filter((t) => t.status !== 'completed');
  const completed = tasks.filter((t) => t.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Tasks</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {pending.length} pending · {completed.length} completed
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary flex items-center gap-2"
        >
          <RiAddLine className="text-lg" />
          Add Task
        </motion.button>
      </div>

      {/* View tabs */}
      <div className="flex gap-2 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === tab.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Add task form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card space-y-4"
          >
            <h3 className="font-semibold text-white">New Task</h3>
            <input
              className="input"
              placeholder="What do you need to do?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Priority</label>
                <select
                  className="input text-sm"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as Priority)}
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Est. minutes</label>
                <input
                  type="number"
                  className="input text-sm"
                  value={newEstimate}
                  onChange={(e) => setNewEstimate(Number(e.target.value))}
                  min={5}
                  step={5}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn-ghost text-sm" onClick={() => setShowForm(false)}>Cancel</button>
              <button
                className="btn-primary text-sm"
                onClick={handleAdd}
                disabled={isAdding || !newTitle.trim()}
              >
                {isAdding ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-300 font-medium">No tasks yet</p>
          <p className="text-gray-500 text-sm mt-1">Add your first task to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pending tasks */}
          {pending.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium px-1">
                Pending ({pending.length})
              </p>
              <AnimatePresence>
                {pending.map((task) => (
                  <TaskCard key={task.id} task={task} onComplete={completeTask} onDelete={deleteTask} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Completed tasks */}
          {completed.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium px-1">
                Completed ({completed.length})
              </p>
              <AnimatePresence>
                {completed.map((task) => (
                  <TaskCard key={task.id} task={task} onComplete={completeTask} onDelete={deleteTask} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  onComplete,
  onDelete,
}: {
  task: Task;
  onComplete: (id: string) => Promise<Task>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const isDone = task.status === 'completed';

  const handleComplete = async () => {
    if (isDone) return;
    setLoading(true);
    await onComplete(task.id);
    setLoading(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`card flex items-center gap-4 group hover:border-gray-700 transition-all ${
        isDone ? 'opacity-50' : ''
      }`}
    >
      {/* Complete button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleComplete}
        disabled={loading || isDone}
        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          isDone
            ? 'bg-green-600 border-green-600 text-white'
            : 'border-gray-600 hover:border-indigo-500 hover:bg-indigo-600/10'
        }`}
      >
        {isDone && <RiCheckLine className="text-xs" />}
      </motion.button>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isDone ? 'line-through text-gray-500' : 'text-gray-100'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className={`badge-${task.priority}`}>{task.priority}</span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <RiTimeLine className="text-xs" />
            {task.estimated_minutes}m
          </span>
          {task.completed_at && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <RiCheckLine className="text-xs" />
              {format(new Date(task.completed_at), 'h:mm a')}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        className="shrink-0 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
        aria-label="Delete task"
      >
        <RiDeleteBinLine />
      </button>
    </motion.div>
  );
}
