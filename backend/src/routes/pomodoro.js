const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

// POST /api/pomodoro/start - start a pomodoro session
router.post('/start', (req, res) => {
  try {
    const { task_id, duration_minutes, session_type } = req.body;

    const session = {
      id: uuidv4(),
      task_id: task_id || null,
      duration_minutes: duration_minutes || 25,
      session_type: session_type || 'work',
    };

    db.prepare(`
      INSERT INTO pomodoro_sessions (id, task_id, duration_minutes, session_type)
      VALUES (@id, @task_id, @duration_minutes, @session_type)
    `).run(session);

    const created = db.prepare('SELECT * FROM pomodoro_sessions WHERE id = ?').get(session.id);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/pomodoro/:id/complete - mark session as completed
router.patch('/:id/complete', (req, res) => {
  try {
    const { id } = req.params;
    const session = db.prepare('SELECT * FROM pomodoro_sessions WHERE id = ?').get(id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    db.prepare(`
      UPDATE pomodoro_sessions
      SET completed = 1, ended_at = datetime('now')
      WHERE id = ?
    `).run(id);

    // Update analytics with focus time
    if (session.session_type === 'work') {
      const today = new Date().toISOString().split('T')[0];
      db.prepare(`
        INSERT INTO analytics (id, date, focus_minutes)
        VALUES (?, ?, ?)
        ON CONFLICT(date) DO UPDATE SET focus_minutes = focus_minutes + ?
      `).run(uuidv4(), today, session.duration_minutes, session.duration_minutes);
    }

    const updated = db.prepare('SELECT * FROM pomodoro_sessions WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/pomodoro/history - get recent sessions
router.get('/history', (req, res) => {
  try {
    const sessions = db.prepare(`
      SELECT ps.*, t.title as task_title
      FROM pomodoro_sessions ps
      LEFT JOIN tasks t ON ps.task_id = t.id
      ORDER BY ps.started_at DESC
      LIMIT 20
    `).all();
    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
