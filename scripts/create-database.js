const { Pool } = require('pg');

require('dotenv').config();

// Connect to postgres database (default) to create our studybuddy database
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  database: 'postgres' // Connect to default postgres database first
});

async function createDatabase() {
  try {
    console.log('Creating studybuddy database...');
    
    const client = await pool.connect();
    
    // Check if database exists
    const dbExists = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = 'studybuddy'`
    );
    
    if (dbExists.rows.length === 0) {
      // Create database
      await client.query('CREATE DATABASE studybuddy');
      console.log('✅ Database "studybuddy" created successfully');
    } else {
      console.log('✅ Database "studybuddy" already exists');
    }
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Failed to create database:', error.message);
    process.exit(1);
  }
}

createDatabase();