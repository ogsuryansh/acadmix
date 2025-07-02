require('dotenv').config();
console.log('🔑 ENV Check:', {
  GOOGLE_CLIENT_ID:     !!process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
  MONGO_URI:            !!process.env.MONGO_URI,
  SESSION_SECRET:       !!process.env.SESSION_SECRET,
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

// ─── Helmet CSP ────────────────────────────────────────────────────────────
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
app.use(cors({
  origin:      'https://acadmix.shop',
  credentials: true
}));

// ─── Body parsers ───────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ─── MongoDB Connection Utility (Serverless‑friendly) ───────────────────────
/** 
 * Uses a global cache to avoid opening new connections on every invocation.
 */
async function connectToDB() {
  if (global._mongoConn) {
    return global._mongoConn;
  }
  if (!global._mongoPromise) {
    global._mongoPromise = mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser:    true,
      useUnifiedTopology: true,
    });
  }
  global._mongoConn = await global._mongoPromise;
  return global._mongoConn;
}

// ─── Ensure DB connected on every request ──────────────────────────────────
app.use(async (req, res, next) => {
  try {
    await connectToDB();
    return next();
  } catch (err) {
    console.error('❌ DB Connection Error:', err);
    return res.status(500).json({ error: 'Database connection failed' });
  }
});

// ─── Sessions & Passport ───────────────────────────────────────────────────
app.use(session({
  secret:            process.env.SESSION_SECRET || 'fallback-secret',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:   true,
    sameSite: 'none',
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// ─── Passport Google Strategy ──────────────────────────────────────────────
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) =>
  User.findById(id)
      .then(user => done(null, user))
      .catch(err => done(err))
);

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  'https://acadmix-opal.vercel.app/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  console.log('🔔 Google profile:', profile);
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
const ADMIN_USER = 'admin';
const ADMIN_PASS = '1234';
function isAdminAuthenticated(req, res, next) {
  if (req.session?.admin) return next();
  return res.redirect('/api/admin/login');
}
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.get('/api/admin/login', (req, res) => { /* … form HTML … */ });
app.post('/api/admin/login', (req, res) => { /* unchanged */ });
app.get('/api/admin', isAdminAuthenticated, async (req, res) => {
  const users = await User.find();
  res.render('admin', { users });
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
