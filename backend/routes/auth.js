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

// ---------- DB helpers ----------
const usersCol = () => getDb().collection('Users');
const feedbackCol = () => getDb().collection('Feedback');

// ---------- Security helpers ----------
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
function pick(src, allowed) {
  const out = {};
  for (const k of allowed) if (Object.prototype.hasOwnProperty.call(src, k)) out[k] = src[k];
  return out;
}
function csvSafe(v) {
  if (typeof v !== 'string') return v;
  return /^[=+\-@]/.test(v) ? `'${v}` : v;
}

// ---------- Validation ----------
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

// ---------- Rate limiters ----------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
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
const exportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

// ---------- Routes ----------

// Register
router.post('/register', authLimiter, async (req, res) => {
  try {
    assertNoMongoOperators(req.body);
    const { value, error } = registerSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const col = usersCol();
    const existing = await col.findOne({ email: value.email });
    if (existing) return res.status(409).json({ message: 'User with this email already exists.' });

    const hashedPassword = await bcrypt.hash(value.password, 10);
    const newUser = { ...value, password: hashedPassword, createdAt: new Date() };
    await col.insertOne(newUser);
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ message: 'An error occurred during registration.' });
  }
});

// Login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { value, error } = loginSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const col = usersCol();
    const user = await col.findOne({ email: value.email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const ok = await bcrypt.compare(value.password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials.' });

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
    console.error('Error during login:', err);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
});

// List users (no passwords) — rate limited
router.get('/users', readLimiter, async (_req, res) => {
  try {
    const list = await usersCol().find({}, { projection: { password: 0 } }).toArray();
    res.status(200).json(list);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'An error occurred while fetching users.' });
  }
});

// Export users CSV — rate limited + CSV injection safe
router.get('/users/export', exportLimiter, async (_req, res) => {
  try {
    const list = await usersCol().find({}, { projection: { password: 0 } }).toArray();
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

// Import users — validated/sanitized + rate limited
router.post('/users/import', writeLimiter, async (req, res) => {
  const usersToImport = req.body?.users;
  if (!Array.isArray(usersToImport) || usersToImport.length === 0) {
    return res.status(400).json({ message: 'No users data provided.' });
  }

  try {
    const col = usersCol();
    const saltRounds = 10;
    let successful = 0;
    const errors = [];

    for (const raw of usersToImport) {
      try {
        assertNoMongoOperators(raw);
        const { value, error } = importUserSchema.validate(raw, { stripUnknown: true });
        if (error) throw new Error(error.message);

        const existing = await col.findOne({ email: value.email });
        if (existing) throw new Error('User with this email already exists.');

        const hashedPassword = await bcrypt.hash(value.password, saltRounds);
        const newUser = { ...value, password: hashedPassword, createdAt: new Date() };
        await col.insertOne(newUser);
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

// Feedback (read) — rate limited
router.get('/feedback', readLimiter, async (_req, res) => {
  try {
    const feedback = await feedbackCol().find({}).sort({ submittedOn: -1 }).toArray();
    const formatted = feedback.map(item => ({ ...item, id: item._id }));
    res.status(200).json(formatted);
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({ message: 'An error occurred while fetching feedback.' });
  }
});

// Submit feedback — sanitized + rate limited
router.post('/feedback', writeLimiter, async (req, res) => {
  try {
    assertNoMongoOperators(req.body);
    const allowed = ['subject', 'message', 'category', 'busRouteNo', 'userId', 'attachments', 'priority'];
    const newFeedback = pick(req.body, allowed);
    if (!newFeedback.message || typeof newFeedback.message !== 'string') {
      return res.status(400).json({ message: 'Feedback "message" is required.' });
    }
    const doc = { ...newFeedback, submittedOn: new Date(), status: 'Pending' };
    const result = await feedbackCol().insertOne(doc);
    res.status(201).json({ message: 'Feedback submitted successfully!', feedback: { ...doc, id: result.insertedId } });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ message: 'An error occurred while submitting feedback.' });
  }
});

// Get one feedback by id — rate limited
router.get('/feedback/:id', readLimiter, async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid feedback ID.' });
  try {
    const fb = await feedbackCol().findOne({ _id: new ObjectId(id) });
    if (!fb) return res.status(404).json({ message: 'Feedback not found.' });
    res.json(fb);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching feedback.' });
  }
});

// PUT /api/auth/profile/:userId - update user profile (assignedBusRouteNo, boardingPoint, etc.)
router.put('/profile/:userId', writeLimiter, async (req, res) => {
  const { userId } = req.params;
  if (!ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid user ID.' });
  
  try {
    assertNoMongoOperators(req.body);
    // Only allow specific fields to be updated
    const allowed = ['assignedBusRouteNo', 'boardingPoint', 'name'];
    let updates = pick(req.body, allowed);
    // Backward compatibility: map legacy fields to new schema
    if (req.body.busRoute && !updates.assignedBusRouteNo) {
      updates.assignedBusRouteNo = req.body.busRoute;
    }
    if (req.body.favoriteStop && !updates.boardingPoint) {
      updates.boardingPoint = req.body.favoriteStop;
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update.' });
    }
    
    const result = await usersCol().findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updates },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    res.json({ message: 'Profile updated successfully.', user: result.value });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Error updating profile.' });
  }
});

module.exports = router;
