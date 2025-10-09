// db/mongo.js
const { MongoClient } = require('mongodb');

const connectionString = process.env.MONGO_DB_CONNECTION_STRING;
if (!connectionString) {
  throw new Error("MONGO_DB_CONNECTION_STRING is not set in the environment variables.");
}

const client = new MongoClient(connectionString);
const databaseName = "BusBuzzDB";
let db;

async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db(databaseName);
    console.log(`Successfully connected to MongoDB database: ${databaseName}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Please call connectToDatabase first.");
  }
  return db;
}

module.exports = {
  connectToDatabase,
  getDb,
};