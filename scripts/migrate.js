const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    const client = await pool.connect();
    
    // Read and execute the init.sql file
    const sqlPath = path.join(__dirname, '..', 'infra', 'init.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    await client.query(sql);
    
    console.log('✅ Database migrations completed successfully');
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();