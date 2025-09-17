const { query } = require('../db/connection');
const { generateEmbedding, chat } = require('./ollamaService');
const logger = require('../utils/logger');

async function findSimilarChunks(userId, questionEmbedding, limit = 5) {
  try {
    const result = await query(`
      SELECT c.id, c.content, c.document_id, d.original_name,
             1 - (e.embedding <=> $1::vector) as similarity
      FROM chunks c
      JOIN embeddings e ON c.id = e.chunk_id
      JOIN documents d ON c.document_id = d.id
      WHERE d.user_id = $2 
        AND d.processing_status = 'completed'
      ORDER BY similarity DESC
      LIMIT $3
    `, [JSON.stringify(questionEmbedding), userId, limit]);
    
    return result.rows;
  } catch (error) {
    logger.error('Error finding similar chunks:', error);
    return [];
  }
}

async function chatWithRAG(userId, question) {
  try {
    // Generate embedding for the question
    const questionEmbedding = await generateEmbedding(question);
    
    // Find similar chunks
    const similarChunks = await findSimilarChunks(userId, questionEmbedding);
    
    if (similarChunks.length === 0) {
      return {
        content: "I don't have any relevant study materials uploaded to answer this question. Please upload some documents first and try again.",
        citedChunks: [],
        citations: []
      };
    }
    
    // Build context from similar chunks
    const context = similarChunks
      .map((chunk, index) => `[Source ${index + 1}: ${chunk.original_name}]\n${chunk.content}`)
      .join('\n\n');
    
    // Generate response using chat model with context
    const response = await chat([{ role: 'user', content: question }], context);
    
    // Build citations
    const citations = similarChunks.map((chunk, index) => ({
      sourceNumber: index + 1,
      documentName: chunk.original_name,
      chunkId: chunk.id,
      similarity: chunk.similarity
    }));
    
    return {
      content: response,
      citedChunks: similarChunks.map(chunk => chunk.id),
      citations: citations
    };
  } catch (error) {
    logger.error('RAG chat error:', error);
    throw new Error('Failed to process question with RAG');
  }
}

async function getRelevantContentForQuiz(userId, topicCount = 10) {
  try {
    // Get random chunks from user's documents to create diverse quiz content
    const result = await query(`
      SELECT c.id, c.content, c.document_id, d.original_name
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      WHERE d.user_id = $1 
        AND d.processing_status = 'completed'
        AND LENGTH(c.content) > 100  -- Ensure chunks have enough content
      ORDER BY RANDOM()
      LIMIT $2
    `, [userId, topicCount * 2]); // Get more chunks to have variety
    
    return result.rows;
  } catch (error) {
    logger.error('Error getting relevant content for quiz:', error);
    return [];
  }
}

module.exports = {
  chatWithRAG,
  findSimilarChunks,
  getRelevantContentForQuiz
};