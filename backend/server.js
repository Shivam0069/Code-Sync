const http = require("http");
const app = require("./app");
const { initializeSocket } = require("./socket");
const connectToDb = require("./db/db");
const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Wait for the database connection to be established
    await connectToDb();
    console.log("Database connected successfully");

    // Create an HTTP server using the app module
    const server = http.createServer(app);

    // Initialize the socket
    initializeSocket(server);

    // Start the server and listen on the defined port
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1); // Exit the process with a failure code
  }
}

// Start the server
startServer();
