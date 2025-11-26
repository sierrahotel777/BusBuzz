// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectToDatabase } = require('./db/mongo');
const app = express();
// Use port 5000 inside the container, as configured in Azure App Settings (WEBSITES_PORT=5000)
const port = process.env.PORT || 8080; 
const path = require('path');

// --- Configuration ---
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