require("dotenv").config();
const isProd = process.env.NODE_ENV === "production";
const DEFAULT_FRONTEND_ORIGIN = isProd
  ? "https://acadmix.shop"
  : "http://localhost:5173";

console.log("🔑 ENV Check:", {
  GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
  MONGO_URI: !!process.env.MONGO_URI,
  JWT_SECRET: !!process.env.JWT_SECRET,
  ADMIN_USER: !!process.env.ADMIN_USER,
  ADMIN_PASS: !!process.env.ADMIN_PASS,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,
});
console.log("🚀 Starting MERN API server...");
console.log("🌐 Environment info:", {
  isProd,
  nodeEnv: process.env.NODE_ENV,
  defaultFrontendOrigin: DEFAULT_FRONTEND_ORIGIN,
  actualPort: process.env.PORT || 5000
});

const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const serverless = require("serverless-http");
const cors = require("cors");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");
// Import admin config with fallback
let adminConfig;
try {
  adminConfig = require("./config/admin");
  console.log("✅ Admin config loaded successfully");
} catch (err) {
  console.warn("⚠️  Admin config not found, using defaults:", err.message);
  adminConfig = {
    dashboard: { paymentsLimit: 50 },
    upload: {
      maxImageSize: 5 * 1024 * 1024,
      maxPdfSize: 50 * 1024 * 1024,
      allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
      allowedPdfTypes: ['application/pdf'],
    },
    payment: { testAmount: 100, currency: 'INR' },
    ui: { paginationLimit: 20, refreshInterval: 30000 }
  };
}

const User = require("./models/User");
const Book = require("./models/Book");
const Payment = require("./models/Payment");
const MongoStore = require("connect-mongo");
const upload = require("./middleware/upload");
const {
  uploadImage,
  uploadPdf,
  deleteFile,
  getPublicIdFromUrl,
} = require("./utils/cloudStorage");

// ─── EXPRESS APP ─────────────────────────────────────────────────────────────
console.log("🔧 Creating Express app...");
const app = express();
console.log("✅ Express app created successfully");
app.set("trust proxy", 1);
console.log("✅ Trust proxy set");

// ─── SECURITY MIDDLEWARE ─────────────────────────────────────────────────────
console.log("🔧 Setting up security middleware...");
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'", 
          "'unsafe-inline'",
          "https://apis.google.com",
          "https://cdnjs.cloudflare.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com",
        ],
        fontSrc: [
          "'self'",
          "data:",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com",
        ],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "https://acadmix.shop",
          "https://api.acadmix.shop",
        ],
        formAction: [
          "'self'",
          "https://acadmix.shop",
          "https://api.acadmix.shop",
        ],
        workerSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
  })
);
console.log("✅ Security middleware set up");

// ─── RATE LIMITING ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests from this IP" },
});
console.log("🔧 Setting up rate limiter...");
app.use("/api/", limiter);
console.log("✅ Rate limiter set up");

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "https://acadmix.shop",
  "https://www.acadmix.shop",
  "https://api.acadmix.shop",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5500",
  "http://localhost:5000",
  "http://localhost:3001",
];

console.log("🔧 CORS Configuration:", {
  allowedOrigins,
  production: isProd,
  nodeEnv: process.env.NODE_ENV
});

// Simplified CORS configuration - more permissive for debugging
app.use(
  cors({
    origin: true, // Allow all origins for debugging
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // 24 hours
  })
);

// Handle preflight requests explicitly
app.options('*', cors());

// ─── BODY PARSERS ─────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// ─── MONGO CONNECTION ─────────────────────────────────────────────────────────
async function connectToDB() {
  if (global._mongoConn) return global._mongoConn;
  if (!global._mongoPromise) {
    global._mongoPromise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err.message);
        global._mongoPromise = null;
        throw err;
      });
  }
  global._mongoConn = await global._mongoPromise;
  return global._mongoConn;
}

// Initialize MongoDB connection on startup (non-blocking)
connectToDB()
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    console.log("⚠️  Server will start but some features may not work");
  });

// Only connect to DB on first request in serverless environment
let dbConnected = false;
app.use(async (req, res, next) => {
  if (!dbConnected) {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database connection timeout')), 10000);
      });
      
      const connectionPromise = connectToDB();
      await Promise.race([connectionPromise, timeoutPromise]);
      
      dbConnected = true;
      console.log("✅ Database connected on first request");
    } catch (err) {
      console.error("❌ DB Connection Error:", err);
      return res.status(500).json({ error: "Database connection failed", details: err.message });
    }
  }
  next();
});

