const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  try {
    console.log('Running database migrations (without vector extension)...');
    
    const client = await pool.connect();
    
    // Modified SQL without pgvector extension
    const sql = `
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    file_size INTEGER,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processing_status VARCHAR(50) DEFAULT 'pending'
);

-- Create chunks table for document fragments
CREATE TABLE IF NOT EXISTS chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create embeddings table without vector support (we'll store as JSON for now)
CREATE TABLE IF NOT EXISTS embeddings (
    id SERIAL PRIMARY KEY,
    chunk_id INTEGER REFERENCES chunks(id) ON DELETE CASCADE,
    embedding JSON, -- Store as JSON instead of vector type
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    cited_chunks INTEGER[], -- Array of chunk IDs that were used to generate this response
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quiz_blueprints table
CREATE TABLE IF NOT EXISTS quiz_blueprints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source_chunks INTEGER[], -- Array of chunk IDs used to generate questions
    difficulty VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quiz_items table
CREATE TABLE IF NOT EXISTS quiz_items (
    id SERIAL PRIMARY KEY,
    blueprint_id INTEGER REFERENCES quiz_blueprints(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- 'multiple_choice', 'true_false', 'short_answer'
    options JSONB, -- For multiple choice questions
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    source_chunk_id INTEGER REFERENCES chunks(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    blueprint_id INTEGER REFERENCES quiz_blueprints(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    time_taken INTEGER, -- in seconds
    answers JSONB NOT NULL, -- Store user answers and correctness
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create topic_mastery table
CREATE TABLE IF NOT EXISTS topic_mastery (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    mastery_level DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00
    confidence_score DECIMAL(3,2) DEFAULT 0.00,
    last_tested TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, topic)
);

-- Create planner_tasks table
CREATE TABLE IF NOT EXISTS planner_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50), -- 'review', 'practice', 'quiz', 'reading'
    priority INTEGER DEFAULT 1, -- 1-5 scale
    estimated_duration INTEGER, -- in minutes
    scheduled_date DATE,
    scheduled_time TIME,
    completed_at TIMESTAMP,
    related_topics TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_chunk_id ON embeddings(chunk_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_items_blueprint_id ON quiz_items(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_user_id ON topic_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_user_id ON planner_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_scheduled_date ON planner_tasks(scheduled_date);
    `;
    
    await client.query(sql);
    
    console.log('✅ Database migrations completed successfully (without vector search)');
    console.log('   Note: Vector similarity search is disabled - using basic text search instead');
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();