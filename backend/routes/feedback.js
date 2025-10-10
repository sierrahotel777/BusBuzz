// backend/routes/feedback.js

const express = require('express');
const { getDb } = require('../db/mongo');
const { ObjectId } = require('mongodb');

const router = express.Router();

// Helper to get the correct collection
const getFeedbackCollection = () => getDb().collection('Feedback');

// Get feedback for a specific user ID
// This route handles: GET /api/feedback/user/:userId
router.get('/user/:userId', /*auth,*/ async (req, res) => {
  const { userId } = req.params;
  
  // Basic validation for the MongoDB ObjectId format
  if (!ObjectId.isValid(userId)) {
      // Return 400 if the ID is malformed
      return res.status(400).json({ message: 'Invalid User ID format.' });
  }

  try {
    const feedbackCollection = getFeedbackCollection();
    
    // Query the database using the ObjectId for the userId field
    const feedbacks = await feedbackCollection.find({ userId: new ObjectId(userId) }).toArray();
    
    // If successful, return the data (even if the array is empty)
    res.json(feedbacks);
  } catch (err) {
    console.error('Error fetching user feedback:', err);
    // Use 500 for a server-side error (DB connection, query failure, etc.)
    res.status(500).json({ message: 'Failed to fetch feedback due to a server error.' });
  }
});

// ... other routes (POST /)

module.exports = router;