// ─── SESSIONS & PASSPORT ──────────────────────────────────────────────────────
// Configure session store based on environment
let sessionStore;
try {
  sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 14 * 24 * 60 * 60, // 14 days
  });
  console.log("✅ MongoDB session store configured");
} catch (err) {
  console.warn("⚠️  MongoDB session store failed, using memory store:", err.message);
  sessionStore = undefined;
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      ...(isProd && { domain: ".acadmix.shop" }),
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ─── ROUTES ────────────────────────────────────────────────────────────────
console.log("🔧 Loading payment routes...");
try {
  const paymentRoutes = require("./routes/payment");
  console.log("✅ Payment routes loaded successfully");
  app.use("/api", paymentRoutes);
  console.log("✅ Payment routes mounted at /api");
} catch (err) {
  console.error("❌ Error loading payment routes:", err);
  throw err;
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) =>
  User.findById(id)
    .then((u) => done(null, u))
    .catch((e) => done(e))
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: isProd
        ? "https://api.acadmix.shop/api/auth/google/callback"
        : "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Check if user exists with same email but different auth method
          const existingUser = await User.findOne({
            email: profile.emails?.[0]?.value,
          });
          if (existingUser) {
            // Link Google account to existing user
            user = await User.findByIdAndUpdate(
              existingUser._id,
              {
                googleId: profile.id,
                photo: profile.photos?.[0]?.value,
              },
              { new: true }
            );
          } else {
            // Create new user
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails?.[0]?.value,
              photo: profile.photos?.[0]?.value,
              role: "user",
              isActive: true,
            });
          }
        } else {
          // Update existing user's info
          user = await User.findByIdAndUpdate(
            user._id,
            {
              name: profile.displayName,
              email: profile.emails?.[0]?.value,
              photo: profile.photos?.[0]?.value,
            },
            { new: true }
          );
        }

        done(null, user);
      } catch (err) {
        console.error("🚨 GoogleStrategy error:", err);
        done(err, null);
      }
    }
  )
);

// ─── JWT MIDDLEWARE ──────────────────────────────────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role || "user",
    },
    process.env.JWT_SECRET || "fallback-jwt-secret",
    { expiresIn: "7d" }
  );
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-jwt-secret"
    );

    // Handle admin tokens (created with environment variables)
    if (decoded.admin && decoded.role === "admin") {
      req.user = decoded;
      return next();
    }

    // Check if user still exists and is active (for regular users)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    req.user = { ...decoded, role: user.role };
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ error: "Invalid token" });
    } else if (err.name === "TokenExpiredError") {
      return res.status(403).json({ error: "Token expired" });
    }
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// ─── API ROUTES ──────────────────────────────────────────────────────────────

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Acadmix Backend API",
    status: "running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Health check
app.get("/api/health", (req, res) => {
  console.log("🏥 Health check request from:", req.headers.origin);
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    cors: {
      origin: req.headers.origin,
      allowedOrigins: allowedOrigins,
      production: isProd
    }
  });
});



// Auth routes (compute callbackURL per request to avoid prod/dev mismatch)
app.get("/api/auth/google", (req, res, next) => {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const callbackURL =
    process.env.GOOGLE_CALLBACK_URL || `${baseUrl}/api/auth/google/callback`;
  return passport.authenticate("google", {
    scope: ["profile", "email"],
    callbackURL,
  })(req, res, next);
});

app.get(
  "/api/auth/google/callback",
  (req, res, next) => {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.get("host");
    const baseUrl = `${protocol}://${host}`;
    const callbackURL =
      process.env.GOOGLE_CALLBACK_URL || `${baseUrl}/api/auth/google/callback`;
    return passport.authenticate("google", {
      failureRedirect: "/login",
      callbackURL,
    })(req, res, next);
  },
  async (req, res) => {
    try {
      const token = generateToken(req.user);
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.get("host");
      const requestOrigin = `${protocol}://${host}`;
      const configuredFrontend =
        process.env.FRONTEND_ORIGIN || DEFAULT_FRONTEND_ORIGIN;
      const frontendOrigin =
        process.env.FRONTEND_ORIGIN || "https://acadmix.shop";
      const redirectUrl = `${frontendOrigin}/auth-callback?token=${token}`;
      res.redirect(redirectUrl);
    } catch (err) {
      console.error("❌ Google OAuth callback error:", err);
      const configuredFrontend =
        process.env.FRONTEND_ORIGIN || DEFAULT_FRONTEND_ORIGIN;
      const frontendOrigin = isProd
        ? configuredFrontend
        : DEFAULT_FRONTEND_ORIGIN;
      const errorUrl = `${frontendOrigin}/login?error=oauth_failed`;
      res.redirect(errorUrl);
    }
  }
);

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email, isActive: true });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if user has password (not Google OAuth user)
    if (!user.password) {
      return res.status(401).json({ error: "Please login with Google" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Registration error:", err);
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

// Get current user profile
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    console.error("❌ Get user profile error:", err);
    res.status(500).json({ error: "Failed to get user profile" });
  }
});

