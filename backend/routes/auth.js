const express = require("express");
const passport = require("passport");
const router = express.Router();

// 🔐 Step 1: Start Google OAuth and store redirect path
router.get("/google", (req, res, next) => {
  const returnTo = req.get("Referer") || "https://acadmix.shop";
  req.session.redirectAfterLogin = returnTo;
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

// 🔁 Step 2: Google OAuth callback + redirect back
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const redirectTo = req.session.redirectAfterLogin || "https://acadmix.shop";
    delete req.session.redirectAfterLogin;
    res.redirect(redirectTo);
  }
);

// 🚪 Logout and clear session cookie
router.get("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.redirect("https://acadmix.shop");
    });
  });
});

// 🧑 Authenticated user fetch (for frontend)
router.get("/user", (req, res) => {
  res.json(req.user || null);
});

module.exports = router;
