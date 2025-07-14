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
    const redirectTo = req.session.redirectAfterLogin || "https://acadmix.shop";
    delete req.session.redirectAfterLogin;
    res.redirect(redirectTo);
  }
);

router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("https://acadmix.shop");
  });
});

router.get("/user", (req, res) => {
  res.json(req.user || null);
});

module.exports = router;
