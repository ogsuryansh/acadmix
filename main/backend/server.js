require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

// Import fetch for Node.js
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Import routes
const paymentRoutes = require("./routes/payment");
const adminConfig = require("./config/admin");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer (Memory Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

const app = express();

// Trust proxy - required for Vercel/serverless
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests from this IP" },
});
app.use("/api/", limiter);

// CORS configuration
const getAllowedOrigins = () => {
  const origins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [];
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5500');
  }
  console.log('🔧 [CORS CONFIG] Allowed origins:', origins);
  return origins;
};

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = getAllowedOrigins();

    console.log('🌐 [CORS] Request from origin:', origin);
    console.log('✅ [CORS] Allowed origins:', allowedOrigins);

    // Allow requests with no origin (like mobile apps, curl, or OPTIONS preflight)
    if (!origin) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [CORS] No origin - allowing in development');
        return callback(null, true);
      } else {
        // In production, also allow undefined origin for OPTIONS preflight
        console.log('✅ [CORS] No origin - allowing for OPTIONS preflight');
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) {
      console.log('✅ [CORS] Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log(`🚫 [CORS] BLOCKED origin: ${origin}`);
      console.log(`🚫 [CORS] Allowed origins are: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'X-Requested-With', 'Accept', 'Origin', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests globally with same config
app.options('*', cors(corsOptions));

// Global debugging middleware
app.use((req, res, next) => {
  // Debug logging
  console.log(`🌐 [${new Date().toISOString()}] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'unknown'}`);
  console.log(`🔍 Query params:`, req.query);
  console.log(`📝 Headers:`, {
    'authorization': req.headers.authorization ? 'present' : 'missing',
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
  });

  next();
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// MongoDB connection with lazy loading
let mongoConnection = null;
let mongoConnectionPromise = null;

async function connectToDB() {
  if (mongoConnection) {
    return mongoConnection;
  }

  if (!mongoConnectionPromise) {
    console.log('🔌 [MongoDB] Initiating connection...');
    mongoConnectionPromise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000, // Increased for serverless cold starts
        connectTimeoutMS: 30000, // Increased for serverless
        socketTimeoutMS: 45000, // Keep reasonable timeout
        maxPoolSize: 1, // Limit pool size for serverless
        minPoolSize: 0, // Start with 0 connections
        maxIdleTimeMS: 30000, // Close idle connections after 30s
        bufferCommands: false, // Disable buffering
      })
      .then((connection) => {
        console.log('✅ [MongoDB] Connected successfully');
        mongoConnection = connection;
        return connection;
      })
      .catch((error) => {
        console.error('❌ [MongoDB] Connection failed:', error.message);
        mongoConnectionPromise = null;
        throw error;
      });
  }

  try {
    mongoConnection = await mongoConnectionPromise;
    return mongoConnection;
  } catch (error) {
    mongoConnectionPromise = null;
    throw error;
  }
}

// Model initialization function to prevent overwrite errors in serverless
let models = {};

function initializeModels() {
  if (Object.keys(models).length === 0) {
    const userSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String },
      googleId: { type: String },
      photo: { type: String },
      role: { type: String, default: "user" },
      isActive: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now }
    });

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

    const paymentSchema = new mongoose.Schema({
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
      amount: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      paymentMethod: { type: String },
      transactionId: { type: String },
      submittedAt: { type: Date, default: Date.now },
      approvedAt: { type: Date },
      rejectedAt: { type: Date },
      screenshot: { type: String }
    });

    // Only create models if they don't already exist
    try {
      models.User = mongoose.model("User");
    } catch (error) {
      models.User = mongoose.model("User", userSchema);
    }

    try {
      models.Book = mongoose.model("Book");
    } catch (error) {
      models.Book = mongoose.model("Book", bookSchema);
    }

    try {
      models.Payment = mongoose.model("Payment");
    } catch (error) {
      models.Payment = mongoose.model("Payment", paymentSchema);
    }
  }

  return models;
}

// Initialize models
const { User, Book, Payment } = initializeModels();

// Session configuration
let sessionStore;
async function setupSessionStore() {
  if (!sessionStore) {
    try {
      const MongoStore = require("connect-mongo");
      sessionStore = MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 14 * 24 * 60 * 60,
      });
      console.log('✅ [SESSION] MongoStore created successfully');
    } catch (err) {
      console.error('❌ [SESSION] Failed to create MongoStore:', err.message);
      sessionStore = undefined;
    }
  }
  return sessionStore;
}

// Validate required environment variables
const validateEnv = () => {
  const required = ['SESSION_SECRET', 'MONGO_URI'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

try {
  validateEnv();
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

// Initialize session store and setup session middleware ONCE at startup
setupSessionStore().then(() => {
  console.log('🔐 [SESSION] Setting up session middleware with cookie domain:',
    process.env.NODE_ENV === "production" ? ".acadmix.shop" : "localhost");
});

// Session middleware - created ONCE, not per-request
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    domain: process.env.NODE_ENV === "production" ? ".acadmix.shop" : undefined,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    await connectToDB();
    const user = await User.findById(id).maxTimeMS(5000); // 5 second timeout
    done(null, user);
  } catch (error) {
    done(error);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === "production"
        ? "https://api.acadmix.shop/api/auth/google/callback"
        : "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        await connectToDB();

        // Add timeout to database operations
        const findOptions = { maxTimeMS: 5000 };

        let user = await User.findOne({ googleId: profile.id }).maxTimeMS(5000);

        if (!user) {
          const existingUser = await User.findOne({
            email: profile.emails?.[0]?.value,
          }).maxTimeMS(5000);

          if (existingUser) {
            user = await User.findByIdAndUpdate(
              existingUser._id,
              {
                googleId: profile.id,
                photo: profile.photos?.[0]?.value,
              },
              { new: true, maxTimeMS: 5000 }
            );
          } else {
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
          user = await User.findByIdAndUpdate(
            user._id,
            {
              name: profile.displayName,
              email: profile.emails?.[0]?.value,
              photo: profile.photos?.[0]?.value,
            },
            { new: true, maxTimeMS: 5000 }
          );
        }

        done(null, user);
      } catch (err) {
        console.error('Google OAuth error:', err);
        done(err, null);
      }
    }
  )
);

// Authentication middleware
const requireAuth = (req, res, next) => {
  console.log('🔐 [AUTH CHECK]', {
    path: req.path,
    isAuthenticated: req.isAuthenticated(),
    hasSession: !!req.session,
    sessionID: req.sessionID,
    hasUser: !!req.user,
    cookies: Object.keys(req.cookies || {})
  });

  if (req.isAuthenticated()) {
    console.log('✅ [AUTH] User authenticated:', req.user.email);
    return next();
  }

  console.log('❌ [AUTH] Authentication required - user not authenticated');
  res.status(401).json({ error: "Authentication required" });
};

const requireAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: "Admin access required" });
};

// Helper function to get current user
const getCurrentUser = (req) => {
  return req.isAuthenticated() ? req.user : null;
};

// Basic endpoints
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

    // Test a simple database operation
    const userCount = await User.countDocuments().maxTimeMS(3000);

    res.json({
      message: "API is working",
      database: "Connected successfully",
      userCount: userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      message: "API is working",
      database: "Connection failed",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Auth routes
app.get("/api/auth/google", (req, res, next) => {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || `${baseUrl}/api/auth/google/callback`;
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
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || `${baseUrl}/api/auth/google/callback`;
    return passport.authenticate("google", {
      failureRedirect: "/login",
      callbackURL,
    })(req, res, next);
  },
  async (req, res) => {
    try {
      // User is automatically logged in via passport
      const frontendOrigin = process.env.FRONTEND_ORIGIN ||
        (process.env.NODE_ENV === "production" ? "https://acadmix.shop" : "http://localhost:5173");

      res.redirect(`${frontendOrigin}/auth-callback`);
    } catch (err) {
      console.error('OAuth callback error:', err);
      const frontendOrigin = process.env.FRONTEND_ORIGIN ||
        (process.env.NODE_ENV === "production" ? "https://acadmix.shop" : "http://localhost:5173");

      res.redirect(`${frontendOrigin}/login?error=oauth_failed`);
    }
  }
);

app.post("/api/auth/login", async (req, res) => {
  try {
    await connectToDB();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email, isActive: true }).maxTimeMS(5000);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(401).json({ error: "Please login with Google" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Log user in with passport
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: "Login failed" });
      }

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
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    await connectToDB();
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email }).maxTimeMS(5000);
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
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
        return res.status(500).json({ error: "Registration failed" });
      }

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
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: "User with this email already exists" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    await connectToDB();
    const user = await User.findById(req.user._id).select("-password").maxTimeMS(5000);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    console.error('Get user profile error:', err);
    res.status(500).json({ error: "Failed to get user profile" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true, message: "Logged out successfully" });
    });
  });
});

// PDF Proxy endpoint
app.get("/api/pdf-proxy", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    console.log(`🔍 [PDF PROXY] Fetching PDF from: ${url}`);

    // Check if this is a Cloudinary URL and convert it if needed
    let fetchUrl = url;
    if (url.includes('cloudinary.com') && url.includes('/raw/upload/')) {
      // Extract the public ID and try different URL formats
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
      if (match && match[1]) {
        const publicId = match[1].replace(/\.(pdf|PDF)$/, ''); // Remove .pdf extension if present
        console.log(`📝 [PDF PROXY] Extracted public ID: ${publicId}`);

        // Try to generate a signed URL for better access
        try {
          const signedUrl = cloudinary.url(publicId, {
            resource_type: 'raw',
            type: 'upload',
            secure: true,
            sign_url: false // Try without signing first
          });
          console.log(`🔗 [PDF PROXY] Generated Cloudinary URL: ${signedUrl}`);
          fetchUrl = signedUrl;
        } catch (urlErr) {
          console.warn(`⚠️ [PDF PROXY] Could not generate Cloudinary URL, using original:`, urlErr.message);
        }
      }
    }

    // Forward headers to bypass 401/403 errors if the source requires auth or specific headers
    // Do not forward all headers as they might include backend-specific auth tokens
    // that cause issues with external services like Cloudinary
    const headers = {
      'User-Agent': req.headers['user-agent'] || 'Acadmix-Backend'
    };

    console.log(`🌐 [PDF PROXY] Attempting fetch from: ${fetchUrl}`);

    let response = await fetch(fetchUrl, { headers });

    console.log(`📊 [PDF PROXY] Response status: ${response.status} ${response.statusText}`);

    // Auto-fix for private Cloudinary resources (handle 401/403/404)
    if ((response.status === 401 || response.status === 403 || response.status === 404) && url.includes('cloudinary.com')) {
      console.log(`⚠️ [PDF PROXY] ${response.status} from Cloudinary. Attempting different approaches...`);
      try {
        // Extract public ID from raw/upload URL
        // Format: /raw/upload/v<version>/<public_id> or /raw/upload/<public_id>
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
        if (match && match[1]) {
          const publicIdWithExt = match[1];
          const publicId = publicIdWithExt.replace(/\.(pdf|PDF)$/, '');
          console.log(`📝 [PDF PROXY] Public ID (cleaned): ${publicId}`);

          // Try 1: Authenticated URL
          try {
            const signedUrl = cloudinary.url(publicId, {
              resource_type: 'raw',
              type: 'authenticated',
              sign_url: true,
              secure: true
            });

            console.log(`🔄 [PDF PROXY] Trying authenticated URL...`);
            response = await fetch(signedUrl, { headers });
            console.log(`📊 [PDF PROXY] Authenticated response: ${response.status}`);
          } catch (err) {
            console.error('❌ [PDF PROXY] Authenticated URL failed:', err.message);
          }

          // Try 2: If still failing, try upload type with .pdf extension
          if (!response.ok) {
            const urlWithPdf = cloudinary.url(publicId + '.pdf', {
              resource_type: 'raw',
              type: 'upload',
              secure: true
            });
            console.log(`🔄 [PDF PROXY] Trying with .pdf extension: ${urlWithPdf}`);
            response = await fetch(urlWithPdf, { headers });
            console.log(`📊 [PDF PROXY] With extension response: ${response.status}`);
          }

          // Try 3: Direct URL construction
          if (!response.ok) {
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
            const directUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}`;
            console.log(`🔄 [PDF PROXY] Trying direct URL: ${directUrl}`);
            response = await fetch(directUrl, { headers });
            console.log(`📊 [PDF PROXY] Direct URL response: ${response.status}`);
          }
        }
      } catch (err) {
        console.error('❌ [PDF PROXY] All retry attempts failed:', err.message);
      }
    }

    if (!response.ok) {
      console.error(`❌ [PDF PROXY] Failed to fetch PDF: ${response.status} ${response.statusText}`);
      console.error(`📍 [PDF PROXY] URL was: ${fetchUrl}`);
      return res.status(response.status).json({
        error: "Failed to fetch PDF",
        status: response.status,
        statusText: response.statusText,
        url: fetchUrl
      });
    }

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    console.log(`📦 [PDF PROXY] Content-Type: ${contentType}, Content-Length: ${contentLength}`);

    // Set PDF headers
    res.setHeader('Content-Type', contentType || 'application/pdf');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');

    // Stream the PDF
    response.body.pipe(res);

    console.log(`✅ [PDF PROXY] Successfully streaming PDF`);
  } catch (error) {
    console.error(`❌ [PDF PROXY] Error:`, error);
    res.status(500).json({
      error: "Failed to proxy PDF",
      message: error.message
    });
  }
});




