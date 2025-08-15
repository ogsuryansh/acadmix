const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  console.log('🔍 AuthenticateToken Debug:', {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-jwt-secret"
    );
    
    console.log('🔍 Token decoded:', {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      admin: decoded.admin
    });

    // Handle admin tokens (created with environment variables)
    if (decoded.admin && decoded.role === "admin") {
      req.user = decoded;
      return next();
    }

    // Check if user still exists and is active (for regular users)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    req.user = { ...decoded, role: user.role };
    console.log('✅ User authenticated:', {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    });
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ error: "Invalid token" });
    } else if (err.name === "TokenExpiredError") {
      return res.status(403).json({ error: "Token expired" });
    }
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

module.exports = authenticateToken;
