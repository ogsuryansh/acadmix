require("dotenv").config();
const isProd = process.env.NODE_ENV === "production";
const DEFAULT_FRONTEND_ORIGIN = isProd
  ? "https://acadmix.shop"
  : "http://localhost:5173";

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

// ─── EXPRESS APP ─────────────────────────────────────────────────────────────
const app = express();
app.set("trust proxy", 1);

// ─── SECURITY MIDDLEWARE ─────────────────────────────────────────────────────
app.use(helmet());

// ─── RATE LIMITING ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests from this IP" },
});
app.use("/api/", limiter);

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

// ─── BODY PARSERS ─────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ─── MONGO CONNECTION ─────────────────────────────────────────────────────────
let mongoConnection = null;

async function connectToDB() {
  if (mongoConnection) {
    return mongoConnection;
  }
  
  try {
    console.log("🔌 Connecting to MongoDB...");
    mongoConnection = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB connected successfully");
    return mongoConnection;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error;
  }
}

// ─── LAZY LOADING ────────────────────────────────────────────────────────────
let adminConfig, User, Book, Payment, MongoStore, upload, cloudStorage;

function loadModules() {
  try {
    if (!adminConfig) {
      try {
        adminConfig = require("./config/admin");
      } catch (err) {
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
    }
    
    if (!User) User = require("./models/User");
    if (!Book) Book = require("./models/Book");
    if (!Payment) Payment = require("./models/Payment");
    if (!MongoStore) MongoStore = require("connect-mongo");
    if (!upload) upload = require("./middleware/upload");
    if (!cloudStorage) cloudStorage = require("./utils/cloudStorage");
  } catch (error) {
    console.error("💥 loadModules() - Error:", error);
    throw error;
  }
}

// ─── SESSIONS & PASSPORT ──────────────────────────────────────────────────────
let sessionStore;

function setupSessionStore() {
  if (!sessionStore) {
    try {
      loadModules();
      sessionStore = MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 14 * 24 * 60 * 60,
      });
    } catch (err) {
      console.warn("⚠️ MongoDB session store failed, using memory store");
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
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        ...(isProd && { domain: ".acadmix.shop" }),
      },
    })(req, res, next);
  } catch (error) {
    console.error("💥 Session middleware - Error:", error);
    next(error);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// ─── ROUTES ────────────────────────────────────────────────────────────────
let paymentRoutesLoaded = false;
function loadPaymentRoutes() {
  if (!paymentRoutesLoaded) {
    try {
      const paymentRoutes = require("./routes/payment");
      app.use("/api", paymentRoutes);
      paymentRoutesLoaded = true;
    } catch (err) {
      console.error("❌ Error loading payment routes:", err);
    }
  }
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  loadModules();
  User.findById(id)
    .then((u) => done(null, u))
    .catch((e) => done(e));
});

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
        loadModules();
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          const existingUser = await User.findOne({
            email: profile.emails?.[0]?.value,
          });
          if (existingUser) {
            user = await User.findByIdAndUpdate(
              existingUser._id,
              {
                googleId: profile.id,
                photo: profile.photos?.[0]?.value,
              },
              { new: true }
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

    if (decoded.admin && decoded.role === "admin") {
      req.user = decoded;
      return next();
    }

    loadModules();
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

// Root endpoint - no database required
app.get("/", (req, res) => {
  res.json({
    message: "Acadmix Backend API",
    status: "running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    serverless: true
  });
});

// Health check - no database required
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    serverless: true
  });
});

// Simple ping endpoint for testing
app.get("/api/ping", (req, res) => {
  res.json({ 
    pong: true, 
    timestamp: new Date().toISOString(),
    serverless: true
  });
});

