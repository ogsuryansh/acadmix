const isProd = process.env.NODE_ENV === "production";

require("dotenv").config();
console.log("🔑 ENV Check:", {
  GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
  MONGO_URI: !!process.env.MONGO_URI,
  SESSION_SECRET: !!process.env.SESSION_SECRET,
  ADMIN_USER: !!process.env.ADMIN_USER,
  ADMIN_PASS: !!process.env.ADMIN_PASS,
});
console.log("🚀 Starting backend...");

const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const serverless = require("serverless-http");
const cors = require("cors");
const helmet = require("helmet");                  // full helmet bundle
const { contentSecurityPolicy } = helmet;          // standalone CSP
const path = require("path");
const QRCode = require("qrcode");

const User = require("./models/User");
const Book = require("./models/Book");
const Payment = require("./models/Payment");
const MongoStore = require("connect-mongo");


// ─── EXPRESS APP ─────────────────────────────────────────────────────────────
const app = express();
app.set("trust proxy", 1);

// ─── HELMET & CSP ────────────────────────────────────────────────────────────
// 1) Apply all default helmet protections (HSTS, referrer-policy, etc.)
app.use(helmet());

// 2) Then override only CSP so it includes your API host
app.use(
  contentSecurityPolicy({
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "https://acadmix.shop",
        "https://www.acadmix.shop",
        "https://api.acadmix.shop",
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://apis.google.com",
        "https://cdnjs.cloudflare.com",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com",
      ],
      fontSrc: [
        "'self'",
        "data:",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com",
      ],
      imgSrc: ["'self'", "data:", "https:"],
      formAction: [
        "'self'",
        "https://acadmix.shop",
        "https://api.acadmix.shop",
      ],
    },
  })
);

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "https://acadmix.shop",
  "https://www.acadmix.shop",
  "https://api.acadmix.shop",
  "https://acadmix-opal.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:5500",
];
app.use(
  cors({
    origin: (origin, cb) =>
      !origin || allowedOrigins.includes(origin)
        ? cb(null, true)
        : cb(new Error("CORS DENIED")),
    credentials: true,
  })
);

// ─── BODY PARSERS ─────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ─── MONGO CONNECTION ─────────────────────────────────────────────────────────
async function connectToDB() {
  if (global._mongoConn) return global._mongoConn;
  if (!global._mongoPromise) {
    global._mongoPromise = mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
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
    next();
  } catch (err) {
    console.error("❌ DB Connection Error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// ─── SESSIONS & PASSPORT ──────────────────────────────────────────────────────
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 14 * 24 * 60 * 60, // 14 days
    }),
    cookie: {
      httpOnly: true,
      secure: isProd,                         // only over HTTPS in prod
      sameSite: isProd ? "none" : "lax",      // none for cross‑site in prod
      ...(isProd && { domain: ".acadmix.shop" }), // only set domain in prod
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) =>
  User.findById(id).then(u => done(null, u)).catch(e => done(e))
);
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://api.acadmix.shop/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0]?.value,
            photo: profile.photos?.[0]?.value,
          });
        }
        done(null, user);
      } catch (err) {
        console.error("🚨 GoogleStrategy error:", err);
        done(err, null);
      }
    }
  )
);

// ─── VIEWS & ROUTES ──────────────────────────────────────────────────────────
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Public reader assets
app.use(
  "/reader-assets",
  express.static(path.join(__dirname, "ebook-reader"))
);
app.get("/reader", (req, res) => {
  res.sendFile(path.join(__dirname, "ebook-reader", "index.html"));
});

// Secure PDF JSON endpoint
app.get("/api/book/:id/secure-pdf", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book?.pdfUrl) return res.status(404).json({ error: "Not found" });
    res.json({ url: book.pdfUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Payment routes
const paymentRouter = require("./routes/payment");
app.use("/api", paymentRouter);

// Auth routes
app.use("/api/auth", require("./routes/auth"));

// Admin panel
function isAdminAuthenticated(req, res, next) {
  if (req.session?.admin) return next();
  res.redirect("/api/admin/login");
}
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

app.get("/api/admin/login", (req, res) =>
  res.render("login", { error: req.query.error })
);
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.admin = true;
    return res.redirect("/api/admin");
  }
  res.redirect("/api/admin/login?error=1");
});
app.post("/api/admin/logout", (req, res) => {
  req.session.admin = null;
  res.redirect("/api/admin/login");
});

