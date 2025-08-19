const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// MongoDB connection with lazy loading
let mongoConnection = null;
let mongoConnectionPromise = null;

async function connectToDB() {
  if (mongoConnection) {
    return mongoConnection;
  }
  
  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .then((connection) => {
        mongoConnection = connection;
        return connection;
      })
      .catch((error) => {
        mongoConnectionPromise = null;
        throw error;
      });
  }
  
  try {
    mongoConnection = await mongoConnectionPromise;
    return mongoConnection;
  } catch (error) {
    throw error;
  }
}

// Basic User model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, default: "user" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// Basic Book model
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  section: { type: String },
  price: { type: Number },
  priceDiscounted: { type: Number },
  pages: { type: Number },
  image: { type: String },
  pdfUrl: { type: String },
  isFree: { type: Boolean, default: false },
  shareCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Book = mongoose.model("Book", bookSchema);

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

// Database test endpoint
app.get("/api/test", async (req, res) => {
  try {
    await connectToDB();
    res.json({
      message: "API is working",
      database: "Connected successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: "API is working",
      database: "Connection failed",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Books endpoint (no database connection until needed)
app.get("/api/books", async (req, res) => {
  try {
    await connectToDB();
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch books",
      message: error.message
    });
  }
});

// Users endpoint (no database connection until needed)
app.get("/api/users", async (req, res) => {
  try {
    await connectToDB();
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch users",
      message: error.message
    });
  }
});

module.exports = app;
