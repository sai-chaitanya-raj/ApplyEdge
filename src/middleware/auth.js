const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('[Auth Middleware] Incoming Authorization Header:', authHeader ? 'Present' : 'Missing');

    const token = authHeader?.split(' ')[1];

    if (!token) {
      console.warn('[Auth Middleware] Token missing from header');
      return res.status(401).json({ message: 'Access denied. Please login.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    console.log('[Auth Middleware] Token verified successfully for userId:', decoded.userId);
    next();

  } catch (error) {
    console.error('[Auth Middleware] Token verification failed:', error.message);
    res.status(401).json({ message: 'Invalid or expired token. Please login again.', error: error.message });
  }
};