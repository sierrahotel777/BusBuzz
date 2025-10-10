// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { Parser } = require('json2csv');
const { ObjectId } = require('mongodb');

const { getDb } = require('../db/mongo');

const router = express.Router();

// A function to get the 'Feedback' collection from the database
const getFeedbackCollection = () => getDb().collection('Feedback');

// A function to get the 'Users' collection from the database
const getUsersCollection = () => getDb().collection('Users');

// User Registration Route
router.post('/register', async (req, res) => {
  const { name, email, password, rollNumberOrStaffId, role, assignedBusRouteNo, boardingPoint } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const usersCollection = getUsersCollection();

    // Check if a user with the same email already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    // Hash the password for security
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the new user document
    const newUser = {
      name,
      email,
      password: hashedPassword,
      rollNumberOrStaffId,
      role: role || 'student', // Default role to 'student' if not provided
      assignedBusRouteNo,
      boardingPoint,
      createdAt: new Date(),
    };

    // Insert the new user into the database
    await usersCollection.insertOne(newUser);

    res.status(201).json({ message: 'User registered successfully!' });

  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ message: 'An error occurred during registration.' });
  }
});

// User Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const usersCollection = getUsersCollection();
    // Find the user by their email
    const user = await usersCollection.findOne({ email });

    // If no user is found, return an error
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Passwords match. Return a success message and user data.
    // In a real application, you would generate a JWT here.
    res.status(200).json({ 
      message: 'Login successful!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error during user login:', error);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const usersCollection = getUsersCollection();
    // Find all users, but don't include their passwords in the response
    const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'An error occurred while fetching users.' });
  }
});

// Export users to CSV
router.get('/users/export', async (req, res) => {
  try {
    const usersCollection = getUsersCollection();
    const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray();

    // Define the fields for the CSV
    const fields = ['_id', 'name', 'email', 'role', 'rollNumberOrStaffId', 'assignedBusRouteNo', 'boardingPoint', 'createdAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(users);

    res.header('Content-Type', 'text/csv');
    res.attachment('users.csv');
    res.status(200).send(csv);

  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ message: 'An error occurred while exporting users.' });
  }
});

// Import users from CSV
router.post('/users/import', async (req, res) => {
  const usersToImport = req.body.users;

  if (!usersToImport || !Array.isArray(usersToImport) || usersToImport.length === 0) {
    return res.status(400).json({ message: 'No users data provided.' });
  }

  try {
    const usersCollection = getUsersCollection();
    const saltRounds = 10;
    let successfulImports = 0;
    const errors = [];

    for (const user of usersToImport) {
      if (!user.email || !user.password) {
        errors.push({ email: user.email || 'N/A', reason: 'Missing email or password.' });
        continue;
      }

      const existingUser = await usersCollection.findOne({ email: user.email });
      if (existingUser) {
        errors.push({ email: user.email, reason: 'User with this email already exists.' });
        continue;
      }

      // This check is now more robust. If password is not a string, hashing will fail.
      if (typeof user.password !== 'string' || user.password.length === 0) {
        errors.push({ email: user.email, reason: 'Password is missing or invalid.' });
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      const newUser = {
        ...user,
        password: hashedPassword,
        role: user.role || 'student',
        createdAt: new Date(),
      };

      await usersCollection.insertOne(newUser);
      successfulImports++;
    }

    res.status(201).json({ message: `Import complete. Successfully imported ${successfulImports} users.`, errors });
  } catch (error) {
    console.error('Error importing users:', error);
    res.status(500).json({ message: 'An error occurred during the import process.' });
  }
});

// --- Feedback Routes ---

// Get all feedback
router.get('/feedback', async (req, res) => {
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
router.post('/feedback', async (req, res) => {
  try {
    const feedbackCollection = getFeedbackCollection();
    const newFeedback = {
      ...req.body,
      submittedOn: new Date(),
      status: 'Pending',
    };
    const result = await feedbackCollection.insertOne(newFeedback);
    res.status(201).json({ message: 'Feedback submitted successfully!', feedback: { ...newFeedback, id: result.insertedId } });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'An error occurred while submitting feedback.' });
  }
});

// Update feedback (for admin)
router.put('/feedback/:id', async (req, res) => {
  const { id } = req.params;
  const { status, resolution } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid feedback ID.' });
  }

  try {
    const feedbackCollection = getFeedbackCollection();
    const result = await feedbackCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, resolution } }
    );

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