// Update user profile
app.put("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: req.user.id },
      });
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }
      updates.email = email;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({ user });
  } catch (err) {
    console.error("❌ Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Change password
app.put("/api/auth/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(req.user.id);
    if (!user.password) {
      return res
        .status(400)
        .json({ error: "Cannot change password for Google OAuth users" });
    }

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isValidPassword) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("❌ Change password error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Logout (client-side token removal, but we can add server-side blacklisting if needed)
app.post("/api/auth/logout", authenticateToken, (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// Forgot password (send reset email)
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        message:
          "If an account with that email exists, a password reset link has been sent",
      });
    }

    // Generate reset token (you can implement email sending here)
    const resetToken = jwt.sign(
      { id: user._id, type: "password-reset" },
      process.env.JWT_SECRET || "fallback-jwt-secret",
      { expiresIn: "1h" }
    );

    // TODO: Send email with reset link
    // For now, just return success message
    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent",
    });
  } catch (err) {
    console.error("❌ Forgot password error:", err);
    res.status(500).json({ error: "Failed to process password reset request" });
  }
});

// Reset password
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ error: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-jwt-secret"
    );
    if (decoded.type !== "password-reset") {
      return res.status(400).json({ error: "Invalid reset token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(decoded.id, { password: hashedPassword });

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("❌ Reset password error:", err);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Get user's purchased books (approved payments only)
app.get("/api/user/purchased-books", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    if (isAdmin) {
      // Admin gets access to all books
      const allBooks = await Book.find({}).sort({ createdAt: -1 });
      const booksWithAccess = allBooks.map(book => ({
        ...book.toObject(),
        paymentStatus: "admin_access",
        canRead: true
      }));
      return res.json(booksWithAccess);
    }

    // Get approved payments for the user
    const approvedPayments = await Payment.find({ 
      user: userId, 
      status: "approved" 
    }).populate('book');

    const purchasedBooks = approvedPayments.map(payment => ({
      ...payment.book.toObject(),
      paymentStatus: "approved",
      canRead: true,
      paymentId: payment._id,
      purchasedAt: payment.approvedAt || payment.submittedAt
    }));

    // Get free books for all users
    const freeBooks = await Book.find({ isFree: true }).sort({ createdAt: -1 });
    const freeBooksWithAccess = freeBooks.map(book => ({
      ...book.toObject(),
      paymentStatus: "free",
      canRead: true,
      isFree: true
    }));

    // Combine purchased and free books, removing duplicates
    const allUserBooks = [...purchasedBooks, ...freeBooksWithAccess];
    
    // Remove duplicates based on book ID (if a user has purchased a book that's also free)
    const uniqueBooks = allUserBooks.filter((book, index, self) => 
      index === self.findIndex(b => b._id.toString() === book._id.toString())
    );

    res.json(uniqueBooks);
  } catch (err) {
    console.error("❌ Error fetching purchased books:", err);
    res.status(500).json({ error: "Failed to fetch purchased books" });
  }
});

// Books API
app.get("/api/books", async (req, res) => {
  try {
    const { section } = req.query;
    let query = {};

    if (section && section !== "home") {
      query.section = section;
    }

    const books = await Book.find(query).sort({ createdAt: -1 });
    
    // Check for authentication token
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    let userId = null;
    let isAdmin = false;
    let payments = [];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-jwt-secret");
        userId = decoded.id;
        isAdmin = decoded.role === "admin" || decoded.admin;
        
        if (userId && !isAdmin) {
          payments = await Payment.find({ user: userId }).lean();
        }
      } catch (err) {
        // Token is invalid, continue without user context
        console.log("Invalid token in books API:", err.message);
      }
    }

    const booksWithAccess = books.map((book) => {
      const userPayments = payments
        .filter((p) => p.book.toString() === book._id.toString())
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      const userPayment = userPayments[0];

      // Check if book is free
      const isFreeBook = book.isFree === true;

      return {
        ...book.toObject(),
        canRead: isAdmin || userPayment?.status === "approved" || isFreeBook,
        paymentStatus: isAdmin ? "admin_access" : isFreeBook ? "free" : userPayment?.status || null,
        pdfUrl: book.pdfUrl || null,
      };
    });

    res.json(booksWithAccess);
  } catch (err) {
    console.error("❌ Error fetching books:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/books/:section", async (req, res) => {
  try {
    const { section } = req.params;
    const books = await Book.find({ section }).sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// Public endpoint to fetch individual book by ID
app.get("/api/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the ID is a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid book ID format" });
    }
    
    const book = await Book.findById(id);
    
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    // Return book details without sensitive information
    const bookData = {
      _id: book._id,
      title: book.title,
      description: book.description,
      category: book.category,
      section: book.section,
      price: book.price,
      priceDiscounted: book.priceDiscounted,
      pages: book.pages,
      image: book.image,
      isFree: book.isFree,
      shareCount: book.shareCount,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt
    };
    
    res.json(bookData);
  } catch (err) {
    console.error("❌ Error fetching book:", err);
    res.status(500).json({ error: "Failed to fetch book" });
  }
});

