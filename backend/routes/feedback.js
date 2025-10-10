// feedbackRoutes.js
const express = require('express');
const { getDb } = require('../db/mongo');
const router = express.Router();
const authMiddleware = require('../middleware/auth'); // <-- Add this line

const { ObjectId } = require('mongodb');
const getFeedbackCollection = () => getDb().collection('Feedback');

// GET /api/auth/feedback?userId=xxx
router.get('/', authMiddleware(['admin', 'staff']), async (req, res) => {
  const { userId } = req.query;
  try {
    const feedbacks = await Feedback.find(userId ? { userId } : {});
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch feedback.' });
  }
});

// GET /api/auth/feedback/:id
router.get('/:feedbackId', authMiddleware(['admin', 'student', 'staff']), async (req, res) => {
    const { feedbackId } = req.params;
    
    // Check if the ID is a valid MongoDB format
    if (!ObjectId.isValid(feedbackId)) {
        return res.status(400).json({ message: 'Invalid Feedback ID format.' });
    }

    try {
        const feedbackCollection = getFeedbackCollection();
        const { userId, role } = req.user; 

        // Base query targets the specific document by its MongoDB _id
        const query = { _id: new ObjectId(feedbackId) };

        // ENFORCE SECURITY: If user is not an admin/staff, they must be the owner.
        if (role !== 'admin' && role !== 'staff') {
            query.userId = new ObjectId(userId);
        }

        const feedback = await feedbackCollection.findOne(query);

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback item not found or unauthorized access.' });
        }
        
        // Return the document
        res.status(200).json(feedback);
    } catch (err) {
        console.error('Error fetching feedback detail:', err);
        res.status(500).json({ message: 'Failed to fetch feedback due to a server error.' });
    }
});


// POST /api/auth/feedback
router.post('/', /*authMiddleware(['student']),*/ async (req, res) => {
  try {
    const feedback = new Feedback(req.body);
    await feedback.save();
    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit feedback.' });
  }
});

module.exports = router;