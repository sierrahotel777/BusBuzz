const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
let useMemoryStorage = false;

// Try to create uploads directory; if it fails (e.g., in container with read-only filesystem), use memory storage
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('Cannot create uploads directory, using memory-based storage:', err.message);
  useMemoryStorage = true;
}

const storage = useMemoryStorage
  ? multer.memoryStorage()
  : multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      cb(null, `${unique}-${safeName}`);
    }
  });

const upload = multer({ storage });

// In-memory store for attachments (fallback when disk storage unavailable)
const attachmentStore = new Map();

// POST /api/attachments - upload single file under field 'file'
router.post('/', upload.single('file'), (req, res) => {
  console.log('DEBUG: File upload request received');
  console.log('DEBUG: File object:', req.file ? { name: req.file.originalname, size: req.file.size } : 'NO FILE');
  
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

  let filename, urlPath;
  if (useMemoryStorage) {
    // Generate unique ID and store in memory
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    filename = unique + '-' + req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    attachmentStore.set(filename, req.file.buffer);
    urlPath = `/api/attachments/${filename}`;
    console.log('DEBUG: Stored in memory - filename:', filename);
  } else {
    filename = req.file.filename;
    urlPath = `/uploads/${filename}`;
    console.log('DEBUG: Stored on disk - filename:', filename);
  }

  console.log('DEBUG: Returning response - url:', urlPath, 'filename:', filename);
  res.status(201).json({ filename, url: urlPath, originalName: req.file.originalname });
});

// GET /api/attachments/:filename - retrieve file (for memory storage)
router.get('/:filename', (req, res) => {
  const { filename } = req.params;
  const buffer = attachmentStore.get(filename);
  if (!buffer) return res.status(404).json({ message: 'File not found.' });
  // Sanitize filename and quote to avoid header injection / reflected XSS
  const safeFilename = String(filename).replace(/[^a-zA-Z0-9_.\-]/g, '_');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
  res.status(200).send(buffer);
});

module.exports = router;