// Endpoint to increment share count
app.post("/api/books/:id/share", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the ID is a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid book ID format" });
    }
    
    const book = await Book.findByIdAndUpdate(
      id,
      { $inc: { shareCount: 1 } },
      { new: true }
    );
    
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    res.json({ success: true, shareCount: book.shareCount });
  } catch (err) {
    console.error("❌ Error updating share count:", err);
    res.status(500).json({ error: "Failed to update share count" });
  }
});

// Secure PDF endpoint
app.get("/api/book/:id/secure-pdf", authenticateToken, async (req, res) => {
  try {
    const bookId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    // Get the book first to check if it's free
    const book = await Book.findById(bookId);
    if (!book || !book.pdfUrl) {
      return res.status(404).json({ error: "Book or PDF not found" });
    }

    // Admin gets automatic access to all books
    if (isAdmin) {
      return res.json({ url: book.pdfUrl });
    }

    // Check if book is free
    if (book.isFree === true) {
      return res.json({ url: book.pdfUrl });
    }

    // Regular users need approved payment for non-free books
    const payment = await Payment.findOne({
      user: userId,
      book: bookId,
      status: "approved",
    });

    if (!payment) {
      return res
        .status(403)
        .json({ error: "Access denied. Payment not found." });
    }

    res.json({ url: book.pdfUrl });
  } catch (err) {
    console.error("❌ Secure PDF Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch secure PDF" });
  }
});

// Temporary debug endpoint to mark a book as free (for testing)
app.post("/api/debug/mark-book-free", async (req, res) => {
  try {
    const { pdfUrl } = req.body;
    
    if (!pdfUrl) {
      return res.status(400).json({ error: "PDF URL is required" });
    }

    // Find the book by PDF URL
    const book = await Book.findOne({ pdfUrl: pdfUrl });
    
    if (!book) {
      return res.status(404).json({ error: "Book not found for this PDF URL" });
    }

    // Mark the book as free
    book.isFree = true;
    await book.save();

    console.log("✅ Debug: Book marked as free:", {
      id: book._id,
      title: book.title,
      pdfUrl: book.pdfUrl,
      isFree: book.isFree
    });

    res.json({ 
      success: true, 
      message: "Book marked as free successfully",
      book: {
        id: book._id,
        title: book.title,
        isFree: book.isFree
      }
    });
  } catch (err) {
    console.error("❌ Debug mark book free error:", err);
    res.status(500).json({ error: "Failed to mark book as free" });
  }
});

