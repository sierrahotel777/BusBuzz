// feedbackRoutes.js
const express = require('express');
const router = express.Router();
const Feedback = require('../db/feedback');
const { ObjectId } = require('mongodb');
const auth = require('../middleware/auth'); // <-- Add this line

// GET /api/auth/feedback/:id
router.get('/feedback/:id', async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid feedback ID.' });
  }
  try {
    const feedback = await Feedback.findById(id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found.' });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching feedback.' });
  }
});

router.get('/feedback/my-feedback/:userId', auth(), async (req, res) => {
  const { userId } = req.params;
  try {
    // Replace with your actual feedback model/query
    const feedbacks = await Feedback.find({ userId });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch feedback.' });
  }
});

module.exports = router;