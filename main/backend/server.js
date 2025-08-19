require("dotenv").config();
const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Acadmix Backend API",
    status: "running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    serverless: true
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    serverless: true
  });
});

// Ping endpoint
app.get("/api/ping", (req, res) => {
  res.json({ 
    pong: true, 
    timestamp: new Date().toISOString(),
    serverless: true
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "Endpoint not found",
    timestamp: new Date().toISOString()
  });
});

// Export for serverless
const handler = serverless(app);
module.exports = handler;

// Start server in development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
