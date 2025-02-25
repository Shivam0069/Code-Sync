// Import the mongoose library
const mongoose = require("mongoose");

// Configuration for retry attempts
const MAX_RETRIES = 5; // Maximum number of retries
const RETRY_INTERVAL = 5000; // Interval between retries in milliseconds

// Async function to connect to the MongoDB database
async function connectToDb(retries = MAX_RETRIES) {
  try {
    // Attempt to connect to the MongoDB database
    await mongoose.connect(process.env.DB_CONNECT);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);

    if (retries > 0) {
      console.log(
        `Retrying MongoDB connection (${
          MAX_RETRIES - retries + 1
        }/${MAX_RETRIES}) in ${RETRY_INTERVAL / 1000} seconds...`
      );
      // Wait for the retry interval and attempt to reconnect
      setTimeout(() => connectToDb(retries - 1), RETRY_INTERVAL);
    } else {
      console.error(
        "All retry attempts to connect to MongoDB have failed. Exiting the process."
      );
      process.exit(1); // Exit the process with a failure code
    }
  }
}

// Export the connectToDb function
module.exports = connectToDb;
