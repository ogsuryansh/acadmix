const express = require("express");
const passport = require("passport");
const router = express.Router();

// Use an env var for your frontend origin, fallback as needed
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "https://acadmix.shop";

// 🔐 Step 1: Start Google OAuth and store a safe redirect path
router.get("/google", (req, res, next) => {
  // Only allow redirect back into your own frontend
  const referer = req.get("Referer") || "";
  const returnTo = referer.startsWith(FRONTEND_ORIGIN)
    ? referer
    : FRONTEND_ORIGIN;

  req.session.redirectAfterLogin = returnTo;
  passport.authenticate("google", {
    scope: ["profile", "email"],
    // optionally force account selection each time:
    // prompt: "select_account"
  })(req, res, next);
});

// 🔁 Step 2: Google OAuth callback + redirect back
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${FRONTEND_ORIGIN}/?error=auth_failed`,
    failureMessage: true,
  }),
  (req, res) => {
    const redirectTo = req.session.redirectAfterLogin || FRONTEND_ORIGIN;
    delete req.session.redirectAfterLogin;
    res.redirect(redirectTo);
  }
);

// 🚪 Use POST for logout to avoid CSRF/pre‑fetch issues
router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) console.error("Logout error:", err);
    req.session.destroy(() => {
      // match your session cookie settings exactly
      res.clearCookie("connect.sid", {
        path: "/",
        domain: ".acadmix.shop",
        sameSite: "none",
        secure: true,
      });
      res.redirect(FRONTEND_ORIGIN);
    });
  });
});

// 🧑 Authenticated user fetch (returns 401 if not signed in)
router.get("/user", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json(req.user);
});

module.exports = router;