// PDF Proxy endpoint for Cloudinary PDFs
app.get("/api/pdf-proxy", authenticateToken, async (req, res) => {
  try {
    console.log("🔍 PDF Proxy Request:", {
      url: req.query.url,
      user: req.user,
      userRole: req.user?.role,
      isAdmin: req.user?.admin,
      timestamp: new Date().toISOString(),
    });

    const { url } = req.query;

    if (!url) {
      console.log("❌ PDF Proxy: Missing URL");
      return res.status(400).json({ error: "PDF URL is required" });
    }

    // Validate that it's a Cloudinary URL
    if (!url.includes("res.cloudinary.com")) {
      console.log("❌ PDF Proxy: Invalid URL (not Cloudinary)");
      return res.status(400).json({ error: "Invalid PDF URL" });
    }

    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    // Find the book associated with this PDF URL
    const book = await Book.findOne({ pdfUrl: url });
    
    if (!book) {
      console.log("❌ PDF Proxy: Book not found for URL:", url);
      return res.status(404).json({ error: "Book not found" });
    }

    console.log("📖 Found book:", {
      id: book._id,
      title: book.title,
      isFree: book.isFree,
      userRole: req.user?.role,
      isAdmin: isAdmin
    });

    // Check access permissions
    if (isAdmin) {
      console.log("✅ PDF Proxy: Admin access granted");
    } else if (book.isFree === true) {
      console.log("✅ PDF Proxy: Free book access granted");
    } else {
      // Regular users need approved payment for non-free books
      console.log("🔍 PDF Proxy: Checking for approved payment...");
      const payment = await Payment.findOne({
        user: userId,
        book: book._id,
        status: "approved",
      });

      if (!payment) {
        console.log("❌ PDF Proxy: Access denied - no approved payment found for user:", userId, "book:", book._id);
        return res.status(403).json({ error: "Access denied. Payment not found." });
      }
      console.log("✅ PDF Proxy: Payment-based access granted");
    }

    console.log("📥 Fetching PDF from Cloudinary:", url);

    // Fetch the PDF from Cloudinary
    const response = await fetch(url);

    console.log("📊 Cloudinary Response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      console.log("❌ PDF Proxy: Cloudinary returned error status");
      return res.status(response.status).json({ error: "Failed to fetch PDF" });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(
      "✅ PDF Proxy: Successfully fetched PDF, size:",
      buffer.length,
      "bytes"
    );

    // Set appropriate headers with security measures
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");

    res.send(buffer);
    console.log("✅ PDF Proxy: PDF sent successfully");
  } catch (err) {
    console.error("❌ PDF Proxy Error:", err);
    res.status(500).json({ error: "Failed to proxy PDF" });
  }
});

// Free PDF endpoint (no authentication required for free books)
app.get("/api/free-pdf-proxy", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "PDF URL is required" });
    }

    // Validate that it's a Cloudinary URL
    if (!url.includes("res.cloudinary.com")) {
      return res.status(400).json({ error: "Invalid PDF URL" });
    }

    console.log("🆓 Free PDF Request:", url);

    // Find the book associated with this PDF URL and verify it's free
    const book = await Book.findOne({ pdfUrl: url });
    
    if (!book) {
      console.log("❌ Free PDF: Book not found for URL:", url);
      return res.status(404).json({ error: "Book not found" });
    }

    // Only allow access to free books through this endpoint
    if (book.isFree !== true) {
      console.log("❌ Free PDF: Book is not free:", book.title);
      return res.status(403).json({ error: "This book requires authentication" });
    }

    console.log("✅ Free PDF: Access granted for free book:", book.title);

    // Fetch the PDF directly
    const response = await fetch(url);

    console.log("📊 Free PDF Response:", {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type"),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch PDF" });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(
      "✅ Free PDF: Successfully fetched PDF, size:",
      buffer.length,
      "bytes"
    );

    // Set appropriate headers with security measures
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");

    res.send(buffer);
  } catch (err) {
    console.error("❌ Free PDF Error:", err);
    res.status(500).json({ error: "Failed to fetch PDF" });
  }
});

// Test PDF endpoint (no authentication required for debugging)
app.get("/api/test-pdf", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "PDF URL is required" });
    }

    console.log("🧪 Test PDF Request:", url);

    // Fetch the PDF directly
    const response = await fetch(url);

    console.log("🧪 Test PDF Response:", {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type"),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch PDF" });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(
      "✅ Test PDF: Successfully fetched PDF, size:",
      buffer.length,
      "bytes"
    );

    // Set appropriate headers with security measures
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");

    res.send(buffer);
  } catch (err) {
    console.error("❌ Test PDF Error:", err);
    res.status(500).json({ error: "Failed to fetch PDF" });
  }
});

// Simple PDF URL test endpoint
app.get("/api/test-pdf-url", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "PDF URL is required" });
    }

    console.log("🔗 Testing PDF URL:", url);

    // Just test if the URL is accessible
    const response = await fetch(url, { method: "HEAD" });

    console.log("🔗 URL Test Response:", {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type"),
      contentLength: response.headers.get("content-length"),
    });

    if (response.ok) {
      res.json({
        success: true,
        status: response.status,
        contentType: response.headers.get("content-type"),
        contentLength: response.headers.get("content-length"),
      });
    } else {
      res.json({
        success: false,
        status: response.status,
        error: "URL not accessible",
      });
    }
  } catch (err) {
    console.error("❌ URL Test Error:", err);
    res.status(500).json({ error: "Failed to test URL" });
  }
});

