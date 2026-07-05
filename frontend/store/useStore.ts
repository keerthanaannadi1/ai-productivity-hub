import { create } from 'zustand';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type Priority = 'low' | 'medium' | 'high';
export type Status = 'pending' | 'in_progress' | 'completed';
export type ViewType = 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  view_type: ViewType;
  due_date: string;
  completed_at: string | null;
  estimated_minutes: number;
  actual_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface Analytics {
  today: { tasks_completed: number; focus_minutes: number };
  allTime: { tasks_completed: number; focus_minutes: number };
  streak: number;
  weekly: {
    tasks_completed: number;
    chartData: { date: string; tasks_completed: number; focus_minutes: number }[];
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface AppStore {
  // Tasks
  tasks: Task[];
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  fetchTasks: (view?: ViewType) => Promise<void>;
  addTask: (task: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<Task>;

  // Analytics
  analytics: Analytics | null;
  fetchAnalytics: () => Promise<void>;

  // Chat
  messages: ChatMessage[];
  isChatLoading: boolean;
  fetchChatHistory: () => Promise<void>;
  sendMessage: (message: string) => Promise<{ taskCreated?: Task | null }>;
  clearChat: () => Promise<void>;

  // UI State
  showCelebration: boolean;
  celebrationMessage: string;
  triggerCelebration: (message?: string) => void;
  clearCelebration: () => void;

  showDailyPopup: boolean;
  setShowDailyPopup: (val: boolean) => void;
}

export const useStore = create<AppStore>((set, get) => ({
  // Tasks
  tasks: [],
  activeView: 'daily',

  setActiveView: (view) => {
    set({ activeView: view });
    get().fetchTasks(view);
  },

  fetchTasks: async (view) => {
    try {
      const v = view || get().activeView;
      const res = await axios.get(`${API}/api/tasks`, { params: { view_type: v } });
      set({ tasks: res.data.data });
    } catch (err) {
      console.error('fetchTasks error:', err);
    }
  },

  addTask: async (task) => {
    const res = await axios.post(`${API}/api/tasks`, task);
    const newTask = res.data.data;
    set((s) => ({ tasks: [newTask, ...s.tasks] }));
    return newTask;
  },

  updateTask: async (id, updates) => {
    const res = await axios.patch(`${API}/api/tasks/${id}`, updates);
    const updated = res.data.data;
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? updated : t)) }));
    return updated;
  },

  deleteTask: async (id) => {
    await axios.delete(`${API}/api/tasks/${id}`);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  completeTask: async (id) => {
    const updated = await get().updateTask(id, { status: 'completed' });

    // Check if all daily tasks are completed
    const allTasks = get().tasks;
    const pendingCount = allTasks.filter(
      (t) => t.id !== id && t.status !== 'completed'
    ).length;

    if (pendingCount === 0 && allTasks.length > 1) {
      set({ showDailyPopup: true });
    }

    get().triggerCelebration('🎉 Task completed!');
    await get().fetchAnalytics();
    return updated;
  },

  // Analytics
  analytics: null,

  fetchAnalytics: async () => {
    try {
      const res = await axios.get(`${API}/api/analytics/summary`);
      set({ analytics: res.data.data });
    } catch (err) {
      console.error('fetchAnalytics error:', err);
    }
  },

  // Chat
  messages: [],
  isChatLoading: false,

  fetchChatHistory: async () => {
    try {
      const res = await axios.get(`${API}/api/chat/history`);
      set({ messages: res.data.data });
    } catch (err) {
      console.error('fetchChatHistory error:', err);
    }
  },

  sendMessage: async (message) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: message };
    set((s) => ({ messages: [...s.messages, userMsg], isChatLoading: true }));

    try {
      const res = await axios.post(`${API}/api/chat/message`, { message });
      const { id, role, content, taskCreated } = res.data.data;
      const assistantMsg: ChatMessage = { id, role, content };
      set((s) => ({ messages: [...s.messages, assistantMsg], isChatLoading: false }));

      if (taskCreated) {
        await get().fetchTasks();
        get().triggerCelebration('✨ Task created by AI!');
      }

      return { taskCreated };
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: err.response?.data?.error || 'Something went wrong. Please try again.',
      };
      set((s) => ({ messages: [...s.messages, errorMsg], isChatLoading: false }));
      return {};
    }
  },

  clearChat: async () => {
    await axios.delete(`${API}/api/chat/history`);
    set({ messages: [] });
  },

  // UI State
  showCelebration: false,
  celebrationMessage: '',

  triggerCelebration: (message = '🎉 Great job!') => {
    set({ showCelebration: true, celebrationMessage: message });
    setTimeout(() => set({ showCelebration: false, celebrationMessage: '' }), 3000);
  },

  clearCelebration: () => set({ showCelebration: false }),

  showDailyPopup: false,
  setShowDailyPopup: (val) => set({ showDailyPopup: val }),
}));