// Books API
app.get("/api/books", async (req, res) => {

  try {
    console.log(`📚 [BOOKS API] Fetching books with section: ${req.query.section || 'all'}`);

    await connectToDB();
    const { section } = req.query;
    let query = {};

    if (section && section !== "home") {
      query.section = section;
    }

    console.log(`🔍 [BOOKS API] Query:`, query);
    const books = await Book.find(query).sort({ createdAt: -1 });
    console.log(`📖 [BOOKS API] Found ${books.length} books`);

    const user = getCurrentUser(req);
    let userId = null;
    let isAdmin = false;
    let payments = [];

    if (user) {
      userId = user._id;
      isAdmin = user.role === "admin";
      console.log(`👤 [BOOKS API] User authenticated - ID: ${userId}, Admin: ${isAdmin}`);

      if (userId && !isAdmin) {
        try {
          payments = await Payment.find({ user: userId }).lean();
          console.log(`💳 [BOOKS API] Found ${payments.length} payments for user`);
        } catch (paymentError) {
          console.error(`❌ [BOOKS API] Payment lookup failed:`, paymentError);
          payments = []; // Continue with empty payments array
        }
      }
    } else {
      console.log(`👤 [BOOKS API] No authenticated user`);
    }

    const booksWithAccess = books.map((book) => {
      try {
        const userPayments = payments
          .filter((p) => p.book && p.book.toString() === book._id.toString())
          .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));

        const userPayment = userPayments[0];
        const isFreeBook = book.isFree === true;

        const bookObject = book.toObject ? book.toObject() : book;

        return {
          ...bookObject,
          canRead: isAdmin || userPayment?.status === "approved" || isFreeBook,
          paymentStatus: isAdmin ? "admin_access" : isFreeBook ? "free" : userPayment?.status || null,
          pdfUrl: book.pdfUrl || null,
        };
      } catch (bookError) {
        console.error(`❌ [BOOKS API] Error processing book ${book._id}:`, bookError);
        // Return a safe fallback for this book
        return {
          _id: book._id,
          title: book.title || 'Unknown Book',
          description: book.description || '',
          category: book.category || '',
          section: book.section || '',
          price: book.price || 0,
          priceDiscounted: book.priceDiscounted || 0,
          pages: book.pages || 0,
          image: book.image || '',
          isFree: book.isFree || false,
          shareCount: book.shareCount || 0,
          canRead: isAdmin,
          paymentStatus: isAdmin ? "admin_access" : "unknown",
          pdfUrl: book.pdfUrl || null,
        };
      }
    });

    console.log(`✅ [BOOKS API] Successfully processed ${booksWithAccess.length} books`);

    // Debug: Log price information for first few books
    booksWithAccess.slice(0, 3).forEach((book, index) => {
      console.log(`💰 [BOOKS API] Book ${index + 1} price debug:`, {
        id: book._id,
        title: book.title,
        price: book.price,
        priceDiscounted: book.priceDiscounted,
        isFree: book.isFree,
        priceType: typeof book.price,
        discountedType: typeof book.priceDiscounted,
        hasDiscount: book.priceDiscounted && book.priceDiscounted !== book.price
      });
    });

    res.json(booksWithAccess);
  } catch (err) {
    console.error(`❌ [BOOKS API] Error:`, err);
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get("/api/books/:id", async (req, res) => {
  try {
    await connectToDB();
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid book ID format" });
    }

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

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
    res.status(500).json({ error: "Failed to fetch book" });
  }
});

