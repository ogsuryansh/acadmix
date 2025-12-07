# 🔄 Server.js Migration Guide

## Overview

This guide helps you migrate from the old monolithic `server.js` (1343 lines) to the new modular structure.

---

## ⚠️ IMPORTANT: Server.js Still Needs Manual Updates

The new route files have been created, but `server.js` still needs to be updated to use them. Here's how:

---

## 📝 Step-by-Step Migration

### Step 1: Backup Current server.js
```bash
cp server.js server.js.backup
```

### Step 2: Update server.js Imports

**Add these imports at the top** (after existing require statements):

```javascript
// Import new modular routes
const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const pdfProxyRoutes = require('./routes/pdf-proxy');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
```

### Step 3: Pass DB Connection to Routes

**After the `connectToDB` function** (around line 120), add:

```javascript
// Set DB connection for all route modules
authRoutes.setDBConnection(connectToDB);
booksRoutes.setDBConnection(connectToDB);
usersRoutes.setDBConnection(connectToDB);
adminRoutes.setDBConnection(connectToDB);
```

### Step 4: Replace Old Routes with New Modules

**Find and REPLACE these sections:**

#### Auth Routes (lines ~397-568)
**REMOVE**:
- `app.get("/api/auth/google", ...`
- `app.get("/api/auth/google/callback", ...`
- `app.post("/api/auth/login", ...`
- `app.post("/api/auth/register", ...`
- `app.get("/api/auth/me", ...`
- `app.post("/api/auth/logout", ...`

**REPLACE WITH**:
```javascript
// Auth routes
app.use('/api/auth', authRoutes.router);
```

#### PDF Proxy (lines ~570-613)
**REMOVE**:
- `app.get("/api/pdf-proxy", ...`

**REPLACE WITH**:
```javascript
// PDF proxy
app.use('/api/pdf-proxy', pdfProxyRoutes);
```

#### Books Routes (lines ~621-787)
**REMOVE**:
- `app.get("/api/books", ...`
- `app.get("/api/books/:id", ...`
- `app.post("/api/books/:id/share", ...`

**REPLACE WITH**:
```javascript
// Books routes
app.use('/api/books', booksRoutes.router);
```

#### User Routes (lines ~790-893)
**REMOVE**:
- `app.get("/api/user/purchased-books", ...`

**REPLACE WITH**:
```javascript
// User routes
app.use('/api/user', usersRoutes.router);
```

#### Admin Routes (lines ~941-1270)
**REMOVE**:
- `app.post("/api/admin/login", ...`
- `app.get("/api/admin/dashboard", ...`
- `app.get("/api/admin/books/:id/details", ...`
- All other admin endpoints

**REPLACE WITH**:
```javascript
// Admin routes
app.use('/api/admin', adminRoutes.router);
```

### Step 5: Add Error Handling Middleware

**At the very end of server.js** (after all routes, before server listen):

```javascript
// 404 handler - must be AFTER all routes
app.use(notFound);

// Error handler - must be LAST middleware
app.use(errorHandler);
```

### Step 6: Update Payment Routes (Already Fixed)

The payment routes file has already been updated with:
- Config model usage
- Logger integration
- Fixed `rejectedAt` timestamp
- Standardized responses

**No action needed** - it's already in `routes/payment.js`

---

## 🔍 What to Keep in server.js

### Keep These Sections:

1. **Imports and initial setup** (lines 1-31)
2. **CORS configuration** (lines 32-88)
3. **MongoDB connection** (lines 89-190)
4. **Model initialization** (lines 191-195)
5. **Session configuration** (lines 196-260)
6. **Passport configuration** (lines 261-323)
7. **Basic endpoints** (lines 344-395)
   - `GET /` - API info
   - `GET /api/health` - Health check
   - `GET /api/ping` - Ping
   - `GET /api/test` - Database test
8. **Payment routes mounting** (already correct):
   ```javascript
   app.use('/api', paymentRoutes);
   ```
9. **Server startup** (last lines)

