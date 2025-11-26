const express = require('express');
const rateLimit = require('express-rate-limit');
const { getDb } = require('../db/mongo');

const router = express.Router();
const col = () => getDb().collection('Buses');
const { initialBusData } = require('../data/initialBusData');

const readLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });

// GET /api/buses - list all buses
router.get('/', readLimiter, async (req, res) => {
  try {
    let docs = await col().find({}).toArray();
    if (!docs || docs.length === 0) {
      // Seed collection from initial data if empty
      await col().insertMany(initialBusData);
      docs = await col().find({}).toArray();
    }
    // Normalize id field
    const formatted = (docs || []).map(d => ({ ...d, id: d._id }));
    res.status(200).json(formatted);
  } catch (err) {
    console.error('Error fetching buses:', err);
    res.status(200).json([]);
  }
});

module.exports = router;