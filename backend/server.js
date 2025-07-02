require('dotenv').config();

console.log('🔑 ENV Check:', {
  GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
  MONGO_URI: !!process.env.MONGO_URI,
  SESSION_SECRET: !!process.env.SESSION_SECRET,
});
console.log('🚀 Starting backend...');

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const path = require('path');
const serverless = require('serverless-http'); // ✅ for Vercel
const User = require('./models/User');

const app = express();

// --------------------------------------
// MIDDLEWARE
// --------------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// --------------------------------------
// DATABASE
// --------------------------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// --------------------------------------
// PASSPORT CONFIG
// --------------------------------------
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  User.findById(id).then(user => done(null, user));
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback' // ✅ update for Vercel path
}, async (accessToken, refreshToken, profile, done) => {
  let user = await User.findOne({ googleId: profile.id });
  if (!user) {
    user = await User.create({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      photo: profile.photos[0].value,
    });
  }
  return done(null, user);
}));

// --------------------------------------
// AUTH ROUTES
// --------------------------------------
app.use('/api/auth', require('./routes/auth')); // ✅ Vercel routes under /api/

// --------------------------------------
// ADMIN LOGIN SYSTEM
// --------------------------------------
const ADMIN_USER = 'admin';
const ADMIN_PASS = '1234';

function isAdminAuthenticated(req, res, next) {
  if (req.session && req.session.admin === true) {
    return next();
  } else {
    return res.redirect('/api/admin/login');
  }
}

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Admin login UI
app.get('/api/admin/login', (req, res) => {
  res.send(`
    <form method="POST" action="/api/admin/login" style="max-width: 300px; margin: 50px auto;">
      <h2>Admin Login</h2>
      <input type="text" name="username" placeholder="Username" required style="display:block;width:100%;margin-bottom:10px" />
      <input type="password" name="password" placeholder="Password" required style="display:block;width:100%;margin-bottom:10px" />
      <button type="submit" style="width:100%">Login</button>
    </form>
  `);
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.admin = true;
    res.redirect('/api/admin');
  } else {
    res.send('<p>Invalid login. <a href="/api/admin/login">Try again</a></p>');
  }
});

app.get('/api/admin', isAdminAuthenticated, async (req, res) => {
  const users = await User.find();
  res.render('admin', { users });
});

// --------------------------------------
// STATIC FILES
// --------------------------------------
app.use(express.static(path.join(__dirname, '..', 'public')));

// ✅ Required for Vercel
module.exports = app;
module.exports.handler = serverless(app);
