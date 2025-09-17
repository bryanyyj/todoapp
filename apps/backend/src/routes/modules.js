const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../db/connection');
const logger = require('../utils/logger');

const router = express.Router();

// Get user's modules
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT m.*, 
             mp.current_grade, 
             mp.completion_percentage,
             mp.study_hours,
             COUNT(DISTINCT a.id) as assignment_count,
             COUNT(DISTINCT d.id) as document_count,
             COUNT(DISTINCT qb.id) as quiz_count
      FROM modules m
      LEFT JOIN module_progress mp ON m.id = mp.module_id
      LEFT JOIN assignments a ON m.id = a.module_id
      LEFT JOIN documents d ON m.id = d.module_id
      LEFT JOIN quiz_blueprints qb ON m.id = qb.module_id
      WHERE m.user_id = $1
      GROUP BY m.id, mp.current_grade, mp.completion_percentage, mp.study_hours
      ORDER BY m.created_at DESC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

// Create new module
router.post('/', [
  authenticateToken,
  body('module_code').trim().isLength({ min: 1, max: 20 }),
  body('module_name').trim().isLength({ min: 1, max: 255 }),
  body('academic_year').optional().trim(),
  body('semester').optional().trim(),
  body('credits').optional().isInt({ min: 1, max: 20 }),
  body('lecturer_name').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      module_code,
      module_name,
      description,
      academic_year,
      semester,
      credits,
      lecturer_name
    } = req.body;

    // Check if module already exists for this user
    const existingModule = await query(`
      SELECT id FROM modules 
      WHERE user_id = $1 AND module_code = $2 AND academic_year = $3 AND semester = $4
    `, [req.user.id, module_code, academic_year || 'Year 1', semester || 'Semester 1']);

    if (existingModule.rows.length > 0) {
      return res.status(400).json({ error: 'Module with this code already exists for the selected academic year and semester' });
    }

    // Create module
    const moduleResult = await query(`
      INSERT INTO modules (
        user_id, module_code, module_name, description, 
        academic_year, semester, credits, lecturer_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      req.user.id, module_code, module_name, description,
      academic_year || 'Year 1', semester || 'Semester 1', 
      credits || 3, lecturer_name
    ]);

    const module = moduleResult.rows[0];

    // Create initial progress entry
    await query(`
      INSERT INTO module_progress (user_id, module_id, completion_percentage, study_hours)
      VALUES ($1, $2, 0, 0)
    `, [req.user.id, module.id]);

    res.status(201).json(module);
  } catch (error) {
    logger.error('Error creating module:', error);
    res.status(500).json({ error: 'Failed to create module' });
  }
});

// Get specific module with details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const moduleId = parseInt(req.params.id);
    
    // Get module with progress
    const moduleResult = await query(`
      SELECT m.*, mp.current_grade, mp.completion_percentage, mp.study_hours, mp.last_activity
      FROM modules m
      LEFT JOIN module_progress mp ON m.id = mp.module_id
      WHERE m.id = $1 AND m.user_id = $2
    `, [moduleId, req.user.id]);

    if (moduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const module = moduleResult.rows[0];

    // Get assignments for this module
    const assignmentsResult = await query(`
      SELECT * FROM assignments 
      WHERE module_id = $1 AND user_id = $2
      ORDER BY due_date ASC, created_at DESC
    `, [moduleId, req.user.id]);

    // Get documents for this module
    const documentsResult = await query(`
      SELECT id, original_name, upload_date, processing_status, file_size
      FROM documents 
      WHERE module_id = $1 AND user_id = $2
      ORDER BY upload_date DESC
    `, [moduleId, req.user.id]);

    res.json({
      ...module,
      assignments: assignmentsResult.rows,
      documents: documentsResult.rows
    });
  } catch (error) {
    logger.error('Error fetching module details:', error);
    res.status(500).json({ error: 'Failed to fetch module details' });
  }
});

// Update module
router.put('/:id', [
  authenticateToken,
  body('module_name').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim(),
  body('lecturer_name').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const moduleId = parseInt(req.params.id);
    const updates = req.body;

    // Build dynamic update query
    const updateFields = [];
    const values = [req.user.id, moduleId];
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
      UPDATE modules 
      SET ${updateFields.join(', ')}
      WHERE user_id = $1 AND id = $2
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating module:', error);
    res.status(500).json({ error: 'Failed to update module' });
  }
});

// Delete module
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const moduleId = parseInt(req.params.id);
    
    const result = await query(`
      DELETE FROM modules 
      WHERE id = $1 AND user_id = $2
    `, [moduleId, req.user.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    logger.error('Error deleting module:', error);
    res.status(500).json({ error: 'Failed to delete module' });
  }
});

module.exports = router;