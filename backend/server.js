require('dotenv').config();
console.log('🔑 ENV Check:', {
  GOOGLE_CLIENT_ID:     !!process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
  MONGO_URI:            !!process.env.MONGO_URI,
  SESSION_SECRET:       !!process.env.SESSION_SECRET,
  ADMIN_USER:           !!process.env.ADMIN_USER,
  ADMIN_PASS:           !!process.env.ADMIN_PASS,
});
console.log('🚀 Starting backend...');

const express        = require('express');
const mongoose       = require('mongoose');
const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session        = require('express-session');
const path           = require('path');
const serverless     = require('serverless-http');
const cors           = require('cors');
const helmet         = require('helmet');
const User           = require('./models/User');
const Book = require('./models/Book');

// If you add Book.js and Payment.js later, require them here:
// const Book    = require('./models/Book');
// const Payment = require('./models/Payment');

const app = express();

// ─── Trust Vercel proxy so secure cookies work ─────────────────────────────
app.set('trust proxy', 1);

// ─── Serve fonts before CSP so 'self' truly covers them ────────────────────
app.use(
  '/api/type-font',
  express.static(path.join(__dirname, 'public', 'backend', 'api', 'type-font'))
);

// ─── Security headers via Helmet ───────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", 'https://apis.google.com'],
      styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      fontSrc:    ["'self'", 'data:', 'https://cdnjs.cloudflare.com'],
      imgSrc:     ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://acadmix.shop', 'https://acadmix-opal.vercel.app'],
    }
  }
}));

// ─── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://acadmix.shop',
  'http://127.0.0.1:5500',
  'http://localhost:3000'
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === 'null') return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy violation: origin ${origin} not allowed`));
  },
  credentials: true
}));

// ─── Body parsers ───────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ─── MongoDB Connection Utility (Serverless‑friendly) ───────────────────────
async function connectToDB() {
  if (global._mongoConn) return global._mongoConn;
  if (!global._mongoPromise) {
    global._mongoPromise = mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser:    true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
  }
  global._mongoConn = await global._mongoPromise;
  return global._mongoConn;
}

app.use(async (req, res, next) => {
  try {
    await connectToDB();
    return next();
  } catch (err) {
    console.error('❌ DB Connection Error:', err, err.stack);
    return res.status(500).json({
      error:   'Database connection failed',
      message: err.message,
    });
  }
});

// ─── Sessions & Passport ───────────────────────────────────────────────────
app.use(session({
  secret:            process.env.SESSION_SECRET || 'fallback-secret',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'none',
  }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  if (!id) return done(null, null);
  User.findById(id)
    .then(user => done(null, user))
    .catch(err => done(err, null));
});

// ─── Passport Google Strategy ──────────────────────────────────────────────
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  'https://acadmix-opal.vercel.app/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        name:     profile.displayName,
        email:    profile.emails?.[0]?.value,
        photo:    profile.photos?.[0]?.value,
      });
    }
    return done(null, user);
  } catch (err) {
    console.error('🚨 GoogleStrategy error:', err);
    return done(err, null);
  }
}));

// ─── EJS Setup & Admin Auth Middleware ────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

function isAdminAuthenticated(req, res, next) {
  if (req.session?.admin) return next();
  res.redirect('/api/admin/login');
}
app.get('/api/admin/books', isAdminAuthenticated, async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.render('admin-books', { books });
  } catch (err) {
    console.error('❌ Failed to fetch books:', err);
    res.status(500).send('Server error');
  }
});

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

// ─── Admin Login Routes ────────────────────────────────────────────────────
app.get('/api/admin/login', (req, res) => {
  res.render('login', { error: req.query.error });
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.admin = true;
    return res.redirect('/api/admin');
  }
  res.redirect('/api/admin/login?error=1');
});

// ─── Admin Logout ──────────────────────────────────────────────────────────
app.post('/api/admin/logout', (req, res) => {
  req.session.admin = null;
  res.redirect('/api/admin/login');
});

// ─── Admin Dashboard ──────────────────────────────────────────────────────
app.get('/api/admin', isAdminAuthenticated, async (req, res) => {
  try {
    const users = await User.find();
    const totalUsers    = users.length;
    const totalPayments = 0; // TODO: replace with Payment.countDocuments()
    const totalBooks    = 0; // TODO: replace with Book.countDocuments()

    const usersWithBooks = users.map(u => ({
      ...u.toObject(),
      books: u.books || []
    }));

    res.render('admin', {
      users: usersWithBooks,
      totalUsers,
      totalPayments,
      totalBooks
    });
  } catch (err) {
    console.error('❌ Admin fetch error:', err);
    res.status(500).send('Error loading admin dashboard');
  }
});

// ─── Silence favicon 500 ───────────────────────────────────────────────────
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ─── Auth Routes for Normal Users ──────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));

// ─── Serve Public Static Files ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── Global Error Handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('💥 Uncaught Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});
// ─── Show Add Book Form ─────────────────────────────────────────────────────
app.get('/api/admin/books/new', isAdminAuthenticated, (req, res) => {
  res.render('add-book');
});

// ─── Handle Add Book Submission ─────────────────────────────────────────────
app.post('/api/admin/books/new', isAdminAuthenticated, async (req, res) => {
  try {
    const {
      title,
      category,
      page,
      priceOriginal,
      priceDiscounted,
      badge,
      imageUrl,
      demo
    } = req.body;

    await Book.create({
      title,
      category,
      page,
      priceOriginal,
      priceDiscounted,
      badge,
      imageUrl,
      demo
    });

    res.redirect('/api/admin/books');
  } catch (err) {
    console.error('❌ Error adding book:', err);
    res.status(500).send('Error saving book');
  }
});

// ─── Export for Vercel ─────────────────────────────────────────────────────
module.exports = app;
module.exports.handler = serverless(app);


