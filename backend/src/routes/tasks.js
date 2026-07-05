const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

// GET /api/tasks - get all tasks, optionally filter by view_type or date
router.get('/', (req, res) => {
  try {
    const { view_type, date } = req.query;
    let query = 'SELECT * FROM tasks';
    const params = [];

    if (view_type) {
      query += ' WHERE view_type = ?';
      params.push(view_type);
    }

    if (date && view_type === 'daily') {
      query += params.length ? ' AND' : ' WHERE';
      query += ' date(due_date) = date(?)';
      params.push(date);
    }

    query += ' ORDER BY created_at DESC';
    const tasks = db.prepare(query).all(...params);
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tasks - create a new task
router.post('/', (req, res) => {
  try {
    const { title, description, priority, view_type, due_date, estimated_minutes } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const task = {
      id: uuidv4(),
      title: title.trim(),
      description: description || '',
      priority: priority || 'medium',
      view_type: view_type || 'daily',
      due_date: due_date || new Date().toISOString().split('T')[0],
      estimated_minutes: estimated_minutes || 25,
      status: 'pending',
    };

    db.prepare(`
      INSERT INTO tasks (id, title, description, priority, view_type, due_date, estimated_minutes)
      VALUES (@id, @title, @description, @priority, @view_type, @due_date, @estimated_minutes)
    `).run(task);

    const created = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/tasks/:id - update task (title, status, priority, etc.)
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, error: 'Task not found' });

    const { title, description, status, priority, due_date, estimated_minutes, actual_minutes } = req.body;

    const completed_at =
      status === 'completed' && existing.status !== 'completed'
        ? new Date().toISOString()
        : existing.completed_at;

    db.prepare(`
      UPDATE tasks SET
        title = ?,
        description = ?,
        status = ?,
        priority = ?,
        due_date = ?,
        estimated_minutes = ?,
        actual_minutes = ?,
        completed_at = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      title ?? existing.title,
      description ?? existing.description,
      status ?? existing.status,
      priority ?? existing.priority,
      due_date ?? existing.due_date,
      estimated_minutes ?? existing.estimated_minutes,
      actual_minutes ?? existing.actual_minutes,
      completed_at,
      id
    );

    // If task just completed, update daily analytics
    if (status === 'completed' && existing.status !== 'completed') {
      const today = new Date().toISOString().split('T')[0];
      db.prepare(`
        INSERT INTO analytics (id, date, tasks_completed)
        VALUES (?, ?, 1)
        ON CONFLICT(date) DO UPDATE SET tasks_completed = tasks_completed + 1
      `).run(uuidv4(), today);
    }

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/tasks/:id - delete a task
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, error: 'Task not found' });

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
