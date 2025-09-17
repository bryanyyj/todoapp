const { query } = require('../db/connection');
const { generateQuizQuestions } = require('./ollamaService');
const { getRelevantContentForQuiz } = require('./ragService');
const logger = require('../utils/logger');

async function generateQuiz(userId, options) {
  try {
    const { title, description, difficulty, questionCount } = options;
    
    // Get relevant content from user's documents
    const relevantChunks = await getRelevantContentForQuiz(userId, questionCount);
    
    if (relevantChunks.length === 0) {
      throw new Error('No documents available to generate quiz from');
    }
    
    // Create quiz blueprint
    const blueprintResult = await query(`
      INSERT INTO quiz_blueprints (user_id, title, description, source_chunks, difficulty)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [
      userId, 
      title, 
      description, 
      relevantChunks.map(chunk => chunk.id),
      difficulty
    ]);
    
    const blueprintId = blueprintResult.rows[0].id;
    
    // Generate questions using AI
    const context = relevantChunks
      .map(chunk => `[From: ${chunk.original_name}]\n${chunk.content}`)
      .join('\n\n---\n\n');
    
    const questions = await generateQuizQuestions(context, questionCount, difficulty);
    
    // Save questions to database
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const sourceChunkId = relevantChunks[i % relevantChunks.length]?.id || null;
      
      await query(`
        INSERT INTO quiz_items (
          blueprint_id, question, question_type, options, 
          correct_answer, explanation, source_chunk_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        blueprintId,
        question.question,
        question.type,
        JSON.stringify(question.options || []),
        question.correctAnswer,
        question.explanation,
        sourceChunkId
      ]);
    }
    
    // Return the complete quiz
    const quizResult = await query(`
      SELECT qb.*, 
             json_agg(
               json_build_object(
                 'id', qi.id,
                 'question', qi.question,
                 'question_type', qi.question_type,
                 'options', qi.options,
                 'explanation', qi.explanation
               ) ORDER BY qi.id
             ) as questions
      FROM quiz_blueprints qb
      LEFT JOIN quiz_items qi ON qb.id = qi.blueprint_id
      WHERE qb.id = $1
      GROUP BY qb.id
    `, [blueprintId]);
    
    return quizResult.rows[0];
  } catch (error) {
    logger.error('Quiz generation error:', error);
    throw error;
  }
}

async function gradeQuizAttempt(userId, blueprintId, userAnswers, timeTaken) {
  try {
    // Get correct answers
    const questionsResult = await query(`
      SELECT id, correct_answer, question
      FROM quiz_items 
      WHERE blueprint_id = $1 
      ORDER BY id
    `, [blueprintId]);
    
    const questions = questionsResult.rows;
    let correctCount = 0;
    const gradedAnswers = {};
    
    // Grade each answer
    for (const question of questions) {
      const userAnswer = userAnswers[question.id];
      const isCorrect = userAnswer === question.correct_answer;
      
      if (isCorrect) {
        correctCount++;
      }
      
      gradedAnswers[question.id] = {
        userAnswer,
        correctAnswer: question.correct_answer,
        isCorrect,
        question: question.question
      };
    }
    
    const score = Math.round((correctCount / questions.length) * 100);
    
    // Save attempt to database
    const attemptResult = await query(`
      INSERT INTO quiz_attempts (
        user_id, blueprint_id, score, total_questions, 
        time_taken, answers
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      userId,
      blueprintId,
      score,
      questions.length,
      timeTaken,
      JSON.stringify(gradedAnswers)
    ]);
    
    // Update topic mastery based on performance
    await updateTopicMastery(userId, score, blueprintId);
    
    return {
      attemptId: attemptResult.rows[0].id,
      score,
      correctCount,
      totalQuestions: questions.length,
      gradedAnswers
    };
  } catch (error) {
    logger.error('Quiz grading error:', error);
    throw error;
  }
}

async function updateTopicMastery(userId, score, blueprintId) {
  try {
    // This is a simplified mastery calculation
    // In a real system, you might want more sophisticated algorithms
    
    const masteryLevel = score / 100; // Convert percentage to 0-1 scale
    const confidence = Math.max(0.1, masteryLevel - 0.1); // Slightly lower confidence
    
    // For now, we'll use the quiz title as the topic
    // In a more advanced system, you'd extract actual topics from the content
    const topicResult = await query(`
      SELECT title FROM quiz_blueprints WHERE id = $1
    `, [blueprintId]);
    
    if (topicResult.rows.length > 0) {
      const topic = topicResult.rows[0].title;
      
      await query(`
        INSERT INTO topic_mastery (user_id, topic, mastery_level, confidence_score, last_tested)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, topic) 
        DO UPDATE SET 
          mastery_level = (topic_mastery.mastery_level + EXCLUDED.mastery_level) / 2,
          confidence_score = EXCLUDED.confidence_score,
          last_tested = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      `, [userId, topic, masteryLevel, confidence]);
    }
  } catch (error) {
    logger.error('Error updating topic mastery:', error);
    // Don't throw - mastery update is not critical for quiz functionality
  }
}

module.exports = {
  generateQuiz,
  gradeQuizAttempt
};