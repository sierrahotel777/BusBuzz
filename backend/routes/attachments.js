const express = require('express');
const multer = require('multer');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db/mongo');

const router = express.Router();

// Use memory storage for multer - files will be stored in MongoDB
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Collection for storing file metadata and binary data
const attachmentsCol = () => getDb().collection('Attachments');

// POST /api/attachments - upload single file under field 'file'
router.post('/', upload.single('file'), async (req, res) => {
  console.log('DEBUG: File upload request received');
  console.log('DEBUG: File object:', req.file ? { name: req.file.originalname, size: req.file.size } : 'NO FILE');
  
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

  try {
    const safeOriginalName = req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    
    // Store file in MongoDB with metadata
    const doc = {
      filename: safeOriginalName,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      data: req.file.buffer, // Store binary data directly
      uploadedAt: new Date(),
    };
    
    const result = await attachmentsCol().insertOne(doc);
    const fileId = result.insertedId.toString();
    const urlPath = `/api/attachments/${fileId}`;
    
    console.log('DEBUG: Stored in MongoDB - fileId:', fileId);
    console.log('DEBUG: Returning response - url:', urlPath, 'filename:', safeOriginalName);
    
    res.status(201).json({ 
      filename: safeOriginalName, 
      url: urlPath, 
      originalName: safeOriginalName,
      fileId: fileId
    });
  } catch (err) {
    console.error('Error storing attachment in MongoDB:', err);
    res.status(500).json({ message: 'Failed to store attachment.' });
  }
});

// GET /api/attachments/:fileId - retrieve file from MongoDB
router.get('/:fileId', async (req, res) => {
  const { fileId } = req.params;
  
  // Validate ObjectId
  if (!ObjectId.isValid(fileId)) {
    return res.status(400).json({ message: 'Invalid file ID.' });
  }
  
  try {
    const file = await attachmentsCol().findOne({ _id: new ObjectId(fileId) });
    
    if (!file || !file.data) {
      return res.status(404).json({ message: 'File not found.' });
    }
    
    // Sanitize filename and quote to avoid header injection / reflected XSS
    const safeFilename = String(file.filename || 'attachment').replace(/[^a-zA-Z0-9_.\-]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(200).send(file.data.buffer);
  } catch (err) {
    console.error('Error retrieving attachment from MongoDB:', err);
    res.status(500).json({ message: 'Failed to retrieve attachment.' });
  }
});

module.exports = router;
