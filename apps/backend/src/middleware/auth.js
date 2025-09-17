const jwt = require('jsonwebtoken');
const { query } = require('../db/connection');
const logger = require('../utils/logger');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist
    const result = await query('SELECT id, email, name FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }
    
    req.user = result.rows[0];
    next();
  } catch (error) {
    logger.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

module.exports = {
  authenticateToken
};