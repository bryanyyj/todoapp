const { Pool } = require('pg');

require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addModulesSchema() {
  try {
    console.log('Adding modules schema to database...');
    
    const client = await pool.connect();
    
    const sql = `
-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    module_code VARCHAR(20) NOT NULL,
    module_name VARCHAR(255) NOT NULL,
    description TEXT,
    academic_year VARCHAR(10), -- e.g., "2024/25"
    semester VARCHAR(20), -- e.g., "Semester 1", "Semester 2"
    credits INTEGER DEFAULT 3,
    lecturer_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, module_code, academic_year, semester)
);

-- Create assignments table  
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignment_type VARCHAR(50), -- 'quiz', 'project', 'exam', 'coursework', 'presentation'
    due_date DATE,
    due_time TIME,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'submitted', 'graded'
    grade VARCHAR(10), -- 'A+', 'B', '85%', etc.
    max_marks INTEGER,
    obtained_marks INTEGER,
    weight_percentage DECIMAL(5,2), -- How much this assignment contributes to final grade
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update documents table to link to modules
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL;

-- Update quiz_blueprints to link to modules  
ALTER TABLE quiz_blueprints
ADD COLUMN IF NOT EXISTS module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL;

-- Update topic_mastery to link to modules
ALTER TABLE topic_mastery 
ADD COLUMN IF NOT EXISTS module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL;

-- Create module_progress table for overall module performance tracking
CREATE TABLE IF NOT EXISTS module_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    current_grade DECIMAL(5,2), -- Current overall grade in the module
    completion_percentage DECIMAL(5,2) DEFAULT 0, -- How much of the module content is covered
    study_hours INTEGER DEFAULT 0, -- Hours spent studying this module
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, module_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_modules_user_id ON modules(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_module_id ON assignments(module_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_documents_module_id ON documents(module_id);
CREATE INDEX IF NOT EXISTS idx_quiz_blueprints_module_id ON quiz_blueprints(module_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_module_id ON topic_mastery(module_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_user_id ON module_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_module_id ON module_progress(module_id);
    `;
    
    await client.query(sql);
    
    console.log('✅ Modules schema added successfully');
    console.log('   - Created modules table');
    console.log('   - Created assignments table'); 
    console.log('   - Created module_progress table');
    console.log('   - Updated existing tables to link to modules');
    console.log('   - Added performance indexes');
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Failed to add modules schema:', error);
    process.exit(1);
  }
}

addModulesSchema();