app.post("/api/books/:id/share", async (req, res) => {
  try {
    await connectToDB();
    const { id } = req.params;

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
    res.status(500).json({ error: "Failed to update share count" });
  }
});

// User's purchased books
app.get("/api/user/purchased-books", requireAuth, async (req, res) => {
  try {
    console.log(`🔍 [PURCHASED BOOKS] Request from user:`, {
      userId: req.user._id,
      userRole: req.user.role,
      isAdmin: req.user.role === "admin"
    });

    await connectToDB();
    const userId = req.user._id;
    const isAdmin = req.user.role === "admin";

    if (isAdmin) {
      console.log(`👑 [PURCHASED BOOKS] Admin access - returning all books`);
      const allBooks = await Book.find({}).sort({ createdAt: -1 });
      const booksWithAccess = allBooks.map(book => {
        try {
          return {
            ...book.toObject(),
            paymentStatus: "admin_access",
            canRead: true
          };
        } catch (bookError) {
          console.error(`❌ [PURCHASED BOOKS] Error processing book ${book._id}:`, bookError);
          return {
            _id: book._id,
            title: book.title || 'Unknown Book',
            paymentStatus: "admin_access",
            canRead: true
          };
        }
      });
      return res.json(booksWithAccess);
    }

    console.log(`🔍 [PURCHASED BOOKS] Fetching approved payments for user: ${userId}`);
    const approvedPayments = await Payment.find({
      user: userId,
      status: "approved"
    }).populate('book');

    console.log(`📚 [PURCHASED BOOKS] Found ${approvedPayments.length} approved payments`);

    const purchasedBooks = approvedPayments
      .filter(payment => payment.book) // Filter out payments with null books
      .map(payment => {
        try {
          return {
            ...payment.book.toObject(),
            paymentStatus: "approved",
            canRead: true,
            paymentId: payment._id,
            purchasedAt: payment.approvedAt || payment.submittedAt
          };
        } catch (bookError) {
          console.error(`❌ [PURCHASED BOOKS] Error processing payment book ${payment._id}:`, bookError);
          return {
            _id: payment.book._id,
            title: payment.book.title || 'Unknown Book',
            paymentStatus: "approved",
            canRead: true,
            paymentId: payment._id,
            purchasedAt: payment.approvedAt || payment.submittedAt
          };
        }
      });

    console.log(`🔍 [PURCHASED BOOKS] Fetching free books`);
    const freeBooks = await Book.find({ isFree: true }).sort({ createdAt: -1 });
    const freeBooksWithAccess = freeBooks.map(book => {
      try {
        return {
          ...book.toObject(),
          paymentStatus: "free",
          canRead: true,
          isFree: true
        };
      } catch (bookError) {
        console.error(`❌ [PURCHASED BOOKS] Error processing free book ${book._id}:`, bookError);
        return {
          _id: book._id,
          title: book.title || 'Unknown Book',
          paymentStatus: "free",
          canRead: true,
          isFree: true
        };
      }
    });

    const allUserBooks = [...purchasedBooks, ...freeBooksWithAccess];
    const uniqueBooks = allUserBooks.filter((book, index, self) =>
      index === self.findIndex(b => b._id.toString() === book._id.toString())
    );

    console.log(`✅ [PURCHASED BOOKS] Returning ${uniqueBooks.length} books for user`);
    res.json(uniqueBooks);
  } catch (err) {
    console.error(`❌ [PURCHASED BOOKS] Error:`, err);
    res.status(500).json({
      error: "Failed to fetch purchased books",
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Payment routes
app.post("/api/payments", requireAuth, async (req, res) => {
  try {
    await connectToDB();
    const { bookId, amount, paymentMethod, transactionId, screenshot } = req.body;

    if (!bookId || !amount) {
      return res.status(400).json({ error: "Book ID and amount are required" });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const payment = await Payment.create({
      user: req.user._id,
      book: bookId,
      amount,
      paymentMethod,
      transactionId,
      screenshot
    });

    res.status(201).json(payment);
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ error: "Failed to create payment" });
  }
});

app.get("/api/payments", requireAuth, async (req, res) => {
  try {
    await connectToDB();
    const payments = await Payment.find({ user: req.user._id })
      .populate('book', 'title image')
      .sort({ submittedAt: -1 });
    res.json(payments);
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// Admin routes
app.post("/api/admin/login", async (req, res) => {
  try {
    await connectToDB();
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: "Username and password are required" });
    }

    let adminUser = null;
    let useEnvAuth = false;

    // Convert username to email format if needed
    const emailUsername = username.includes('@') ? username : `${username}@acadmix.local`;

    try {
      adminUser = await User.findOne({
        role: "admin",
        $or: [
          { email: username },
          { email: emailUsername }
        ]
      });
    } catch (dbErr) {
      console.error('Database error during admin lookup:', dbErr);
      useEnvAuth = true;
    }

    let isValidAdmin = false;

    if (adminUser && adminUser.password) {
      try {
        isValidAdmin = await bcrypt.compare(password, adminUser.password);
      } catch (bcryptErr) {
        console.error('Password comparison error:', bcryptErr);
        isValidAdmin = false;
      }
    } else if (useEnvAuth || !adminUser) {
      const envUsername = process.env.ADMIN_USER;
      const envPassword = process.env.ADMIN_PASS;

      if (envUsername && envPassword) {
        isValidAdmin = username === envUsername && password === envPassword;
        if (isValidAdmin && !adminUser) {
          // Create admin user if using env auth
          try {
            adminUser = await User.create({
              name: 'Admin',
              email: emailUsername,
              password: await bcrypt.hash(password, 12),
              role: 'admin',
              isActive: true
            });
            console.log('Admin user created successfully');
          } catch (createErr) {
            console.error('Error creating admin user:', createErr);
            // If user already exists, try to find it
            adminUser = await User.findOne({ email: emailUsername });
            if (!adminUser) {
              return res.status(500).json({ success: false, error: "Failed to create admin user" });
            }
          }
        }
      } else {
        return res.status(500).json({ success: false, error: "Admin authentication not configured" });
      }
    }

    if (isValidAdmin && adminUser) {
      // Update last login
      adminUser.lastLogin = new Date();
      await adminUser.save();

      // Log admin in with passport
      req.login(adminUser, (err) => {
        if (err) {
          console.error('Passport login error:', err);
          return res.status(500).json({ success: false, error: "Admin login failed" });
        }

        res.json({
          success: true,
          message: "Admin login successful",
          user: {
            id: adminUser._id,
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role
          }
        });
      });
    } else {
      res.status(401).json({ success: false, error: "Admin authentication failed" });
    }
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, error: "Admin authentication error", details: err.message });
  }
});

app.get("/api/admin/dashboard", requireAdmin, async (req, res) => {
  try {
    await connectToDB();
    console.log(`🔍 [ADMIN DASHBOARD] User check:`, {
      userId: req.user._id,
      userRole: req.user.role,
      userEmail: req.user.email,
      isAdmin: req.user.role === "admin"
    });

    const users = await User.find().select("-password").lean();
    const totalUsers = users.length;
    const totalBooks = await Book.countDocuments();
    const totalPayments = await Payment.countDocuments();

    const approvedPayments = await Payment.find({ status: "approved" }).lean();
    const totalRevenue = approvedPayments.reduce((sum, payment) => {
      return sum + (payment.amount || 0);
    }, 0);

    const payments = await Payment.find()
      .sort({ submittedAt: -1 })
      .limit(50)
      .populate("user", "name email")
      .populate("book", "title")
      .lean();

    res.json({
      users,
      totalUsers,
      totalBooks,
      totalPayments,
      totalRevenue,
      payments,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admin data" });
  }
});

// Admin book details endpoint for debugging
app.get("/api/admin/books/:id/details", requireAdmin, async (req, res) => {
  try {
    await connectToDB();

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    console.log(`🔍 [ADMIN BOOK DETAILS] Book debug:`, {
      id: book._id,
      title: book.title,
      price: book.price,
      priceDiscounted: book.priceDiscounted,
      isFree: book.isFree,
      priceType: typeof book.price,
      discountedType: typeof book.priceDiscounted,
      allFields: Object.keys(book.toObject())
    });

    res.json({
      book,
      debug: {
        price: book.price,
        priceDiscounted: book.priceDiscounted,
        isFree: book.isFree,
        priceType: typeof book.price,
        discountedType: typeof book.priceDiscounted
      }
    });
  } catch (err) {
    console.error("❌ [ADMIN BOOK DETAILS] Error:", err);
    res.status(500).json({ error: "Failed to fetch book details" });
  }
});

app.get("/api/admin/books", requireAdmin, async (req, res) => {
  try {
    await connectToDB();

    const books = await Book.find().sort({ createdAt: -1 });

    // Debug: Log the first book's price information
    if (books.length > 0) {
      const firstBook = books[0];
      console.log(`🔍 [ADMIN BOOKS] First book price debug:`, {
        id: firstBook._id,
        title: firstBook.title,
        price: firstBook.price,
        priceDiscounted: firstBook.priceDiscounted,
        isFree: firstBook.isFree,
        priceType: typeof firstBook.price,
        discountedType: typeof firstBook.priceDiscounted,
        hasDiscount: firstBook.priceDiscounted && firstBook.priceDiscounted !== firstBook.price
      });
    }

    // Debug: Log price information for all books
    books.forEach((book, index) => {
      console.log(`💰 [ADMIN BOOKS] Book ${index + 1}:`, {
        title: book.title,
        price: book.price,
        priceDiscounted: book.priceDiscounted,
        isFree: book.isFree
      });
    });

    res.json(books);
  } catch (err) {
    console.error("❌ [ADMIN BOOKS] Error:", err);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// EXPLICIT OPTIONS handler for /api/admin/books - for debugging
app.options("/api/admin/books", (req, res) => {
  console.log('🔍 [OPTIONS /api/admin/books] Preflight request received');
  console.log('🔍 [OPTIONS] Origin:', req.headers.origin);
  console.log('🔍 [OPTIONS] Method:', req.method);
  console.log('🔍 [OPTIONS] All headers:', req.headers);

  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With,Accept,Origin,Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');

  console.log('✅ [OPTIONS] Sending 200 OK response');
  res.status(200).end();
});

// Multer error handler middleware
const handleUploadError = (err, req, res, next) => {
  console.error('❌ [MULTER ERROR]', err.message);
  console.error('❌ [MULTER ERROR] Code:', err.code);
  console.error('❌ [MULTER ERROR] Field:', err.field);

  // Send CORS headers even on error
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'https://acadmix.shop');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Max size is 50MB.' });
  }
  return res.status(400).json({ error: err.message });
};

app.post("/api/admin/books",
  (req, res, next) => {
    console.log('🚀 [POST /api/admin/books] Request starting...');
    console.log('📦 [POST] Content-Type:', req.headers['content-type']);
    console.log('📏 [POST] Content-Length:', req.headers['content-length']);
    next();
  },
  requireAdmin,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
  ]),
  handleUploadError,
  async (req, res) => {
    try {
      console.log('📚 [ADMIN CREATE BOOK] Request received after upload middleware');
      console.log('📝 [ADMIN CREATE BOOK] Body keys:', Object.keys(req.body));
      console.log('📂 [ADMIN CREATE BOOK] Files:', req.files ? Object.keys(req.files) : 'No files');

      await connectToDB();

      // 1. Upload Cover Image
      let coverImageUrl = '';
      if (req.files && req.files.image && req.files.image[0]) {
        const coverFile = req.files.image[0];
        const b64 = Buffer.from(coverFile.buffer).toString("base64");
        const dataURI = "data:" + coverFile.mimetype + ";base64," + b64;

        console.log('⬆️ [ADMIN CREATE BOOK] Uploading cover image...');
        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
          folder: "acadmix/covers",
          resource_type: "image"
        });
        coverImageUrl = uploadResponse.secure_url;
        console.log('✅ [ADMIN CREATE BOOK] Cover image uploaded:', coverImageUrl);
      } else if (req.body.image && typeof req.body.image === 'string') {
        coverImageUrl = req.body.image;
      }

      // 2. Upload PDF File
      let pdfUrl = '';
      if (req.files && req.files.pdf && req.files.pdf[0]) {
        const pdfFile = req.files.pdf[0];
        const b64 = Buffer.from(pdfFile.buffer).toString("base64");
        const dataURI = "data:" + pdfFile.mimetype + ";base64," + b64;

        console.log('⬆️ [ADMIN CREATE BOOK] Uploading PDF file...');
        console.log('📏 [ADMIN CREATE BOOK] PDF file size:', pdfFile.size, 'bytes');
        console.log('📝 [ADMIN CREATE BOOK] PDF mimetype:', pdfFile.mimetype);

        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
          folder: "acadmix/pdfs",
          resource_type: "raw"
        });

        console.log('✅ [ADMIN CREATE BOOK] PDF uploaded successfully!');
        console.log('🔗 [ADMIN CREATE BOOK] PDF secure_url:', uploadResponse.secure_url);
        console.log('🔗 [ADMIN CREATE BOOK] PDF url:', uploadResponse.url);
        console.log('🆔 [ADMIN CREATE BOOK] PDF public_id:', uploadResponse.public_id);
        console.log('📊 [ADMIN CREATE BOOK] Full Cloudinary response:', JSON.stringify(uploadResponse, null, 2));

        pdfUrl = uploadResponse.secure_url;
      } else if (req.body.pdfUrl) {
        pdfUrl = req.body.pdfUrl;
      }

      // 3. Prepare Book Data
      const bookData = {
        title: req.body.title,
        description: req.body.description,
        price: Number(req.body.price) || 0,
        priceDiscounted: Number(req.body.priceDiscounted) || 0,
        isFree: req.body.isFree === 'true' || req.body.isFree === true,
        category: req.body.category,
        section: req.body.section,
        author: req.body.author,
        subject: req.body.subject,
        class: req.body.class,
        image: coverImageUrl,
        pdfUrl: pdfUrl
      };

      console.log('🔨 [ADMIN CREATE BOOK] Creating book with data:', bookData);

      const book = await Book.create(bookData);

      console.log('✅ [ADMIN CREATE BOOK] Book created successfully:', book._id);
      res.status(201).json(book);

    } catch (err) {
      console.error('❌ [ADMIN CREATE BOOK] Error occurred:', err);
      res.status(500).json({
        error: "Failed to create book",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

app.put("/api/admin/books/:id", requireAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]), async (req, res) => {
  try {
    await connectToDB();

    const updateData = { ...req.body };

    // Handle Image Upload
    if (req.files && req.files.image && req.files.image[0]) {
      const coverFile = req.files.image[0];
      const b64 = Buffer.from(coverFile.buffer).toString("base64");
      const dataURI = "data:" + coverFile.mimetype + ";base64," + b64;

      const uploadResponse = await cloudinary.uploader.upload(dataURI, {
        folder: "acadmix/covers",
        resource_type: "image"
      });
      updateData.image = uploadResponse.secure_url;
    }

    // Handle PDF Upload
    if (req.files && req.files.pdf && req.files.pdf[0]) {
      const pdfFile = req.files.pdf[0];
      const b64 = Buffer.from(pdfFile.buffer).toString("base64");
      const dataURI = "data:" + pdfFile.mimetype + ";base64," + b64;

      const uploadResponse = await cloudinary.uploader.upload(dataURI, {
        folder: "acadmix/pdfs",
        resource_type: "raw",
        format: "pdf"
      });
      updateData.pdfUrl = uploadResponse.secure_url;
    }

    // Handle numeric fields
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.priceDiscounted) updateData.priceDiscounted = Number(updateData.priceDiscounted);
    if (updateData.pages) updateData.pages = Number(updateData.pages);
    if (updateData.isFree !== undefined) updateData.isFree = updateData.isFree === 'true' || updateData.isFree === true;

    // Explicitly set text fields if present
    if (req.body.category) updateData.category = req.body.category;
    if (req.body.section) updateData.section = req.body.section;

    const book = await Book.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json(book);
  } catch (err) {
    console.error('❌ [ADMIN UPDATE BOOK] Error:', err);
    res.status(500).json({ error: "Failed to update book" });
  }
});

app.delete("/api/admin/books/:id", requireAdmin, async (req, res) => {
  try {
    await connectToDB();

    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete book" });
  }
});

app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    await connectToDB();

    const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.put("/api/admin/users/:id/role", requireAdmin, async (req, res) => {
  try {
    await connectToDB();

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
    res.status(500).json({ error: "Failed to update user role" });
  }
});

app.put("/api/admin/users/:id/status", requireAdmin, async (req, res) => {
  try {
    await connectToDB();

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
    res.status(500).json({ error: "Failed to update user status" });
  }
});

app.post("/api/admin/payments/:id/approve", requireAdmin, async (req, res) => {
  try {
    await connectToDB();

    await Payment.findByIdAndUpdate(req.params.id, {
      status: "approved",
      approvedAt: new Date()
    });
    res.json({ message: "Payment approved successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve payment" });
  }
});

app.post("/api/admin/payments/:id/reject", requireAdmin, async (req, res) => {
  try {
    await connectToDB();

    await Payment.findByIdAndUpdate(req.params.id, {
      status: "rejected",
      rejectedAt: new Date()
    });
    res.json({ message: "Payment rejected successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to reject payment" });
  }
});

// Admin routes middleware
app.use("/api/admin", (req, res, next) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Admin config endpoint
app.get("/api/admin/config", requireAdmin, async (req, res) => {
  try {
    console.log(`🔍 [ADMIN CONFIG] User check:`, {
      userId: req.user._id,
      userRole: req.user.role,
      userEmail: req.user.email,
      isAdmin: req.user.role === "admin"
    });
    res.json(adminConfig);
  } catch (err) {
    console.error("❌ Admin config error:", err);
    res.status(500).json({ error: "Failed to fetch admin config" });
  }
});

// Mount payment routes
app.use("/api", paymentRoutes);

// Global error handler
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS error', message: err.message });
  }
  next(err);
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

// Export for Vercel serverless functions
module.exports = app;

// Local development server setup
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
    console.log(`📡 API URL: http://localhost:${PORT}/api`);
  });
}

// Vercel serverless function handler
let serverless;
try {
  serverless = require('serverless-http');
  module.exports.handler = serverless(app, {
    request: {
      // Disable request logging to avoid issues
      logger: false
    },
    response: {
      // Disable response logging to avoid issues
      logger: false
    }
  });
} catch (error) {
  console.log('⚠️ serverless-http not available, skipping serverless export');
}
