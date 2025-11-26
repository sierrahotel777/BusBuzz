const express = require('express');
const rateLimit = require('express-rate-limit');
const { getDb } = require('../db/mongo');
const { initialBusData } = require('../data/initialBusData');
const { routeData } = require('../data/routeData');

const router = express.Router();
const col = () => getDb().collection('Routes');

const readLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });

function deriveRouteName(bus) {
  return bus.route; // route field holds name like "1: Ennore"
}

// GET /api/routes - list all routes with stops and timings
router.get('/', readLimiter, async (req, res) => {
  try {
    let docs = await col().find({}).toArray();
    if (!docs || docs.length === 0) {
      // Seed minimal routes derived from initialBusData; stops to be populated later
      const routeMap = new Map();
      for (const bus of initialBusData) {
        const name = deriveRouteName(bus);
        if (!routeMap.has(name)) {
          routeMap.set(name, {
            name,
            capacity: bus.capacity,
            buses: [{ busNo: bus.busNo, driver: bus.driver, status: bus.status }],
            stops: (routeData[name] && routeData[name].stops) ? routeData[name].stops : {},
          });
        } else {
          routeMap.get(name).buses.push({ busNo: bus.busNo, driver: bus.driver, status: bus.status });
        }
      }
      const seedDocs = Array.from(routeMap.values());
      if (seedDocs.length > 0) await col().insertMany(seedDocs);
      docs = await col().find({}).toArray();
    }
    const formatted = (docs || []).map(d => ({ ...d, id: d._id }));
    res.status(200).json(formatted);
  } catch (err) {
    console.error('Error fetching routes:', err);
    res.status(200).json([]);
  }
});

module.exports = router;