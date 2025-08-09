function isLoggedIn(req, res, next) {
  // Already authenticated via session (Passport)
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  // For API/XHR requests, do NOT redirect to Google (causes CORS). Return 401 JSON
  const isApiRequest = req.path.startsWith('/');
  const acceptsJson = req.xhr || (req.headers.accept || '').includes('application/json');
  const isAjax = req.get('X-Requested-With') === 'XMLHttpRequest';

  if (isApiRequest || acceptsJson || isAjax) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // For normal browser navigations (non-API pages), save redirect and send to Google
  if (!req.originalUrl.includes('/api/auth')) {
    req.session.redirectAfterLogin = req.originalUrl;
  }
  return res.redirect('/api/auth/google');
}

module.exports = isLoggedIn;