// Make existing PDF public endpoint
app.post("/api/make-pdf-public", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "PDF URL is required" });
    }

    console.log("🔧 Making PDF public:", url);

    // Extract public ID from Cloudinary URL
    const urlParts = url.split("/");
    const filename = urlParts[urlParts.length - 1];
    const publicId = filename.split(".")[0];
    const fullPublicId = `acadmix/pdfs/${publicId}`;

    console.log("🔧 Extracted public ID:", fullPublicId);

    // Make the resource public using Cloudinary API
    const result = await new Promise((resolve, reject) => {
      cloudinary.api.update(
        fullPublicId,
        {
          resource_type: "raw",
          access_mode: "public",
          invalidate: true,
        },
        (error, result) => {
          if (error) {
            console.error("❌ Failed to make PDF public:", error);
            reject(error);
          } else {
            console.log("✅ PDF made public:", result);
            resolve(result);
          }
        }
      );
    });

    res.json({
      success: true,
      message: "PDF made public successfully",
      result: result,
    });
  } catch (err) {
    console.error("❌ Make PDF Public Error:", err);
    res.status(500).json({ error: "Failed to make PDF public" });
  }
});

// Admin API
app.post("/api/admin/login", async (req, res) => {
  console.log("🔐 Admin login attempt:", {
    username: req.body.username,
    hasPassword: !!req.body.password,
    timestamp: new Date().toISOString(),
  });

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      console.log("❌ Admin login: Missing credentials");
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    console.log("🔍 Checking admin credentials...");

    // Check if MongoDB is connected for admin user lookup
    let adminUser = null;
    let useEnvAuth = false;

    try {
      console.log("🔗 Attempting to connect to MongoDB...");
      await connectToDB();
      console.log("✅ MongoDB connected, searching for admin user...");
      adminUser = await User.findOne({ role: "admin", email: username });
      console.log("👤 Admin user found in DB:", !!adminUser);
    } catch (dbErr) {
      console.log(
        "⚠️  MongoDB not available, using environment variables for admin auth"
      );
      console.error("❌ DB Error:", dbErr.message);
      useEnvAuth = true;
    }

    let isValidAdmin = false;

    if (adminUser && adminUser.password) {
      console.log("🔐 Checking against database admin user...");
      // Check against database admin user
      try {
        isValidAdmin = await bcrypt.compare(password, adminUser.password);
        console.log("✅ Database auth result:", isValidAdmin);
      } catch (bcryptErr) {
        console.error("❌ bcrypt compare error:", bcryptErr);
        isValidAdmin = false;
      }
    } else if (useEnvAuth || !adminUser) {
      console.log("🔐 Checking against environment variables...");
      // Check against environment variables
      const envUsername = process.env.ADMIN_USER;
      const envPassword = process.env.ADMIN_PASS;

      console.log("🔑 Environment check:", {
        hasEnvUsername: !!envUsername,
        hasEnvPassword: !!envPassword,
        usernameMatch: username === envUsername,
      });

      if (envUsername && envPassword) {
        isValidAdmin = username === envUsername && password === envPassword;
        console.log("✅ Environment auth result:", isValidAdmin);
      } else {
        console.error(
          "❌ Environment variables ADMIN_USER and ADMIN_PASS not set"
        );
        return res
          .status(500)
          .json({ error: "Admin authentication not configured" });
      }
    }

    if (isValidAdmin) {
      console.log("🎉 Admin authentication successful!");
      const token = jwt.sign(
        {
          admin: true,
          role: "admin",
          id: adminUser?._id || "admin",
        },
        process.env.JWT_SECRET || "fallback-jwt-secret",
        { expiresIn: "7d" }
      );
      res.json({ token, message: "Admin login successful" });
    } else {
      console.log("❌ Admin authentication failed");
      res.status(401).json({ error: "Admin authentication failed" });
    }
  } catch (err) {
    console.error("❌ Admin login error:", err);
    res.status(500).json({ error: "Admin authentication error" });
  }
});