// Database connection middleware - simplified
app.use(async (req, res, next) => {
  try {
    loadModules();
    
    if (!paymentRoutesLoaded) {
      loadPaymentRoutes();
    }
    
    if (!mongoConnection) {
      await connectToDB();
    }
    
    next();
  } catch (error) {
    console.error("💥 Database middleware error:", error);
    res.status(500).json({ error: "Database connection failed", details: error.message });
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
      const frontendOrigin = process.env.FRONTEND_ORIGIN || DEFAULT_FRONTEND_ORIGIN;
      const redirectUrl = `${frontendOrigin}/auth-callback?token=${token}`;
      res.redirect(redirectUrl);
    } catch (err) {
      console.error("❌ Google OAuth callback error:", err);
      const frontendOrigin = process.env.FRONTEND_ORIGIN || DEFAULT_FRONTEND_ORIGIN;
      const errorUrl = `${frontendOrigin}/login?error=oauth_failed`;
      res.redirect(errorUrl);
    }
  }
);

app.post("/api/auth/login", async (req, res) => {
  try {
    loadModules();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email, isActive: true });

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
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    loadModules();
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    const existingUser = await User.findOne({ email });
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
    console.error("❌ Registration error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ error: "User with this email already exists" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

// Get current user profile
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    loadModules();
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

// Books API
app.get("/api/books", async (req, res) => {
  try {
    loadModules();
    const { section } = req.query;
    let query = {};

    if (section && section !== "home") {
      query.section = section;
    }

    const books = await Book.find(query).sort({ createdAt: -1 });
    
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
        console.log("Invalid token in books API:", err.message);
      }
    }

    const booksWithAccess = books.map((book) => {
      const userPayments = payments
        .filter((p) => p.book.toString() === book._id.toString())
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      const userPayment = userPayments[0];
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

// Get user's purchased books
app.get("/api/user/purchased-books", authenticateToken, async (req, res) => {
  try {
    loadModules();
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    if (isAdmin) {
      const allBooks = await Book.find({}).sort({ createdAt: -1 });
      const booksWithAccess = allBooks.map(book => ({
        ...book.toObject(),
        paymentStatus: "admin_access",
        canRead: true
      }));
      return res.json(booksWithAccess);
    }

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

    const freeBooks = await Book.find({ isFree: true }).sort({ createdAt: -1 });
    const freeBooksWithAccess = freeBooks.map(book => ({
      ...book.toObject(),
      paymentStatus: "free",
      canRead: true,
      isFree: true
    }));

    const allUserBooks = [...purchasedBooks, ...freeBooksWithAccess];
    const uniqueBooks = allUserBooks.filter((book, index, self) => 
      index === self.findIndex(b => b._id.toString() === book._id.toString())
    );

    res.json(uniqueBooks);
  } catch (err) {
    console.error("❌ Error fetching purchased books:", err);
    res.status(500).json({ error: "Failed to fetch purchased books" });
  }
});

// Admin login
app.post("/api/admin/login", async (req, res) => {
  try {
    loadModules();
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    let adminUser = null;
    let useEnvAuth = false;

    try {
      await connectToDB();
      adminUser = await User.findOne({ role: "admin", email: username });
    } catch (dbErr) {
      console.log("⚠️ MongoDB not available, using environment variables for admin auth");
      useEnvAuth = true;
    }

    let isValidAdmin = false;

    if (adminUser && adminUser.password) {
      try {
        isValidAdmin = await bcrypt.compare(password, adminUser.password);
      } catch (bcryptErr) {
        console.error("❌ bcrypt compare error:", bcryptErr);
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
    console.error("❌ Admin login error:", err);
    res.status(500).json({ error: "Admin authentication error" });
  }
});

// Admin dashboard
app.get("/api/admin/dashboard", authenticateToken, async (req, res) => {
  try {
    loadModules();
    if (req.user.role !== "admin") {
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
      payments,
    });
  } catch (err) {
    console.error("❌ Admin dashboard error:", err);
    res.status(500).json({ error: "Failed to fetch admin data" });
  }
});

// Admin books
app.get("/api/admin/books", authenticateToken, async (req, res) => {
  try {
    loadModules();
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    console.error("❌ Get admin books error:", err);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// ─── ERROR HANDLING ──────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("💥 Uncaught Error:", err);
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// ─── SERVER START ────────────────────────────────────────────────────────────
const serverlessHandler = serverless(app);

module.exports = serverlessHandler;

// Only start the server in development mode
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ MERN API server listening at http://localhost:${PORT}`);
  });
}
