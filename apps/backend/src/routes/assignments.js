const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../db/connection');
const logger = require('../utils/logger');

const router = express.Router();

// Get assignments for a module
router.get('/module/:moduleId', authenticateToken, async (req, res) => {
  try {
    const moduleId = parseInt(req.params.moduleId);
    
    // Verify module belongs to user
    const moduleCheck = await query(`
      SELECT id FROM modules WHERE id = $1 AND user_id = $2
    `, [moduleId, req.user.id]);
    
    if (moduleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    const result = await query(`
      SELECT a.*, m.module_name, m.module_code
      FROM assignments a
      JOIN modules m ON a.module_id = m.id
      WHERE a.module_id = $1 AND a.user_id = $2
      ORDER BY a.due_date ASC NULLS LAST, a.created_at DESC
    `, [moduleId, req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get all assignments for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    let queryText = `
      SELECT a.*, m.module_name, m.module_code
      FROM assignments a
      JOIN modules m ON a.module_id = m.id
      WHERE a.user_id = $1
    `;
    const params = [req.user.id];
    
    if (status) {
      queryText += ` AND a.status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (upcoming === 'true') {
      queryText += ` AND a.due_date >= CURRENT_DATE`;
    }
    
    queryText += ` ORDER BY a.due_date ASC NULLS LAST, a.created_at DESC`;
    
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Create new assignment
router.post('/', [
  authenticateToken,
  body('module_id').isInt({ min: 1 }),
  body('title').trim().isLength({ min: 1, max: 255 }),
  body('assignment_type').isIn(['quiz', 'project', 'exam', 'coursework', 'presentation', 'lab', 'homework']),
  body('due_date').optional().isISO8601(),
  body('max_marks').optional().isInt({ min: 0 }),
  body('weight_percentage').optional().isFloat({ min: 0, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      module_id,
      title,
      description,
      assignment_type,
      due_date,
      due_time,
      max_marks,
      weight_percentage,
      notes
    } = req.body;

    // Verify module belongs to user
    const moduleCheck = await query(`
      SELECT id FROM modules WHERE id = $1 AND user_id = $2
    `, [module_id, req.user.id]);
    
    if (moduleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const result = await query(`
      INSERT INTO assignments (
        module_id, user_id, title, description, assignment_type, 
        due_date, due_time, max_marks, weight_percentage, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      module_id, req.user.id, title, description, assignment_type,
      due_date, due_time, max_marks, weight_percentage, notes
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Update assignment
router.put('/:id', [
  authenticateToken,
  body('title').optional().trim().isLength({ min: 1, max: 255 }),
  body('assignment_type').optional().isIn(['quiz', 'project', 'exam', 'coursework', 'presentation', 'lab', 'homework']),
  body('status').optional().isIn(['pending', 'in_progress', 'completed', 'submitted', 'graded']),
  body('due_date').optional().isISO8601(),
  body('max_marks').optional().isInt({ min: 0 }),
  body('obtained_marks').optional().isInt({ min: 0 }),
  body('weight_percentage').optional().isFloat({ min: 0, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const assignmentId = parseInt(req.params.id);
    const updates = req.body;

    // Build dynamic update query
    const updateFields = [];
    const values = [req.user.id, assignmentId];
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

    const result = await query(`
      UPDATE assignments 
      SET ${updateFields.join(', ')}
      WHERE user_id = $1 AND id = $2
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// Delete assignment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id);
    
    const result = await query(`
      DELETE FROM assignments 
      WHERE id = $1 AND user_id = $2
    `, [assignmentId, req.user.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    logger.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

module.exports = router;