require('dotenv').config();
const express = require('express');
const cors = require('cors');

const tasksRouter = require('./routes/tasks');
const pomodoroRouter = require('./routes/pomodoro');
const analyticsRouter = require('./routes/analytics');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// Routes
app.use('/api/tasks', tasksRouter);
app.use('/api/pomodoro', pomodoroRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/chat', chatRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FocusForge API is running 🚀' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 FocusForge API running on http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
