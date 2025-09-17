const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../db/connection');
const logger = require('../utils/logger');

const router = express.Router();

// Get mastery overview
router.get('/mastery', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT topic, mastery_level, confidence_score, last_tested, updated_at
      FROM topic_mastery 
      WHERE user_id = $1 
      ORDER BY mastery_level ASC, topic ASC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching topic mastery:', error);
    res.status(500).json({ error: 'Failed to fetch topic mastery' });
  }
});

// Update topic mastery
router.put('/mastery/:topic', authenticateToken, async (req, res) => {
  try {
    const { topic } = req.params;
    const { masteryLevel, confidenceScore } = req.body;
    
    const result = await query(`
      INSERT INTO topic_mastery (user_id, topic, mastery_level, confidence_score, last_tested, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, topic) 
      DO UPDATE SET 
        mastery_level = EXCLUDED.mastery_level,
        confidence_score = EXCLUDED.confidence_score,
        last_tested = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [req.user.id, topic, masteryLevel, confidenceScore]);
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating topic mastery:', error);
    res.status(500).json({ error: 'Failed to update topic mastery' });
  }
});

module.exports = router;