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
    // allow requests with no Origin header or with Origin: 'null'
    if (!origin || origin === 'null') {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS policy violation: origin ${origin} not allowed`));
  },
  credentials: true
}));


// ─── Body parsers ───────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ─── MongoDB Connection Utility (Serverless‑friendly) ───────────────────────
async function connectToDB() {
  if (global._mongoConn) {
    return global._mongoConn;
  }
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
    console.error('❌ DB Connection Error:', err);
    console.error(err.stack);
    return res.status(500).json({
      error:   'Database connection failed',
      message: err.message,
      // stack:   err.stack, // uncomment to include full stack in response
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
  console.log('🔔 Google profile ID:', profile.id);
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

// ─── Auth Routes ───────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));

// ─── Admin Panel ───────────────────────────────────────────────────────────
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

function isAdminAuthenticated(req, res, next) {
  if (req.session?.admin) return next();
  return res.redirect('/api/admin/login');
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Render login form (passes error flag if present)
app.get('/api/admin/login', (req, res) => {
  res.render('login', { error: req.query.error });
});

// Process login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.admin = true;
    return res.redirect('/api/admin');
  }
  return res.redirect('/api/admin/login?error=1');
});

// Logout admin
app.post('/api/admin/logout', (req, res) => {
  req.session.admin = null;
  res.redirect('/api/admin/login');
});

// Protected admin dashboard
app.get('/api/admin', isAdminAuthenticated, async (req, res) => {
  try {
    const users = await User.find();
    res.render('admin', { users });
  } catch (err) {
    console.error('❌ Admin fetch error:', err);
    res.status(500).send('Error loading users');
  }
});

// ─── Serve Public Static ───────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── Global Error Handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('💥 Uncaught Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ─── Export for Vercel ─────────────────────────────────────────────────────
module.exports = app;
module.exports.handler = serverless(app);
