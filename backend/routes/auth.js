// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');

const { getDb } = require('../db/mongo');

const router = express.Router();

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

module.exports = router;