---

## 📋 Final server.js Structure

After migration, your server.js should follow this structure:

```javascript
// 1. Imports
require("dotenv").config();
const express = require("express");
// ... other imports
const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
// ... other route imports
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// 2. App setup
const app = express();

// 3. Security middleware
app.use(helmet());
app.use(limiter);

// 4. CORS
app.use(cors({...}));

// 5. Body parsers
app.use(express.json());
app.use(express.urlencoded());

// 6. MongoDB connection
const connectToDB = async () => {...};

// 7. Models
const initializeModels = () => {...};
const { User, Book, Payment } = initializeModels();

// 8. Session setup
const setupSessionStore = () => {...};
app.use(session({...}));

// 9. Passport setup
passport.use(new GoogleStrategy({...}));

// 10. Set DB connections for routes
authRoutes.setDBConnection(connectToDB);
booksRoutes.setDBConnection(connectToDB);
usersRoutes.setDBConnection(connectToDB);
adminRoutes.setDBConnection(connectToDB);

// 11. Basic endpoints
app.get("/", ...);
app.get("/api/health", ...);
app.get("/api/ping", ...);
app.get("/api/test", ...);

// 12. API Routes
app.use('/api/auth', authRoutes.router);
app.use('/api/books', booksRoutes.router);
app.use('/api/user', usersRoutes.router);
app.use('/api/admin', adminRoutes.router);
app.use('/api/pdf-proxy', pdfProxyRoutes);
app.use('/api', paymentRoutes); // Already mounted

// 13. Error handling
app.use(notFound);  // 404 handler
app.use(errorHandler);  // Global error handler

// 14. Server startup
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

module.exports = app;
```

---

## ✅ Verification Checklist

After migration, verify:

- [ ] `npm install` runs successfully
- [ ] Server starts without errors
- [ ] `GET /` returns API info
- [ ] `GET /api/health` works
- [ ] `POST /api/auth/login` works
- [ ] `POST /api/auth/register` works (with validation)
- [ ] `GET /api/books` works
- [ ] `GET /api/user/purchased-books` requires auth
- [ ] `POST /api/admin/login` works
- [ ] `GET /api/admin/dashboard` has pagination
- [ ] Payment routes work (`/api/payment/*`)
- [ ] 404 handler works (try invalid route)
- [ ] Error handler works (trigger validation error)
- [ ] Logs use new logger format

---

## 🐛 Common Issues

### Issue 1: "Cannot find module './routes/auth'"
**Solution**: Ensure all route files are in `backend/routes/` directory

### Issue 2: "setDBConnection is not a function"
**Solution**: Make sure you're calling it before mounting routes:
```javascript
authRoutes.setDBConnection(connectToDB);
app.use('/api/auth', authRoutes.router);  // AFTER setting connection
```

### Issue 3: Routes not working
**Solution**: Check route mounting order. Error handlers must be LAST.

### Issue 4: Validation not working
**Solution**: Ensure joi is installed: `npm install joi`

### Issue 5: Logger not found
**Solution**: Check that `utils/logger.js` exists

---

## 🔄 Rollback Plan

If you encounter issues:

1. **Stop the server**
2. **Restore backup**:
   ```bash
   cp server.js.backup server.js
   ```
3. **Restart**:
   ```bash
   npm run dev
   ```
4. **Report issues** and we'll fix them

---

## 📞 Need Help?

1. Check the error message
2. Verify file structure matches above
3. Ensure all dependencies installed
4. Check logger output (set `LOG_LEVEL=DEBUG`)

---

## 🎯 Expected Benefits After Migration

- ✅ **Smaller files**: Easier to navigate and understand
- ✅ **Better testing**: Can test routes in isolation
- ✅ **Clearer responsibility**: Each file has one purpose
- ✅ **Easier debugging**: Logs show which file handling request
- ✅ **Team collaboration**: Multiple developers can work simultaneously
- ✅ **Future-proof**: Easy to add new features

---

**Good luck with the migration! 🚀**
