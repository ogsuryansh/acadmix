require("dotenv").config();
const express = require("express");
const serverless = require("serverless-http");

const app = express();

// Root endpoint - immediate response
app.get("/", (req, res) => {
  res.json({
    message: "Acadmix Backend API",
    status: "running",
    timestamp: new Date().toISOString(),
    serverless: true
  });
});

// Health check - immediate response
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    serverless: true
  });
});

// Ping endpoint - immediate response
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
module.exports = serverless(app);