app.get("/api/admin/dashboard", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const users = await User.find().select("-password").lean();
    const totalUsers = users.length;
    const totalBooks = await Book.countDocuments();
    const totalPayments = await Payment.countDocuments();
    
    // Calculate total revenue
    const approvedPayments = await Payment.find({ status: "approved" }).lean();
    const totalRevenue = approvedPayments.reduce((sum, payment) => {
      return sum + (payment.amount || 0);
    }, 0);

    // Calculate growth percentages (comparing current month vs previous month)
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    // User growth calculation
    const currentMonthUsers = await User.countDocuments({ createdAt: { $gte: currentMonth } });
    const previousMonthUsers = await User.countDocuments({ 
      createdAt: { $gte: previousMonth, $lt: currentMonth } 
    });
    const userGrowth = previousMonthUsers > 0 
      ? Math.round(((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100)
      : currentMonthUsers > 0 ? 100 : 0;

    // Book growth calculation
    const currentMonthBooks = await Book.countDocuments({ createdAt: { $gte: currentMonth } });
    const previousMonthBooks = await Book.countDocuments({ 
      createdAt: { $gte: previousMonth, $lt: currentMonth } 
    });
    const bookGrowth = previousMonthBooks > 0 
      ? Math.round(((currentMonthBooks - previousMonthBooks) / previousMonthBooks) * 100)
      : currentMonthBooks > 0 ? 100 : 0;

    // Payment growth calculation
    const currentMonthPayments = await Payment.countDocuments({ submittedAt: { $gte: currentMonth } });
    const previousMonthPayments = await Payment.countDocuments({ 
      submittedAt: { $gte: previousMonth, $lt: currentMonth } 
    });
    const paymentGrowth = previousMonthPayments > 0 
      ? Math.round(((currentMonthPayments - previousMonthPayments) / previousMonthPayments) * 100)
      : currentMonthPayments > 0 ? 100 : 0;

    // Revenue growth calculation
    const currentMonthRevenue = approvedPayments
      .filter(payment => new Date(payment.approvedAt || payment.submittedAt) >= currentMonth)
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    const previousMonthRevenue = approvedPayments
      .filter(payment => {
        const paymentDate = new Date(payment.approvedAt || payment.submittedAt);
        return paymentDate >= previousMonth && paymentDate < currentMonth;
      })
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    const revenueGrowth = previousMonthRevenue > 0 
      ? Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)
      : currentMonthRevenue > 0 ? 100 : 0;

    const payments = await Payment.find()
      .sort({ submittedAt: -1 })
      .limit(adminConfig.dashboard.paymentsLimit)
      .populate("user", "name email")
      .populate("book", "title")
      .lean();

    res.json({
      users,
      totalUsers,
      totalBooks,
      totalPayments,
      totalRevenue,
      userGrowth,
      bookGrowth,
      paymentGrowth,
      revenueGrowth,
      payments,
    });
  } catch (err) {
    console.error("❌ Admin dashboard error:", err);
    res.status(500).json({ error: "Failed to fetch admin data" });
  }
});

app.post(
  "/api/admin/payments/:id/approve",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      await Payment.findByIdAndUpdate(req.params.id, { status: "approved" });
      res.json({ message: "Payment approved successfully" });
    } catch (err) {
      res.status(500).json({ error: "Failed to approve payment" });
    }
  }
);

app.post(
  "/api/admin/payments/:id/reject",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      await Payment.findByIdAndUpdate(req.params.id, { status: "rejected" });
      res.json({ message: "Payment rejected successfully" });
    } catch (err) {
      res.status(500).json({ error: "Failed to reject payment" });
    }
  }
);

// Book management API with file upload
app.post(
  "/api/admin/books",
  authenticateToken,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("📝 Creating book with files:", {
        body: req.body,
        files: req.files ? Object.keys(req.files) : "No files",
      });

      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const {
        title,
        description,
        category,
        section,
        price,
        priceDiscounted,
        pages,
        isFree,
      } = req.body;

      // Upload files to cloud storage
      let imageUrl = null;
      let pdfUrl = null;

      if (req.files?.image) {
        console.log("📸 Uploading image:", req.files.image[0].originalname);
        imageUrl = await uploadImage(req.files.image[0]);
        console.log("✅ Image uploaded:", imageUrl);
      }

      if (req.files?.pdf) {
        console.log("📄 Uploading PDF:", req.files.pdf[0].originalname);
        pdfUrl = await uploadPdf(req.files.pdf[0]);
        console.log("✅ PDF uploaded:", pdfUrl);
      }

      const bookData = {
        title,
        description,
        category,
        section,
        price: parseFloat(price),
        priceDiscounted: priceDiscounted ? parseFloat(priceDiscounted) : null,
        pages: pages ? parseInt(pages) : null,
        image: imageUrl,
        pdfUrl: pdfUrl,
        isFree: isFree === 'true' || isFree === true,
      };

      const book = await Book.create(bookData);
      res.status(201).json(book);
    } catch (err) {
      console.error("❌ Create book error:", err);
      res.status(500).json({ error: "Failed to create book" });
    }
  }
);

