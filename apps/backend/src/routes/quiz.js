const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../db/connection');
const { generateQuiz, gradeQuizAttempt } = require('../services/quizService');
const logger = require('../utils/logger');

const router = express.Router();

// Create new quiz
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { title, description, difficulty, topicCount } = req.body;
    
    const quiz = await generateQuiz(req.user.id, {
      title: title || 'Generated Quiz',
      description,
      difficulty: difficulty || 'medium',
      questionCount: topicCount || 10
    });
    
    res.json(quiz);
  } catch (error) {
    logger.error('Error generating quiz:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Get user's quiz blueprints
router.get('/blueprints', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT qb.*, COUNT(qi.id) as question_count
      FROM quiz_blueprints qb
      LEFT JOIN quiz_items qi ON qb.id = qi.blueprint_id
      WHERE qb.user_id = $1
      GROUP BY qb.id
      ORDER BY qb.created_at DESC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching quiz blueprints:', error);
    res.status(500).json({ error: 'Failed to fetch quiz blueprints' });
  }
});

// Get quiz questions
router.get('/blueprints/:id/questions', authenticateToken, async (req, res) => {
  try {
    const blueprintId = parseInt(req.params.id);
    
    // Verify blueprint belongs to user
    const blueprintCheck = await query(`
      SELECT id FROM quiz_blueprints WHERE id = $1 AND user_id = $2
    `, [blueprintId, req.user.id]);
    
    if (blueprintCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    const result = await query(`
      SELECT id, question, question_type, options, explanation, source_chunk_id
      FROM quiz_items 
      WHERE blueprint_id = $1 
      ORDER BY id
    `, [blueprintId]);
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching quiz questions:', error);
    res.status(500).json({ error: 'Failed to fetch quiz questions' });
  }
});

// Submit quiz attempt
router.post('/blueprints/:id/attempt', authenticateToken, async (req, res) => {
  try {
    const blueprintId = parseInt(req.params.id);
    const { answers, timeTaken } = req.body;
    
    // Verify blueprint belongs to user
    const blueprintCheck = await query(`
      SELECT id FROM quiz_blueprints WHERE id = $1 AND user_id = $2
    `, [blueprintId, req.user.id]);
    
    if (blueprintCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    const result = await gradeQuizAttempt(req.user.id, blueprintId, answers, timeTaken);
    res.json(result);
  } catch (error) {
    logger.error('Error submitting quiz attempt:', error);
    res.status(500).json({ error: 'Failed to submit quiz attempt' });
  }
});

// Get quiz attempts
router.get('/attempts', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT qa.*, qb.title as quiz_title
      FROM quiz_attempts qa
      JOIN quiz_blueprints qb ON qa.blueprint_id = qb.id
      WHERE qa.user_id = $1
      ORDER BY qa.started_at DESC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching quiz attempts:', error);
    res.status(500).json({ error: 'Failed to fetch quiz attempts' });
  }
});

module.exports = router;