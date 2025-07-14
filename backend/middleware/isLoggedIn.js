function isLoggedIn(req, res, next) {
  if (req.user) {
    return next();
  }
  res.redirect("/api/auth/google");
}
module.exports = isLoggedIn;
