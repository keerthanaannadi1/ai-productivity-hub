const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../focusforge.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    view_type TEXT DEFAULT 'daily' CHECK(view_type IN ('daily', 'weekly', 'monthly')),
    due_date TEXT,
    completed_at TEXT,
    estimated_minutes INTEGER DEFAULT 25,
    actual_minutes INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    duration_minutes INTEGER NOT NULL,
    session_type TEXT DEFAULT 'work' CHECK(session_type IN ('work', 'break')),
    completed INTEGER DEFAULT 0,
    started_at TEXT DEFAULT (datetime('now')),
    ended_at TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY,
    date TEXT UNIQUE NOT NULL,
    tasks_completed INTEGER DEFAULT 0,
    focus_minutes INTEGER DEFAULT 0,
    streak_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

console.log('✅ Database initialized at', DB_PATH);

module.exports = db;
