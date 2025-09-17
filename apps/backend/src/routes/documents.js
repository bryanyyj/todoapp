const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../db/connection');
const logger = require('../utils/logger');
const { processDocument, generateEmbeddings } = require('../services/documentService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF, DOCX, and TXT files
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  }
});

// Upload document
router.post('/upload', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, filename, path: filePath, mimetype, size } = req.file;
    const { module_id, assignment_id, assignment_title } = req.body;
    
    // Save document metadata to database
    const result = await query(`
      INSERT INTO documents (user_id, filename, original_name, file_path, mime_type, file_size, processing_status, module_id, assignment_id, assignment_title)
      VALUES ($1, $2, $3, $4, $5, $6, 'processing', $7, $8, $9)
      RETURNING id
    `, [req.user.id, filename, originalname, filePath, mimetype, size, module_id || null, assignment_id || null, assignment_title || null]);
    
    const documentId = result.rows[0].id;
    
    // Process document asynchronously
    processDocument(documentId, filePath, mimetype)
      .then(() => {
        logger.info(`Document processed successfully: ${documentId}`);
      })
      .catch(error => {
        logger.error(`Document processing failed: ${documentId}`, error);
        query('UPDATE documents SET processing_status = $1 WHERE id = $2', ['failed', documentId]);
      });
    
    res.json({
      id: documentId,
      message: 'File uploaded successfully',
      documentId,
      filename: originalname
    });
  } catch (error) {
    logger.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get user documents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT id, original_name, file_size, upload_date, processing_status, mime_type
      FROM documents 
      WHERE user_id = $1 
      ORDER BY upload_date DESC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get document details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    
    const result = await query(`
      SELECT d.*, COUNT(c.id) as chunk_count
      FROM documents d
      LEFT JOIN chunks c ON d.id = c.document_id
      WHERE d.id = $1 AND d.user_id = $2
      GROUP BY d.id
    `, [documentId, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching document details:', error);
    res.status(500).json({ error: 'Failed to fetch document details' });
  }
});

// Delete document
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    
    // Get document info
    const docResult = await query(`
      SELECT file_path FROM documents WHERE id = $1 AND user_id = $2
    `, [documentId, req.user.id]);
    
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Delete file from disk
    try {
      await fs.unlink(docResult.rows[0].file_path);
    } catch (fileError) {
      logger.warn(`Failed to delete file: ${docResult.rows[0].file_path}`, fileError);
    }
    
    // Delete from database (cascades to chunks and embeddings)
    await query('DELETE FROM documents WHERE id = $1', [documentId]);
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    logger.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// View/Download document
router.get('/:id/view', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get document info from database
    const result = await query(`
      SELECT file_path, original_name, mime_type 
      FROM documents 
      WHERE id = $1 AND user_id = $2
    `, [id, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const document = result.rows[0];
    const filePath = path.resolve(document.file_path);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', document.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${document.original_name}"`);
    
    // Send file
    res.sendFile(filePath);
  } catch (error) {
    logger.error('Error viewing document:', error);
    res.status(500).json({ error: 'Failed to view document' });
  }
});

module.exports = router;