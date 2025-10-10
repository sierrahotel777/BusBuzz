// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectToDatabase } = require('./db/mongo');
const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// A simple test route to check if the server is running
app.get('/', (req, res) => {
  res.send('BusBuzz Backend API is running!');
});

// API Routes
app.use('/api/auth', authRoutes);

// Start the server only after the database connection is successful
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

startServer();