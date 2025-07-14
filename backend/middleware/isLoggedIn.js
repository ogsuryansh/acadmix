// middleware/isLoggedIn.js
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.redirect("/api/auth/google"); // or your login route
}
module.exports = isLoggedIn;
