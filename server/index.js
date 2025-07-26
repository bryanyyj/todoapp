import express from 'express';
import cors from 'cors';
import { rankTasks } from './aiService.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/rank-tasks', async (req, res) => {
  try {
    const { tasks, userContext } = req.body;
    
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks array is required' });
    }

    const rankedTasks = await rankTasks(tasks, userContext);
    res.json({ rankedTasks });
  } catch (error) {
    console.error('Error ranking tasks:', error);
    res.status(500).json({ error: 'Failed to rank tasks' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Todo Backend is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});