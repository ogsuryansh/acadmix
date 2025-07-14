function isLoggedIn(req, res, next) {
  console.log("🔐 Middleware triggered");
  console.log("🧪 req.isAuthenticated():", typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : 'Not a function');
  console.log("🧑 req.user:", req.user);

  // Check if user is authenticated
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  // Prevent saving redirect for auth routes (to avoid redirect loop)
  if (!req.originalUrl.includes("/api/auth")) {
    req.session.redirectAfterLogin = req.originalUrl;
  }

  // Redirect to Google login
  res.redirect("/api/auth/google");
}

module.exports = isLoggedIn;
