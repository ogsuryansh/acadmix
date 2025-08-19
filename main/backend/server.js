const express = require("express");
const cors = require("cors");

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Acadmix Backend API",
    status: "running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

app.get("/api/ping", (req, res) => {
  res.json({ 
    pong: true, 
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for database connection
app.get("/api/test", (req, res) => {
  res.json({
    message: "API is working",
    database: "Not connected yet",
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
