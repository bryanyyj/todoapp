const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedDatabase() {
  try {
    console.log('Seeding database with sample data...');
    
    const client = await pool.connect();
    
    // Create demo user
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const userResult = await client.query(`
      INSERT INTO users (email, password_hash, name) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, ['demo@studybuddy.com', passwordHash, 'Demo User']);
    
    let userId;
    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
      console.log('✅ Demo user created with email: demo@studybuddy.com');
      console.log('   Password: password123');
    } else {
      // Get existing user
      const existingUser = await client.query(`
        SELECT id FROM users WHERE email = $1
      `, ['demo@studybuddy.com']);
      userId = existingUser.rows[0].id;
      console.log('✅ Demo user already exists');
    }
    
    // Create sample chat session
    await client.query(`
      INSERT INTO chat_sessions (user_id, title)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [userId, 'Welcome to Study Buddy']);
    
    // Note: Topics will be created dynamically based on user's uploaded content
    // and quiz performance. No hardcoded topics for demo user.
    
    // Create sample planner tasks
    const sampleTasks = [
      {
        title: 'Review Mathematics Chapter 5',
        description: 'Focus on integration techniques',
        task_type: 'review',
        priority: 3,
        estimated_duration: 60
      },
      {
        title: 'Physics Quiz Practice',
        description: 'Practice problems on momentum and energy',
        task_type: 'quiz',
        priority: 4,
        estimated_duration: 45
      },
      {
        title: 'Read Biology Chapter 12',
        description: 'Cell division and mitosis',
        task_type: 'reading',
        priority: 2,
        estimated_duration: 90
      }
    ];
    
    const today = new Date().toISOString().split('T')[0];
    
    for (const task of sampleTasks) {
      await client.query(`
        INSERT INTO planner_tasks (
          user_id, title, description, task_type, priority, 
          estimated_duration, scheduled_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
      `, [
        userId, task.title, task.description, task.task_type, 
        task.priority, task.estimated_duration, today
      ]);
    }
    
    console.log('✅ Sample data seeded successfully');
    console.log('   - Created sample planner tasks for today');
    console.log('   - Created welcome chat session');
    console.log('   - Topics will be created dynamically based on user content');
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();