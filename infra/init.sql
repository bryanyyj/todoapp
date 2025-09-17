-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

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
    processing_status VARCHAR(50) DEFAULT 'pending',
    module_id INTEGER,
    assignment_id INTEGER,
    assignment_title VARCHAR(255)
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

-- Create embeddings table with vector support
CREATE TABLE IF NOT EXISTS embeddings (
    id SERIAL PRIMARY KEY,
    chunk_id INTEGER REFERENCES chunks(id) ON DELETE CASCADE,
    embedding vector(1024), -- mxbai-embed-large produces 1024-dimensional vectors
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    module_code VARCHAR(20) NOT NULL,
    module_name VARCHAR(255) NOT NULL,
    description TEXT,
    academic_year VARCHAR(50),
    semester VARCHAR(50),
    credits INTEGER DEFAULT 3,
    lecturer_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignment_type VARCHAR(50) DEFAULT 'quiz',
    due_date DATE,
    due_time TIME,
    weight_percentage DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    attached_document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create module_progress table
CREATE TABLE IF NOT EXISTS module_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    current_grade DECIMAL(5,2),
    completion_percentage INTEGER DEFAULT 0,
    study_hours INTEGER DEFAULT 0,
    last_studied TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, module_id)
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
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_module_id ON documents(module_id);
CREATE INDEX IF NOT EXISTS idx_documents_assignment_id ON documents(assignment_id);
CREATE INDEX IF NOT EXISTS idx_modules_user_id ON modules(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_module_id ON assignments(module_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_module_progress_user_id ON module_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_module_id ON module_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_chunk_id ON embeddings(chunk_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_items_blueprint_id ON quiz_items(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_user_id ON topic_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_user_id ON planner_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_scheduled_date ON planner_tasks(scheduled_date);

-- Vector similarity search index
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops);

-- Sample data for development (optional)
-- INSERT INTO users (email, password_hash, name) VALUES 
-- ('demo@studybuddy.com', '$2b$10$example.hash.here', 'Demo User');