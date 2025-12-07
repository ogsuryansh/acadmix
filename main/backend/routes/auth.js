const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const logger = require('../utils/logger');
const { validate, schemas } = require('../middleware/validation');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Middleware to ensure DB connection
let connectToDB;
const setDBConnection = (dbConnector) => {
  connectToDB = dbConnector;
};

// Google OAuth
router.get('/google', (req, res, next) => {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || `${baseUrl}/api/auth/google/callback`;

  return passport.authenticate("google", {
    scope: ["profile", "email"],
    callbackURL,
  })(req, res, next);
});

router.get(
  '/google/callback',
  (req, res, next) => {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.get("host");
    const baseUrl = `${protocol}://${host}`;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || `${baseUrl}/api/auth/google/callback`;

    return passport.authenticate("google", {
      failureRedirect: "/login",
      callbackURL,
    })(req, res, next);
  },
  asyncHandler(async (req, res) => {
    const frontendOrigin = process.env.FRONTEND_ORIGIN ||
      (process.env.NODE_ENV === "production" ? "https://acadmix.shop" : "http://localhost:5173");

    res.redirect(`${frontendOrigin}/auth-callback`);
  })
);

// Email/Password login
router.post('/login', authLimiter, validate(schemas.login), asyncHandler(async (req, res) => {
  await connectToDB();
  const { email, password } = req.body;

  const user = await User.findOne({ email, isActive: true }).maxTimeMS(5000);

  if (!user) {
    logger.warn('Login attempt with invalid credentials', { email });
    return res.status(401).json({ success: false, error: "Invalid credentials" });
  }

  if (!user.password) {
    return res.status(401).json({ success: false, error: "Please login with Google" });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    logger.warn('Login attempt with invalid password', { email });
    return res.status(401).json({ success: false, error: "Invalid credentials" });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Log user in with passport
  req.login(user, (err) => {
    if (err) {
      logger.error('Login session creation failed', { error: err.message });
      return res.status(500).json({ success: false, error: "Login failed" });
    }

    logger.info('User logged in successfully', { userId: user._id, email: user.email });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo,
      },
    });
  });
}));

// Register
router.post('/register', registerLimiter, validate(schemas.register), asyncHandler(async (req, res) => {
  await connectToDB();
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email }).maxTimeMS(5000);
  if (existingUser) {
    return res.status(400).json({ success: false, error: "User with this email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "user",
  });

  // Log user in with passport
  req.login(user, (err) => {
    if (err) {
      logger.error('Registration session creation failed', { error: err.message });
      return res.status(500).json({ success: false, error: "Registration failed" });
    }

    logger.info('User registered successfully', { userId: user._id, email: user.email });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  });
}));

// Get current user
router.get('/me', asyncHandler(async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, error: "Not authenticated" });
  }

  await connectToDB();
  const user = await User.findById(req.user._id).select("-password").maxTimeMS(5000);

  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }

  res.json({ success: true, user });
}));

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      logger.error('Logout error', { error: err.message });
      return res.status(500).json({ success: false, error: "Logout failed" });
    }

    req.session.destroy((err) => {
      if (err) {
        logger.error('Session destruction error', { error: err.message });
        return res.status(500).json({ success: false, error: "Logout failed" });
      }

      res.clearCookie('connect.sid');
      logger.info('User logged out successfully');
      res.json({ success: true, message: "Logged out successfully" });
    });
  });
});

module.exports = { router, setDBConnection };
