require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

// Import routes
const paymentRoutes = require("./routes/payment");
const adminConfig = require("./config/admin");

const app = express();

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

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400
  })
);

app.options('*', cors());

// Global debugging and CORS middleware
app.use((req, res, next) => {
  // Add CORS headers for all routes
  res.setHeader('Access-Control-Allow-Origin', 'https://acadmix.shop');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Debug logging
  console.log(`🌐 [${new Date().toISOString()}] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'unknown'}`);
  console.log(`🔍 Query params:`, req.query);
  console.log(`📝 Headers:`, {
    'authorization': req.headers.authorization ? 'present' : 'missing',
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
  });
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`✅ Preflight request handled for ${req.path}`);
    return res.status(200).end();
  }
  
  next();
});

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
        serverSelectionTimeoutMS: 3000, // Reduced from 5000
        connectTimeoutMS: 5000, // Reduced from 10000
        socketTimeoutMS: 10000, // Reduced from 45000
        maxPoolSize: 1, // Limit pool size for serverless
        minPoolSize: 0, // Start with 0 connections
        maxIdleTimeMS: 30000, // Close idle connections after 30s
        bufferCommands: false, // Disable buffering
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
function setupSessionStore() {
  if (!sessionStore) {
    try {
      const MongoStore = require("connect-mongo");
      sessionStore = MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 14 * 24 * 60 * 60,
      });
    } catch (err) {
      sessionStore = undefined;
    }
  }
}

app.use((req, res, next) => {
  try {
    setupSessionStore();
    session({
      secret: process.env.SESSION_SECRET || "fallback-secret",
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      },
    })(req, res, next);
  } catch (error) {
    next(error);
  }
});

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

