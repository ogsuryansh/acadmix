function isLoggedIn(req, res, next) {
  console.log("🔐 Middleware triggered");
  console.log("🧪 req.isAuthenticated():", req.isAuthenticated?.());
  console.log("🧑 req.user:", req.user);

  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  res.redirect("/api/auth/google");
}
module.exports = isLoggedIn;
