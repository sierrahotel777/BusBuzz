const express = require('express');
const bcrypt = require('bcryptjs');
const { Parser } = require('json2csv');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db/mongo');

const router = express.Router();

// A function to get the 'Users' collection from the database
const getUsersCollection = () => getDb().collection('Users');

// Get all users
router.get('/', async (req, res) => {
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
router.get('/export', async (req, res) => {
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
router.post('/import', async (req, res) => {
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

// Create a new user (admin action)
router.post('/', async (req, res) => {
  const { name, email, password, role, ...rest } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    const usersCollection = getUsersCollection();
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = {
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      ...rest,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    const createdUser = { ...newUser, _id: result.insertedId };
    delete createdUser.password; // Don't send password back

    res.status(201).json(createdUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'An error occurred while creating the user.' });
  }
});

// Update a user (admin action)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { password, ...updateData } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID.' });
  }

  try {
    const usersCollection = getUsersCollection();
    const result = await usersCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'An error occurred while updating the user.' });
  }
});

// Delete a user (admin action)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID.' });
  }

  const usersCollection = getUsersCollection();
  await usersCollection.deleteOne({ _id: new ObjectId(id) });
  res.status(204).send(); // 204 No Content
});

module.exports = router;