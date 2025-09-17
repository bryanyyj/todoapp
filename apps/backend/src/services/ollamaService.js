const axios = require('axios');
const logger = require('../utils/logger');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const CHAT_MODEL = process.env.CHAT_MODEL || 'llama3';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'mxbai-embed-large';

class OllamaService {
  async generateEmbedding(text) {
    try {
      const response = await axios.post(`${OLLAMA_URL}/api/embeddings`, {
        model: EMBEDDING_MODEL,
        prompt: text
      });
      
      return response.data.embedding;
    } catch (error) {
      logger.error('Ollama embedding error:', error.message);
      throw new Error('Failed to generate embedding');
    }
  }
  
  async chat(messages, context = '') {
    try {
      const systemPrompt = `You are a helpful study assistant. You help students understand their course materials by providing clear, accurate answers based on the provided context. Always cite your sources when referencing specific information from the materials.

${context ? `Context from study materials:\n${context}\n` : ''}

Please provide helpful, accurate responses based on the context provided. If you don't have enough information to answer a question, say so clearly.`;

      const response = await axios.post(`${OLLAMA_URL}/api/chat`, {
        model: CHAT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: false
      });
      
      return response.data.message.content;
    } catch (error) {
      logger.error('Ollama chat error:', error.message);
      throw new Error('Failed to generate chat response');
    }
  }
  
  async generateQuizQuestions(context, questionCount = 5, difficulty = 'medium') {
    try {
      const prompt = `Based on the following study material, generate ${questionCount} ${difficulty} difficulty quiz questions. 

Study Material:
${context}

Please generate questions in the following JSON format:
[
  {
    "question": "Question text",
    "type": "multiple_choice",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correctAnswer": "A",
    "explanation": "Explanation of why this is correct"
  },
  {
    "question": "Question text",
    "type": "true_false",
    "options": ["True", "False"],
    "correctAnswer": "True",
    "explanation": "Explanation"
  }
]

Mix different question types (multiple choice, true/false, short answer). Make sure questions test understanding, not just memorization.`;

      const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
        model: CHAT_MODEL,
        prompt: prompt,
        stream: false
      });
      
      // Parse the JSON response from the model
      try {
        const questions = JSON.parse(response.data.response);
        return questions;
      } catch (parseError) {
        logger.error('Failed to parse quiz questions JSON:', parseError);
        // Fallback: create a simple question if parsing fails
        return [{
          question: "What is the main topic discussed in this material?",
          type: "short_answer",
          options: [],
          correctAnswer: "See explanation",
          explanation: "This is a general question about the material content."
        }];
      }
    } catch (error) {
      logger.error('Ollama quiz generation error:', error.message);
      throw new Error('Failed to generate quiz questions');
    }
  }
  
  async isHealthy() {
    try {
      const response = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

const ollamaService = new OllamaService();

module.exports = {
  generateEmbedding: (text) => ollamaService.generateEmbedding(text),
  chat: (messages, context) => ollamaService.chat(messages, context),
  generateQuizQuestions: (context, questionCount, difficulty) => 
    ollamaService.generateQuizQuestions(context, questionCount, difficulty),
  isHealthy: () => ollamaService.isHealthy()
};