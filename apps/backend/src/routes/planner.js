const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../db/connection');
const logger = require('../utils/logger');

const router = express.Router();

// Get planner tasks
router.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;
    let queryText = `
      SELECT * FROM planner_tasks 
      WHERE user_id = $1
    `;
    let params = [req.user.id];
    
    if (date) {
      queryText += ` AND scheduled_date = $2`;
      params.push(date);
    }
    
    queryText += ` ORDER BY scheduled_date ASC, scheduled_time ASC, priority DESC`;
    
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching planner tasks:', error);
    res.status(500).json({ error: 'Failed to fetch planner tasks' });
  }
});

// Create planner task
router.post('/tasks', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      taskType,
      priority,
      estimatedDuration,
      scheduledDate,
      scheduledTime,
      relatedTopics
    } = req.body;
    
    const result = await query(`
      INSERT INTO planner_tasks (
        user_id, title, description, task_type, priority, 
        estimated_duration, scheduled_date, scheduled_time, related_topics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      req.user.id, title, description, taskType, priority,
      estimatedDuration, scheduledDate, scheduledTime, relatedTopics || []
    ]);
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating planner task:', error);
    res.status(500).json({ error: 'Failed to create planner task' });
  }
});

// Update planner task
router.put('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const updates = req.body;
    
    // Build dynamic update query
    const updateFields = [];
    const values = [req.user.id, taskId];
    let paramCount = 2;
    
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    const queryText = `
      UPDATE planner_tasks 
      SET ${updateFields.join(', ')}
      WHERE user_id = $1 AND id = $2
      RETURNING *
    `;
    
    const result = await query(queryText, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating planner task:', error);
    res.status(500).json({ error: 'Failed to update planner task' });
  }
});

// Complete planner task
router.patch('/tasks/:id/complete', authenticateToken, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    const result = await query(`
      UPDATE planner_tasks 
      SET completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND id = $2
      RETURNING *
    `, [req.user.id, taskId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error completing planner task:', error);
    res.status(500).json({ error: 'Failed to complete planner task' });
  }
});

// Delete planner task
router.delete('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    const result = await query(`
      DELETE FROM planner_tasks 
      WHERE user_id = $1 AND id = $2
    `, [req.user.id, taskId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    logger.error('Error deleting planner task:', error);
    res.status(500).json({ error: 'Failed to delete planner task' });
  }
});

module.exports = router;