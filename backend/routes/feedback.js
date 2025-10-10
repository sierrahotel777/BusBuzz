const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db/mongo');

const router = express.Router();

// A function to get the 'Feedback' collection from the database
const getFeedbackCollection = () => getDb().collection('Feedback');

// Get all feedback
router.get('/', async (req, res) => {
  try {
    const feedbackCollection = getFeedbackCollection();
    const feedback = await feedbackCollection.find({}).sort({ submittedOn: -1 }).toArray();
    // Map _id to id for frontend compatibility
    const formattedFeedback = feedback.map(item => ({ ...item, id: item._id }));
    res.status(200).json(formattedFeedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'An error occurred while fetching feedback.' });
  }
});

// Submit new feedback
router.post('/', async (req, res) => {
  try {
    const feedbackCollection = getFeedbackCollection();
    const newFeedback = {
      ...req.body,
      submittedOn: new Date(),
      status: 'Pending',
    };
    const result = await feedbackCollection.insertOne(newFeedback);
    res.status(201).json({ message: 'Feedback submitted successfully!', feedback: { ...newFeedback, id: result.insertedId } });
  } catch (error)
  {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'An error occurred while submitting feedback.' });
  }
});

// Update feedback (for admin)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, resolution } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid feedback ID.' });
  }

  try {
    const feedbackCollection = getFeedbackCollection();
    const result = await feedbackCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status, resolution } });
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Feedback not found.' });
    }
    res.status(200).json({ message: 'Feedback updated successfully.' });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ message: 'An error occurred while updating feedback.' });
  }
});

module.exports = router;