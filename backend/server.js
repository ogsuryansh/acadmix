require('dotenv').config();

console.log('🔑 ENV Check:', {
  GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
  MONGO_URI: !!process.env.MONGO_URI,
  SESSION_SECRET: !!process.env.SESSION_SECRET,
});
console.log('🚀 Starting backend server...');

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const path = require('path');
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
  callbackURL: '/auth/google/callback'
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
app.use('/auth', require('./routes/auth'));

// --------------------------------------
// ADMIN LOGIN SYSTEM
// --------------------------------------
const ADMIN_USER = 'admin';
const ADMIN_PASS = '1234';

function isAdminAuthenticated(req, res, next) {
  if (req.session && req.session.admin === true) {
    return next();
  } else {
    return res.redirect('/admin/login');
  }
}

// Show login form
app.get('/admin/login', (req, res) => {
  res.send(`
    <form method="POST" action="/admin/login" style="max-width: 300px; margin: 50px auto;">
      <h2>Admin Login</h2>
      <input type="text" name="username" placeholder="Username" required style="display:block;width:100%;margin-bottom:10px" />
      <input type="password" name="password" placeholder="Password" required style="display:block;width:100%;margin-bottom:10px" />
      <button type="submit" style="width:100%">Login</button>
    </form>
  `);
});

// Handle login POST
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.admin = true;
    res.redirect('/admin');
  } else {
    res.send('<p>Invalid login. <a href="/admin/login">Try again</a></p>');
  }
});

// Protected admin panel route
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/admin', isAdminAuthenticated, async (req, res) => {
  const users = await User.find();
  res.render('admin', { users });
});

// --------------------------------------
// STATIC FILES (Frontend)
// --------------------------------------
app.use(express.static(path.join(__dirname, '..', 'public')));

// --------------------------------------
// START SERVER
// --------------------------------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`📡 Server running at http://localhost:${PORT}`);
});