// JWT middleware
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

    if (decoded.admin && decoded.role === "admin") {
      req.user = decoded;
      return next();
    }

    await connectToDB();
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
      const token = generateToken(req.user);
      
      // Determine the correct frontend URL based on environment
      let frontendOrigin;
      if (process.env.NODE_ENV === "production" || req.get("host")?.includes("vercel.app") || req.get("host")?.includes("acadmix.shop")) {
        frontendOrigin = "https://acadmix.shop";
      } else {
        frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
      }
      
      const redirectUrl = `${frontendOrigin}/auth-callback?token=${token}`;
      res.redirect(redirectUrl);
    } catch (err) {
      // Determine the correct frontend URL for error redirect
      let frontendOrigin;
      if (process.env.NODE_ENV === "production" || req.get("host")?.includes("vercel.app") || req.get("host")?.includes("acadmix.shop")) {
        frontendOrigin = "https://acadmix.shop";
      } else {
        frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
      }
      
      const errorUrl = `${frontendOrigin}/login?error=oauth_failed`;
      res.redirect(errorUrl);
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
    if (err.code === 11000) {
      return res.status(400).json({ error: "User with this email already exists" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    await connectToDB();
    const user = await User.findById(req.user.id).select("-password").maxTimeMS(5000);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Failed to get user profile" });
  }
});

// PDF Proxy endpoint
app.get("/api/pdf-proxy", async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    console.log(`🔍 [PDF PROXY] Fetching PDF from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ [PDF PROXY] Failed to fetch PDF: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        error: "Failed to fetch PDF",
        status: response.status,
        statusText: response.statusText
      });
    }

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', 'https://acadmix.shop');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
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

// Test endpoint for CORS
app.get("/api/test", (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://acadmix.shop');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.json({ message: "CORS test successful", timestamp: new Date().toISOString() });
});

// Books API OPTIONS handler
app.options("/api/books", (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://acadmix.shop');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// Books API with explicit CORS handling
app.get("/api/books", async (req, res) => {
  // Ensure CORS headers are set
  res.setHeader('Access-Control-Allow-Origin', 'https://acadmix.shop');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
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
      } catch (err) {
        console.log(`⚠️ [BOOKS API] Token verification failed:`, err.message);
        // Token is invalid, continue without user context
      }
    } else {
      console.log(`👤 [BOOKS API] No authentication token provided`);
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
app.get("/api/user/purchased-books", authenticateToken, async (req, res) => {
  try {
    console.log(`🔍 [PURCHASED BOOKS] Request from user:`, {
      userId: req.user.id,
      userRole: req.user.role,
      isAdmin: req.user.role === "admin"
    });

    await connectToDB();
    const userId = req.user.id;
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
app.post("/api/payments", authenticateToken, async (req, res) => {
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
      user: req.user.id,
      book: bookId,
      amount,
      paymentMethod,
      transactionId,
      screenshot
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: "Failed to create payment" });
  }
});

app.get("/api/payments", authenticateToken, async (req, res) => {
  try {
    await connectToDB();
    const payments = await Payment.find({ user: req.user.id })
      .populate('book', 'title image')
      .sort({ submittedAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// Admin routes
app.post("/api/admin/login", async (req, res) => {
  try {
    await connectToDB();
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    let adminUser = null;
    let useEnvAuth = false;

    try {
      adminUser = await User.findOne({ role: "admin", email: username });
    } catch (dbErr) {
      useEnvAuth = true;
    }

    let isValidAdmin = false;

    if (adminUser && adminUser.password) {
      try {
        isValidAdmin = await bcrypt.compare(password, adminUser.password);
      } catch (bcryptErr) {
        isValidAdmin = false;
      }
    } else if (useEnvAuth || !adminUser) {
      const envUsername = process.env.ADMIN_USER;
      const envPassword = process.env.ADMIN_PASS;

      if (envUsername && envPassword) {
        isValidAdmin = username === envUsername && password === envPassword;
      } else {
        return res.status(500).json({ error: "Admin authentication not configured" });
      }
    }

    if (isValidAdmin) {
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
      res.status(401).json({ error: "Admin authentication failed" });
    }
  } catch (err) {
    res.status(500).json({ error: "Admin authentication error" });
  }
});

app.get("/api/admin/dashboard", authenticateToken, async (req, res) => {
  try {
    await connectToDB();
    console.log(`🔍 [ADMIN DASHBOARD] User check:`, {
      userId: req.user.id,
      userRole: req.user.role,
      userEmail: req.user.email,
      isAdmin: req.user.role === "admin"
    });
    
    if (req.user.role !== "admin") {
      console.log(`❌ [ADMIN DASHBOARD] Access denied - User role: ${req.user.role}`);
      return res.status(403).json({ error: "Admin access required" });
    }

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
app.get("/api/admin/books/:id/details", authenticateToken, async (req, res) => {
  try {
    await connectToDB();
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

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

app.get("/api/admin/books", authenticateToken, async (req, res) => {
  try {
    await connectToDB();
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

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

app.post("/api/admin/books", authenticateToken, async (req, res) => {
  try {
    await connectToDB();
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const book = await Book.create(req.body);
    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ error: "Failed to create book" });
  }
});

app.put("/api/admin/books/:id", authenticateToken, async (req, res) => {
  try {
    await connectToDB();
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: "Failed to update book" });
  }
});

app.delete("/api/admin/books/:id", authenticateToken, async (req, res) => {
  try {
    await connectToDB();
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete book" });
  }
});

app.get("/api/admin/users", authenticateToken, async (req, res) => {
  try {
    await connectToDB();
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.put("/api/admin/users/:id/role", authenticateToken, async (req, res) => {
  try {
    await connectToDB();
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
    res.status(500).json({ error: "Failed to update user role" });
  }
});

app.put("/api/admin/users/:id/status", authenticateToken, async (req, res) => {
  try {
    await connectToDB();
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
    res.status(500).json({ error: "Failed to update user status" });
  }
});

app.post("/api/admin/payments/:id/approve", authenticateToken, async (req, res) => {
  try {
    await connectToDB();
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    await Payment.findByIdAndUpdate(req.params.id, { 
      status: "approved",
      approvedAt: new Date()
    });
    res.json({ message: "Payment approved successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve payment" });
  }
});

app.post("/api/admin/payments/:id/reject", authenticateToken, async (req, res) => {
  try {
    await connectToDB();
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    await Payment.findByIdAndUpdate(req.params.id, { 
      status: "rejected",
      rejectedAt: new Date()
    });
    res.json({ message: "Payment rejected successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to reject payment" });
  }
});

// Admin routes middleware for CORS
app.use("/api/admin", (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://acadmix.shop');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Admin config endpoint
app.get("/api/admin/config", authenticateToken, async (req, res) => {
  try {
    console.log(`🔍 [ADMIN CONFIG] User check:`, {
      userId: req.user.id,
      userRole: req.user.role,
      userEmail: req.user.email,
      isAdmin: req.user.role === "admin"
    });
    
    if (req.user.role !== "admin") {
      console.log(`❌ [ADMIN CONFIG] Access denied - User role: ${req.user.role}`);
      return res.status(403).json({ error: "Admin access required" });
    }
    res.json(adminConfig);
  } catch (err) {
    console.error("❌ Admin config error:", err);
    res.status(500).json({ error: "Failed to fetch admin config" });
  }
});

// Mount payment routes
app.use("/api", paymentRoutes);

// Global error handler for CORS
app.use((err, req, res, next) => {
  // Set CORS headers even for errors
  res.header('Access-Control-Allow-Origin', 'https://acadmix.shop');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
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

module.exports = app;
