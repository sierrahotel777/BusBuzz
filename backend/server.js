// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectToDatabase } = require('./db/mongo');
const app = express();
// Use port 5000 inside the container, as configured in Azure App Settings (WEBSITES_PORT=5000)
const port = process.env.PORT || 8080; 
const path = require('path');
const fs = require('fs');
const { getDb } = require('./db/mongo');

// --- Configuration ---
// Trust proxy - required for Azure App Service and rate limiting
app.set('trust proxy', 1);

// Configure CORS to allow access from local host and deployed frontend
const allowedOrigins = [
    'http://localhost:3000', 
    // Add your live SWA URL here for production testing
    'https://agreeable-beach-05cde621e.1.azurestaticapps.net' 
];

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true, 
}));

app.use(express.json());

// Fallback for legacy attachments: serve from disk if exists, else from MongoDB Attachments
app.get('/uploads/:filename', async (req, res, next) => {
  try {
    const filename = req.params.filename;
    const uploadsDir = path.join(__dirname, 'uploads');
    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }

    // Try fetching from MongoDB Attachments by originalName
    const col = getDb().collection('Attachments');
    const doc = await col.findOne({ originalName: filename });
    if (!doc || !doc.data) {
      // Not found anywhere; let static handler or error fallback handle
      return res.status(410).json({ message: 'Legacy attachment no longer available.' });
    }

    res.setHeader('Content-Type', doc.mimetype || 'application/octet-stream');
    res.setHeader('Content-Length', doc.size || (doc.data?.length || undefined));
    // Content-Disposition inline for common preview types, attachment otherwise
    const inlineTypes = ['image/', 'video/', 'application/pdf'];
    const disp = inlineTypes.some(p => (doc.mimetype || '').startsWith(p)) ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${disp}; filename="${encodeURIComponent(doc.originalName || filename)}"`);
    return res.end(doc.data.buffer || doc.data);
  } catch (err) {
    console.error('Legacy uploads fallback error:', err);
    next();
  }
});

// Serve uploaded attachments
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Routes ---
app.get('/', (req, res) => {
  res.send('BusBuzz Backend API is running!');
});

app.use('/api/auth', require('./routes/auth')); // All routes are in auth.js for now
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/attachments', require('./routes/attachments'));
app.use('/api/lostfound', require('./routes/lostfound'));
app.use('/api/buses', require('./routes/buses'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/buses', require('./routes/buses'));
// --- Server Startup ---
async function startServer() {
  try {
    await connectToDatabase();
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start the server due to a database connection error.");
    process.exit(1);
  }
}

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
startServer();