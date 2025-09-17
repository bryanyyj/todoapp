const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../db/connection');
const { chatWithRAG } = require('../services/ragService');
const logger = require('../utils/logger');

const router = express.Router();

// Get chat sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT id, title, created_at, updated_at
      FROM chat_sessions 
      WHERE user_id = $1 
      ORDER BY updated_at DESC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching chat sessions:', error);
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
});

// Create new chat session
router.post('/sessions', authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;
    
    const result = await query(`
      INSERT INTO chat_sessions (user_id, title)
      VALUES ($1, $2)
      RETURNING id, title, created_at, updated_at
    `, [req.user.id, title || 'New Chat']);
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating chat session:', error);
    res.status(500).json({ error: 'Failed to create chat session' });
  }
});

// Get messages from a chat session
router.get('/sessions/:sessionId/messages', authenticateToken, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    
    // Verify session belongs to user
    const sessionCheck = await query(`
      SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2
    `, [sessionId, req.user.id]);
    
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    const result = await query(`
      SELECT id, role, content, cited_chunks, created_at
      FROM chat_messages 
      WHERE session_id = $1 
      ORDER BY created_at ASC
    `, [sessionId]);
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// Send message and get AI response
router.post('/sessions/:sessionId/messages', authenticateToken, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Verify session belongs to user
    const sessionCheck = await query(`
      SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2
    `, [sessionId, req.user.id]);
    
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    // Save user message
    await query(`
      INSERT INTO chat_messages (session_id, role, content)
      VALUES ($1, 'user', $2)
    `, [sessionId, message.trim()]);
    
    // Generate AI response using RAG
    const response = await chatWithRAG(req.user.id, message.trim());
    
    // Save AI response
    await query(`
      INSERT INTO chat_messages (session_id, role, content, cited_chunks)
      VALUES ($1, 'assistant', $2, $3)
    `, [sessionId, response.content, response.citedChunks || []]);
    
    // Update session timestamp
    await query(`
      UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = $1
    `, [sessionId]);
    
    res.json({
      content: response.content,
      citedChunks: response.citedChunks || [],
      citations: response.citations || []
    });
  } catch (error) {
    logger.error('Error processing chat message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Delete chat session
router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    
    const result = await query(`
      DELETE FROM chat_sessions 
      WHERE id = $1 AND user_id = $2
    `, [sessionId, req.user.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    res.json({ message: 'Chat session deleted successfully' });
  } catch (error) {
    logger.error('Error deleting chat session:', error);
    res.status(500).json({ error: 'Failed to delete chat session' });
  }
});

module.exports = router;