app.get("/api/admin", isAdminAuthenticated, async (req, res, next) => {
  try {
    const users = await User.find().lean();
    const totalUsers = users.length;
    const totalBooks = await Book.countDocuments();
    const totalPayments = await Payment.countDocuments();
    const payments = await Payment.find()
      .sort({ submittedAt: -1 })
      .limit(50)
      .populate("user", "name email")
      .populate("book", "title")
      .lean();

    res.render("admin", {
      users,
      totalUsers,
      totalBooks,
      totalPayments,
      payments,
    });
  } catch (err) {
    console.error("❌ Admin panel error:", err);
    next(err);
  }
});

app.post(
  "/api/admin/payments/:id/approve",
  isAdminAuthenticated,
  async (req, res, next) => {
    try {
      await Payment.findByIdAndUpdate(req.params.id, { status: "approved" });
      res.redirect("/api/admin?tab=payments-tab");
    } catch (err) {
      next(err);
    }
  }
);
app.post(
  "/api/admin/payments/:id/reject",
  isAdminAuthenticated,
  async (req, res, next) => {
    try {
      await Payment.findByIdAndUpdate(req.params.id, { status: "rejected" });
      res.redirect("/api/admin?tab=payments-tab");
    } catch (err) {
      next(err);
    }
  }
);

// Public API to fetch all books
app.get("/api/books", async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    console.error("❌ Error fetching books:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Admin book management
app.get("/api/admin/books", isAdminAuthenticated, async (req, res) => {
  const books = await Book.find().sort({ createdAt: -1 });
  res.render("admin-books", { books });
});

const BOOK_CATEGORIES = [
  "NCERT Highlights",
  "Physics",
  "Biology",
  "Chemistry",
  "JEE",
  "NEET",
];
const BOOK_SECTIONS = ["home", "class11", "class12", "test"];

app.get("/api/admin/books/new", isAdminAuthenticated, (req, res) => {
  res.render("add-book", {
    categories: BOOK_CATEGORIES,
    sections: BOOK_SECTIONS,
    error: null,
    title: "",
    category: "",
    section: "",
    track: "",
    pageCount: "",
    priceOriginal: "",
    priceDiscounted: "",
    badge: "",
    imageUrl: "",
    demo: "",
    pdfPath: "", // newly added
    editMode: false,
    bookId: null,
  });
});

app.post("/api/admin/books/new", isAdminAuthenticated, async (req, res) => {
  const {
    title,
    category,
    section,
    track,
    pageCount,
    priceOriginal,
    priceDiscounted,
    badge,
    imageUrl,
    demo,
    pdfPath,
  } = req.body;

  // Image URL validation
  if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i.test(imageUrl)) {
    return res.status(400).render("add-book", {
      categories: BOOK_CATEGORIES,
      sections: BOOK_SECTIONS,
      error: "Please enter a valid image URL ending with .jpg/.png/.gif",
      title,
      category,
      section,
      track,
      pageCount,
      priceOriginal,
      priceDiscounted,
      badge,
      imageUrl,
      demo,
      pdfPath,
      editMode: false,
      bookId: null,
    });
  }

  // PDF URL validation
  if (pdfPath && !/^https?:\/\/.+\.pdf$/i.test(pdfPath)) {
    return res.status(400).render("add-book", {
      categories: BOOK_CATEGORIES,
      sections: BOOK_SECTIONS,
      error: "Please enter a valid PDF URL ending with .pdf",
      title,
      category,
      section,
      track,
      pageCount,
      priceOriginal,
      priceDiscounted,
      badge,
      imageUrl,
      demo,
      pdfPath,
      editMode: false,
      bookId: null,
    });
  }

  try {
    await Book.create({
      title,
      category,
      section,
      track,
      pageCount: Number(pageCount),
      priceOriginal: Number(priceOriginal),
      priceDiscounted: Number(priceDiscounted),
      badge,
      imageUrl,
      demo,
      pdfUrl: pdfPath,
    });
    res.redirect("/api/admin/books");
  } catch (err) {
    console.error("❌ Book creation error:", err);
    res.status(500).render("add-book", {
      categories: BOOK_CATEGORIES,
      sections: BOOK_SECTIONS,
      error: "An error occurred while adding the book. Please try again.",
      title,
      category,
      section,
      track,
      pageCount,
      priceOriginal,
      priceDiscounted,
      badge,
      imageUrl,
      demo,
      pdfPath,
      editMode: false,
      bookId: null,
    });
  }
});

app.get("/api/admin/books/:id/edit", isAdminAuthenticated, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).send("Book not found");

    res.render("add-book", {
      categories: BOOK_CATEGORIES,
      sections: BOOK_SECTIONS,
      error: null,
      title: book.title,
      category: book.category,
      section: book.section,
      track: book.track,
      pageCount: book.pageCount,
      priceOriginal: book.priceOriginal,
      priceDiscounted: book.priceDiscounted,
      badge: book.badge,
      imageUrl: book.imageUrl,
      demo: book.demo,
      pdfPath: book.pdfUrl || "",
      editMode: true,
      bookId: book._id,
    });
  } catch (err) {
    console.error("❌ Error rendering edit form:", err);
    res.status(500).send("Server Error");
  }
});

