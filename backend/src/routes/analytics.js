const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/analytics/summary - get overall stats
router.get('/summary', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Today's stats
    const todayStats = db.prepare(`
      SELECT * FROM analytics WHERE date = ?
    `).get(today) || { tasks_completed: 0, focus_minutes: 0 };

    // Total tasks completed all time
    const totalTasks = db.prepare(`
      SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'
    `).get();

    // Total focus minutes all time
    const totalFocus = db.prepare(`
      SELECT COALESCE(SUM(focus_minutes), 0) as total FROM analytics
    `).get();

    // Calculate streak
    const streak = calculateStreak();

    // Last 7 days data for chart
    const last7Days = db.prepare(`
      SELECT date, tasks_completed, focus_minutes
      FROM analytics
      WHERE date >= date('now', '-6 days')
      ORDER BY date ASC
    `).all();

    // Weekly tasks completed
    const weeklyCompleted = db.prepare(`
      SELECT COUNT(*) as count FROM tasks
      WHERE status = 'completed'
      AND date(completed_at) >= date('now', '-6 days')
    `).get();

    res.json({
      success: true,
      data: {
        today: {
          tasks_completed: todayStats.tasks_completed,
          focus_minutes: todayStats.focus_minutes,
        },
        allTime: {
          tasks_completed: totalTasks.count,
          focus_minutes: totalFocus.total,
        },
        streak,
        weekly: {
          tasks_completed: weeklyCompleted.count,
          chartData: last7Days,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function calculateStreak() {
  try {
    const rows = db.prepare(`
      SELECT date FROM analytics
      WHERE tasks_completed > 0
      ORDER BY date DESC
    `).all();

    if (!rows.length) return 0;

    let streak = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);

    for (const row of rows) {
      const rowDate = new Date(row.date);
      rowDate.setHours(0, 0, 0, 0);
      const diff = (current - rowDate) / (1000 * 60 * 60 * 24);

      if (diff <= 1) {
        streak++;
        current = rowDate;
      } else {
        break;
      }
    }

    return streak;
  } catch {
    return 0;
  }
}

module.exports = router;