app.put(
  "/api/admin/books/:id",
  authenticateToken,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const {
        title,
        description,
        category,
        section,
        price,
        priceDiscounted,
        pages,
        isFree,
      } = req.body;

      // Get existing book
      const existingBook = await Book.findById(req.params.id);
      if (!existingBook) {
        return res.status(404).json({ error: "Book not found" });
      }

      // Upload new files to cloud storage
      let imageUrl = existingBook.image;
      let pdfUrl = existingBook.pdfUrl;

      if (req.files?.image) {
        // Delete old image if exists
        if (existingBook.image) {
          const publicId = getPublicIdFromUrl(existingBook.image);
          if (publicId) {
            await deleteFile(publicId);
          }
        }
        imageUrl = await uploadImage(req.files.image[0]);
      }

      if (req.files?.pdf) {
        // Delete old PDF if exists
        if (existingBook.pdfUrl) {
          const publicId = getPublicIdFromUrl(existingBook.pdfUrl);
          if (publicId) {
            await deleteFile(publicId);
          }
        }
        pdfUrl = await uploadPdf(req.files.pdf[0]);
      }

      const bookData = {
        title,
        description,
        category,
        section,
        price: parseFloat(price),
        priceDiscounted: priceDiscounted ? parseFloat(priceDiscounted) : null,
        pages: pages ? parseInt(pages) : null,
        image: imageUrl,
        pdfUrl: pdfUrl,
        isFree: isFree === 'true' || isFree === true,
      };

      const book = await Book.findByIdAndUpdate(req.params.id, bookData, {
        new: true,
      });
      res.json(book);
    } catch (err) {
      console.error("❌ Update book error:", err);
      res.status(500).json({ error: "Failed to update book" });
    }
  }
);

app.delete("/api/admin/books/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Delete files from cloud storage
    if (book.image) {
      const publicId = getPublicIdFromUrl(book.image);
      if (publicId) {
        await deleteFile(publicId);
      }
    }

    if (book.pdfUrl) {
      const publicId = getPublicIdFromUrl(book.pdfUrl);
      if (publicId) {
        await deleteFile(publicId);
      }
    }

    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error("❌ Delete book error:", err);
    res.status(500).json({ error: "Failed to delete book" });
  }
});

// Get all books for admin
app.get("/api/admin/books", authenticateToken, async (req, res) => {
  console.log("🔍 Admin books request:", {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    authorization: req.headers.authorization ? "Present" : "Missing",
    user: req.user
  });
  
  try {
    if (req.user.role !== "admin") {
      console.log("❌ Admin books: Access denied - user role:", req.user.role);
      return res.status(403).json({ error: "Admin access required" });
    }

    console.log("✅ Admin books: Access granted, fetching books...");
    const books = await Book.find().sort({ createdAt: -1 });
    console.log(`✅ Admin books: Found ${books.length} books`);
    res.json(books);
  } catch (err) {
    console.error("❌ Get admin books error:", err);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// User management endpoints
app.get("/api/admin/users", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ users });
  } catch (err) {
    console.error("❌ Get users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.put("/api/admin/users/:id/role", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("❌ Update user role error:", err);
    res.status(500).json({ error: "Failed to update user role" });
  }
});

app.put("/api/admin/users/:id/status", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive must be a boolean" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("❌ Update user status error:", err);
    res.status(500).json({ error: "Failed to update user status" });
  }
});

app.delete("/api/admin/users/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Don't allow admin to delete themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Delete user error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Get admin configuration
app.get("/api/admin/config", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    res.json({
      upload: adminConfig.upload,
      payment: adminConfig.payment,
      ui: adminConfig.ui,
      dashboard: adminConfig.dashboard
    });
  } catch (err) {
    console.error("❌ Admin config error:", err);
    res.status(500).json({ error: "Failed to fetch admin config" });
  }
});

// ─── STATIC FILES ────────────────────────────────────────────────────────────
// Only serve static files in development or if uploads directory exists
try {
  const uploadsPath = path.join(__dirname, "..", "uploads");
  if (fs.existsSync(uploadsPath)) {
    app.use("/uploads", express.static(uploadsPath));
    console.log("✅ Static file serving enabled for uploads");
  } else {
    console.log("⚠️  Uploads directory not found, static file serving disabled");
  }
} catch (err) {
  console.warn("⚠️  Static file serving disabled:", err.message);
}
app.get("/favicon.ico", (req, res) => res.status(204).end());

// ─── ERROR HANDLING ──────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("💥 Uncaught Error:", err);
  res
    .status(500)
    .json({ error: "Internal Server Error", message: err.message });
});

// ─── SERVER START ────────────────────────────────────────────────────────────
console.log("🔧 Server startup configuration:", {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 5000,
  isProduction: process.env.NODE_ENV === "production",
  allowedOrigins: allowedOrigins
});

// Always export the serverless function for Vercel
console.log("🚀 Exporting app for serverless deployment");
module.exports = serverless(app);

// Only start the server in development mode
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  console.log(`🚀 Starting development server on port ${PORT}...`);
  app
    .listen(PORT, () => {
      console.log(`✅ MERN API server listening at http://localhost:${PORT}`);
      console.log(
        "📝 Admin login available at: http://localhost:5000/api/admin/login"
      );
      console.log("🔗 Health check: http://localhost:5000/api/health");
    })
    .on("error", (err) => {
      console.error("❌ Server startup error:", err);
    });
}
