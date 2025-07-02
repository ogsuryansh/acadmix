const express = require("express");
const passport = require("passport");
const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("https://acadmix.shop");
  }
);

router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("https://acadmix.shop");
  });
});

router.get("/user", (req, res) => {
  console.log('🔍 Session:', req.session);
  console.log('🔍 User:', req.user);

  if (!req.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  res.json(req.user);
});


module.exports = router;