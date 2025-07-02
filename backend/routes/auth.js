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
  res.json(req.user || null);
});
