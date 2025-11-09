// feedback.js
const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db/mongo');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');

const router = express.Router();
const col = () => getDb().collection('Feedback');

// ---------- Rate limiters ----------
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

// ---------- Helpers ----------
function assertNoMongoOperators(obj, path = '') {
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      if (k.startsWith('$') || k.includes('.')) throw new Error(`Disallowed key "${path + k}"`);
      assertNoMongoOperators(obj[k], `${path + k}.`);
    }
  }
}
const createSchema = Joi.object({
  subject: Joi.string().trim().max(200).optional(),
  message: Joi.string().trim().min(1).max(2000).required(),
  category: Joi.string().trim().max(100).optional(),
  busRouteNo: Joi.alternatives(Joi.string(), Joi.number()).optional(),
  userId: Joi.string().trim().optional(),
  priority: Joi.string().valid('Low', 'Medium', 'High').optional(),
  attachments: Joi.array().items(Joi.object()).optional(),
});
const updateSchema = Joi.object({
  status: Joi.string().valid('Pending', 'In Progress', 'Resolved', 'Rejected').required(),
  resolution: Joi.string().allow('', null),
});

// ---------- Routes ----------
router.get('/', readLimiter, async (_req, res) => {
  try {
    const docs = await col().find({}).sort({ submittedOn: -1 }).toArray();
    const formatted = docs.map(d => ({ ...d, id: d._id }));
    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'An error occurred while fetching feedback.' });
  }
});

router.post('/', writeLimiter, async (req, res) => {
  try {
    assertNoMongoOperators(req.body);
    const { value, error } = createSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const doc = { ...value, submittedOn: new Date(), status: 'Pending' };
    const result = await col().insertOne(doc);
    res.status(201).json({ message: 'Feedback submitted successfully!', feedback: { ...doc, id: result.insertedId } });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'An error occurred while submitting feedback.' });
  }
});

router.put('/:id', writeLimiter, async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid feedback ID.' });

  try {
    assertNoMongoOperators(req.body);
    const { value, error } = updateSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const result = await col().updateOne({ _id: new ObjectId(id) }, { $set: value });
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Feedback not found.' });
    res.status(200).json({ message: 'Feedback updated successfully.' });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ message: 'An error occurred while updating feedback.' });
  }
});

module.exports = router;
