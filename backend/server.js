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
const serverless = require('serverless-http');
const cors = require('cors'); // ✅ Add this
const User = require('./models/User');

const app = express();
const helmet = require('helmet');

// Enable Helmet with CSP config
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      fontSrc: ["'self'", 'https://acadmix-opal.vercel.app', 'data:'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://apis.google.com'], // if needed
      imgSrc: ["'self'", 'https:', 'data:'],
      connectSrc: ["'self'", 'https://acadmix-opal.vercel.app', 'https://acadmix.shop']
    }
  }
}));

// ✅ CORS setup (important for cookies + cross-origin auth)
app.use(cors({
  origin: 'https://acadmix.shop',
  credentials: true
}));

// --------------------------------------
// DATABASE
// --------------------------------------
let isConnected = false;

async function connectToDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
  }
}
connectToDB();

// --------------------------------------
// MIDDLEWARE
// --------------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,           // use HTTPS
    sameSite: 'none',       // allow cross-site cookies
  }
}));

app.use(passport.initialize());
app.use(passport.session());

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
  callbackURL: 'https://acadmix-opal.vercel.app/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
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
  } catch (err) {
    return done(err, null);
  }
}));

// --------------------------------------
// ROUTES
// --------------------------------------
app.use('/api/auth', require('./routes/auth'));

const ADMIN_USER = 'admin';
const ADMIN_PASS = '1234';

function isAdminAuthenticated(req, res, next) {
  if (req.session && req.session.admin === true) {
    return next();
  } else {
    return res.redirect('/api/admin/login');
  }
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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

// ✅ EXPORT FOR VERCEL
module.exports = app;
module.exports.handler = serverless(app);