app.post(
  "/api/admin/books/:id/edit",
  isAdminAuthenticated,
  async (req, res) => {
    const {
      title,
      category,
      section,
      track,
      pageCount,
      priceOriginal,
      priceDiscounted,
      badge,
      imageUrl,
      demo,
      pdfPath,
    } = req.body;

    try {
      const book = await Book.findById(req.params.id);
      if (!book) return res.status(404).send("Book not found");

      Object.assign(book, {
        title,
        category,
        section,
        track,
        pageCount: Number(pageCount),
        priceOriginal: Number(priceOriginal),
        priceDiscounted: Number(priceDiscounted),
        badge,
        imageUrl,
        demo,
        pdfUrl: pdfPath,
      });

      await book.save();
      res.redirect("/api/admin/books");
    } catch (err) {
      console.error("❌ Error updating book:", err);
      res.status(500).send("Server Error");
    }
  }
);

app.post(
  "/api/admin/books/:id/delete",
  isAdminAuthenticated,
  async (req, res) => {
    try {
      await Book.findByIdAndDelete(req.params.id);
      res.redirect("/api/admin/books");
    } catch (err) {
      console.error("❌ Error deleting book:", err);
      res.status(500).send("Server Error");
    }
  }
);

// Course pages
app.get("/courses/class11", async (req, res) => {
  try {
    const neetBooks = await Book.find({
      section: "class11",
      category: "NEET",
      track: "NEET",
    });
    const jeeBooks = await Book.find({
      section: "class11",
      category: "JEE",
      track: "JEE",
    });
    res.render("courses/class11", { neetBooks, jeeBooks });
  } catch (err) {
    console.error("❌ Class 11 route error:", err);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/courses/class12", async (req, res) => {
  try {
    const neetBooks = await Book.find({
      section: "class12",
      category: "NEET",
      track: "NEET",
    });
    const jeeBooks = await Book.find({
      section: "class12",
      category: "JEE",
      track: "JEE",
    });
    res.render("courses/class12", { neetBooks, jeeBooks });
  } catch (err) {
    console.error("❌ Class 12 route error:", err);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/courses/test", async (req, res) => {
  try {
    const neetBooks = await Book.find({
      section: "test",
      category: "NEET",
      track: "NEET",
    });
    const jeeBooks = await Book.find({
      section: "test",
      category: "JEE",
      track: "JEE",
    });
    res.render("courses/test", { neetBooks, jeeBooks });
  } catch (err) {
    console.error("❌ Test route error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Static & error handling
app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));
app.get("/favicon.ico", (req, res) => res.status(204).end());
app.use(express.static(path.join(__dirname, "..", "public")));

// Global error handler (JSON)
app.use((err, req, res, next) => {
  console.error("💥 Uncaught Error:", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

// Client build (if any)
app.use("/client", express.static(path.join(__dirname, "..", "client")));

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () =>
    console.log(`🚀 Dev server listening at http://localhost:${PORT}`)
  );
} else {
  module.exports = app;
  module.exports.handler = serverless(app);
}
