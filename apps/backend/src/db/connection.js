const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // Test the connection
    const result = await client.query('SELECT NOW()');
    logger.info('Database connected at:', result.rows[0].now);
    
    // Check if pgvector extension is available
    const vectorCheck = await client.query("SELECT * FROM pg_extension WHERE extname = 'vector'");
    if (vectorCheck.rows.length === 0) {
      logger.warn('pgvector extension not found - vector operations may not work');
    } else {
      logger.info('pgvector extension is available');
    }
    
    client.release();
  } catch (error) {
    logger.error('Database connection error:', error);
    throw error;
  }
}

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // Only log slow queries (> 1 second) or in production
    if (duration > 1000 || process.env.NODE_ENV === 'production') {
      logger.debug('Query executed', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    logger.error('Query error', { text, error: error.message });
    throw error;
  }
}

async function getClient() {
  return await pool.connect();
}

module.exports = {
  query,
  getClient,
  pool,
  initializeDatabase
};