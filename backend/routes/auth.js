// auth.js
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Parser } = require('json2csv');
const { getDb } = require('../db/mongo');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');

// ---- Helpers ----
const getUsersCollection = () => getDb().collection('Users');
const getFeedbackCollection = () => getDb().collection('Feedback');

// Deeply reject any key that starts with "$" or contains "."
function assertNoMongoOperators(obj, path = '') {
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      if (k.startsWith('$') || k.includes('.')) {
        throw new Error(`Disallowed key "${path + k}"`);
      }
      assertNoMongoOperators(obj[k], `${path + k}.`);
    }
  }
}

// Pick only allowed keys from src
function pick(src, allowed) {
  const out = {};
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(src, k)) out[k] = src[k];
  }
  return out;
}

// CSV injection mitigation: prefix dangerous leading chars
function csvSafe(v) {
  if (typeof v !== 'string') return v;
  return /^[=+\-@]/.test(v) ? `'${v}` : v;
}

// ---- Validation Schemas ----
const registerSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  rollNumberOrStaffId: Joi.string().allow('', null),
  role: Joi.string().valid('student', 'staff', 'admin').default('student'),
  assignedBusRouteNo: Joi.alternatives(Joi.string(), Joi.number()).optional(),
  boardingPoint: Joi.string().allow('', null),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const importUserSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  rollNumberOrStaffId: Joi.string().allow('', null),
  role: Joi.string().valid('student', 'staff', 'admin').default('student'),
  assignedBusRouteNo: Joi.alternatives(Joi.string(), Joi.number()).optional(),
  boardingPoint: Joi.string().allow('', null),
});

// ---- Rate limiters ----
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
const exportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
});
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
});

// ---- Routes ----

// Registration
router.post('/register', authLimiter, async (req, res) => {
  try {
    assertNoMongoOperators(req.body);
    const { value, error } = registerSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const users = getUsersCollection();
    const existing = await users.findOne({ email: value.email }); // validated email
    if (existing) return res.status(409).json({ message: 'User with this email already exists.' });

    const hashedPassword = await bcrypt.hash(value.password, 10);
    const newUser = { ...value, password: hashedPassword, createdAt: new Date() };
    await users.insertOne(newUser);

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    console.error('Error during user registration:', err);
    res.status(500).json({ message: 'An error occurred during registration.' });
  }
});

// Login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { value, error } = loginSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const users = getUsersCollection();
    const user = await users.findOne({ email: value.email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(value.password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

    if (!process.env.JWT_SECRET) {
      console.warn('JWT_SECRET is not set');
    }

    const token = jwt.sign(
      { user: { id: user._id, email: user.email, role: user.role } },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Error during user login:', err);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
});

// Get all users (no passwords). Consider protecting with auth/role middleware.
router.get('/users', async (_req, res) => {
  try {
    const users = getUsersCollection();
    const list = await users.find({}, { projection: { password: 0 } }).toArray();
    res.status(200).json(list);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'An error occurred while fetching users.' });
  }
});

// Export users to CSV (rate-limited + CSV injection mitigation)
router.get('/users/export', exportLimiter, async (_req, res) => {
  try {
    const users = getUsersCollection();
    const list = await users.find({}, { projection: { password: 0 } }).toArray();

    const safeList = list.map(u => {
      const o = { ...u };
      for (const k of Object.keys(o)) o[k] = csvSafe(o[k]);
      return o;
    });

    const fields = ['_id', 'name', 'email', 'role', 'rollNumberOrStaffId', 'assignedBusRouteNo', 'boardingPoint', 'createdAt'];
    const csv = new Parser({ fields }).parse(safeList);

    res.header('Content-Type', 'text/csv');
    res.attachment('users.csv');
    res.status(200).send(csv);
  } catch (err) {
    console.error('Error exporting users:', err);
    res.status(500).json({ message: 'An error occurred while exporting users.' });
  }
});

// Import users from CSV/JSON (whitelist + sanitize)
router.post('/users/import', writeLimiter, async (req, res) => {
  const usersToImport = req.body?.users;
  if (!Array.isArray(usersToImport) || usersToImport.length === 0) {
    return res.status(400).json({ message: 'No users data provided.' });
  }

  try {
    const users = getUsersCollection();
    const saltRounds = 10;
    let successful = 0;
    const errors = [];

    for (const raw of usersToImport) {
      try {
        assertNoMongoOperators(raw);

        const { value, error } = importUserSchema.validate(raw, { stripUnknown: true });
        if (error) throw new Error(error.message);

        const existing = await users.findOne({ email: value.email });
        if (existing) throw new Error('User with this email already exists.');

        const hashedPassword = await bcrypt.hash(value.password, saltRounds);
        const newUser = { ...value, password: hashedPassword, createdAt: new Date() };
        await users.insertOne(newUser);
        successful++;
      } catch (e) {
        errors.push({ email: raw?.email || 'N/A', reason: e.message || 'Invalid data' });
      }
    }

    res.status(201).json({ message: `Import complete. Successfully imported ${successful} users.`, errors });
  } catch (err) {
    console.error('Error importing users:', err);
    res.status(500).json({ message: 'An error occurred during the import process.' });
  }
});

// ---- Feedback (kept here because original file had these routes) ----

// Get all feedback
router.get('/feedback', async (_req, res) => {
  try {
    const col = getFeedbackCollection();
    const feedback = await col.find({}).sort({ submittedOn: -1 }).toArray();
    const formatted = feedback.map(item => ({ ...item, id: item._id }));
    res.status(200).json(formatted);
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({ message: 'An error occurred while fetching feedback.' });
  }
});

// Submit new feedback (sanitize + rate-limit)
router.post('/feedback', writeLimiter, async (req, res) => {
  try {
    assertNoMongoOperators(req.body);
    // Minimal whitelist; extend as your schema grows
    const allowed = ['subject', 'message', 'category', 'busRouteNo', 'userId', 'attachments', 'priority'];
    const newFeedback = pick(req.body, allowed);
    if (!newFeedback.message || typeof newFeedback.message !== 'string') {
      return res.status(400).json({ message: 'Feedback "message" is required.' });
    }
    const col = getFeedbackCollection();
    const doc = { ...newFeedback, submittedOn: new Date(), status: 'Pending' };
    const result = await col.insertOne(doc);
    res.status(201).json({ message: 'Feedback submitted successfully!', feedback: { ...doc, id: result.insertedId } });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ message: 'An error occurred while submitting feedback.' });
  }
});

// Get one feedback by id (fixes previous GET/PUT confusion)
router.get('/feedback/:id', async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid feedback ID.' });
  try {
    const col = getFeedbackCollection();
    const fb = await col.findOne({ _id: new ObjectId(id) });
    if (!fb) return res.status(404).json({ message: 'Feedback not found.' });
    res.json(fb);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching feedback.' });
  }
});

module.exports = router;
