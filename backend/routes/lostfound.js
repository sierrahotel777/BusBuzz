const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db/mongo');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');

const router = express.Router();
const col = () => getDb().collection('LostAndFound');

const readLimiter = rateLimit({ windowMs: 15*60*1000, max: 200, standardHeaders: true, legacyHeaders: false });
const writeLimiter = rateLimit({ windowMs: 15*60*1000, max: 100, standardHeaders: true, legacyHeaders: false });

const createSchema = Joi.object({
  type: Joi.string().valid('lost','found').required(),
  item: Joi.string().trim().required(),
  route: Joi.string().trim().required(),
  description: Joi.string().trim().required(),
  user: Joi.string().trim().optional(),
  date: Joi.string().isoDate().optional(),
  status: Joi.string().trim().optional(),
});

// GET /api/lostfound
router.get('/', readLimiter, async (req, res) => {
  try {
    const q = {};
    if (req.query.userId) q.userId = req.query.userId;
    if (req.query.type) q.type = req.query.type;
    if (req.query.status) q.status = req.query.status;
    const docs = await col().find(q).sort({ date: -1 }).toArray();
    res.status(200).json(docs.map(d => ({ ...d, id: d._id })));
  } catch (err) {
    console.error('Error fetching lost&found items:', err);
    res.status(500).json({ message: 'Failed to fetch items.' });
  }
});

// POST /api/lostfound
router.post('/', writeLimiter, async (req, res) => {
  try {
    const { value, error } = createSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });
    const doc = { ...value, date: value.date || new Date().toISOString() };
    if (doc.type === 'found') doc.status = doc.status || 'unclaimed';
    const result = await col().insertOne(doc);
    res.status(201).json({ ...doc, id: result.insertedId });
  } catch (err) {
    console.error('Error creating lost&found item:', err);
    res.status(500).json({ message: 'Failed to create item.' });
  }
});

// PUT /api/lostfound/:id - update item (e.g., mark claimed)
router.put('/:id', writeLimiter, async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID.' });
  try {
    const update = { $set: req.body };
    const result = await col().updateOne({ _id: new ObjectId(id) }, update);
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Item not found.' });
    res.status(200).json({ message: 'Updated.' });
  } catch (err) {
    console.error('Error updating lost&found item:', err);
    res.status(500).json({ message: 'Failed to update item.' });
  }
});

// DELETE /api/lostfound/:id
router.delete('/:id', writeLimiter, async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID.' });
  try {
    const result = await col().deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Item not found.' });
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting lost&found item:', err);
    res.status(500).json({ message: 'Failed to delete item.' });
  }
});

module.exports = router;
