const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { query } = require('../db/connection');
const { generateEmbedding } = require('./ollamaService');
const logger = require('../utils/logger');

async function extractTextFromFile(filePath, mimeType) {
  try {
    let text = '';
    
    if (mimeType === 'application/pdf') {
      const buffer = await fs.readFile(filePath);
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const buffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (mimeType === 'text/plain') {
      text = await fs.readFile(filePath, 'utf-8');
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
    
    return text.trim();
  } catch (error) {
    logger.error(`Error extracting text from ${filePath}:`, error);
    throw error;
  }
}

function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  let currentSize = 0;
  
  for (const sentence of sentences) {
    const sentenceWithPunctuation = sentence.trim() + '.';
    
    if (currentSize + sentenceWithPunctuation.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // Create overlap by keeping last few sentences
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 6)); // Rough estimate
      currentChunk = overlapWords.join(' ') + ' ' + sentenceWithPunctuation;
      currentSize = currentChunk.length;
    } else {
      currentChunk += ' ' + sentenceWithPunctuation;
      currentSize += sentenceWithPunctuation.length;
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

async function processDocument(documentId, filePath, mimeType) {
  try {
    logger.info(`Processing document ${documentId}`);
    
    // Extract text
    const text = await extractTextFromFile(filePath, mimeType);
    
    if (!text || text.length === 0) {
      throw new Error('No text extracted from document');
    }
    
    // Chunk text
    const chunks = chunkText(text);
    logger.info(`Created ${chunks.length} chunks for document ${documentId}`);
    
    // Save chunks to database
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Insert chunk
      const chunkResult = await query(`
        INSERT INTO chunks (document_id, content, chunk_index)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [documentId, chunk, i]);
      
      const chunkId = chunkResult.rows[0].id;
      
      // Generate and save embedding
      try {
        const embedding = await generateEmbedding(chunk);
        await query(`
          INSERT INTO embeddings (chunk_id, embedding)
          VALUES ($1, $2)
        `, [chunkId, JSON.stringify(embedding)]);
        
        logger.debug(`Generated embedding for chunk ${chunkId}`);
      } catch (embeddingError) {
        logger.error(`Failed to generate embedding for chunk ${chunkId}:`, embeddingError);
        // Continue processing other chunks even if one fails
      }
    }
    
    // Update document status
    await query(`
      UPDATE documents 
      SET processing_status = 'completed' 
      WHERE id = $1
    `, [documentId]);
    
    logger.info(`Document ${documentId} processed successfully`);
  } catch (error) {
    logger.error(`Document processing failed for ${documentId}:`, error);
    
    await query(`
      UPDATE documents 
      SET processing_status = 'failed' 
      WHERE id = $1
    `, [documentId]);
    
    throw error;
  }
}

module.exports = {
  processDocument,
  extractTextFromFile,
  chunkText
};