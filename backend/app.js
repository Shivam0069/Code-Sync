const dotenv = require("dotenv");
dotenv.config(); // Initialize dotenv to read the .env file

// Import the express framework for creating a web server
const express = require("express");

// Import the cors package to enable Cross-Origin Resource Sharing
const cors = require("cors");

// Create an instance of an Express application
const app = express();

// Import the cookie-parser package to parse cookies attached to the client request object
const cookieParser = require("cookie-parser");

const userRoutes = require("./routes/user.routes");
const fileRoutes = require("./routes/file.routes");
app.use(express.json());

// Middleware to parse incoming requests with URL-encoded payloads
app.use(express.urlencoded({ extended: true }));

// Use the cookie-parser middleware
app.use(cookieParser());

// Enable CORS to allow requests from other origins
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Define a simple GET route for the root URL that responds with "Hello World"
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/users", userRoutes);
app.use("/files", fileRoutes);

module.exports = app;
