const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk');
const db = require('../db/database');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are FocusForge AI, a friendly and motivating productivity assistant built into the FocusForge app.

Your capabilities:
- Help users manage their tasks (create, prioritize, break down large tasks)
- Give productivity tips and encouragement
- Suggest what task to work on next
- Help plan their day or week
- Detect when users want to create a task and extract the task details

When a user wants to create a task, respond with a JSON block in this exact format wrapped in triple backticks with "json" label:
\`\`\`json
{"action": "create_task", "title": "task title here", "priority": "high|medium|low", "estimated_minutes": 25}
\`\`\`
Then follow it with a friendly confirmation message.

Keep responses concise, positive, and actionable. You know the user is using FocusForge to be more productive.`;

// GET /api/chat/history
router.get('/history', (req, res) => {
  try {
    const messages = db.prepare(`
      SELECT * FROM chat_messages ORDER BY created_at ASC LIMIT 50
    `).all();
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/chat/message
router.post('/message', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    // Save user message
    const userMsgId = uuidv4();
    db.prepare(`
      INSERT INTO chat_messages (id, role, content) VALUES (?, 'user', ?)
    `).run(userMsgId, message.trim());

    // Get recent chat history for context (last 10 messages)
    const history = db.prepare(`
      SELECT role, content FROM chat_messages
      ORDER BY created_at DESC LIMIT 10
    `).all().reverse();

    // Get user's current tasks for context
    const pendingTasks = db.prepare(`
      SELECT title, priority FROM tasks
      WHERE status != 'completed'
      ORDER BY created_at DESC LIMIT 5
    `).all();

    const taskContext = pendingTasks.length
      ? `\n\nUser's current pending tasks: ${pendingTasks.map(t => `"${t.title}" (${t.priority})`).join(', ')}`
      : '';

    // Call Groq
    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + taskContext },
        ...history.map(m => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const assistantContent = completion.choices[0].message.content;

    // Save assistant message
    const assistantMsgId = uuidv4();
    db.prepare(`
      INSERT INTO chat_messages (id, role, content) VALUES (?, 'assistant', ?)
    `).run(assistantMsgId, assistantContent);

    // Check if response contains a task creation action
    let taskCreated = null;
    const jsonMatch = assistantContent.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.action === 'create_task' && parsed.title) {
          const newTask = {
            id: uuidv4(),
            title: parsed.title,
            description: '',
            priority: parsed.priority || 'medium',
            view_type: 'daily',
            due_date: new Date().toISOString().split('T')[0],
            estimated_minutes: parsed.estimated_minutes || 25,
          };
          db.prepare(`
            INSERT INTO tasks (id, title, description, priority, view_type, due_date, estimated_minutes)
            VALUES (@id, @title, @description, @priority, @view_type, @due_date, @estimated_minutes)
          `).run(newTask);
          taskCreated = newTask;
        }
      } catch (_) {
        // JSON parse failed — ignore
      }
    }

    res.json({
      success: true,
      data: {
        id: assistantMsgId,
        role: 'assistant',
        content: assistantContent,
        taskCreated,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/chat/history - clear chat
router.delete('/history', (req, res) => {
  try {
    db.prepare('DELETE FROM chat_messages').run();
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
