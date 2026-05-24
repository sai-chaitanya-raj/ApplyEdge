const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], state: false })
);

router.get('/google/callback',
  (req, res, next) => {
    console.log('[OAuth Callback] Received callback, query:', req.query);
    passport.authenticate('google', { session: false }, (err, user, info) => {
      console.log('[OAuth Callback] err:', err, 'user:', user ? user.email : null, 'info:', info);
      if (err || !user) {
        console.error('Google OAuth error:', err || info);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
      }

      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const userPayload = JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email
      });

      const redirectUrl = `${process.env.CLIENT_URL}/auth/success?token=${token}&user=${encodeURIComponent(userPayload)}`;
      console.log('[OAuth Callback] Redirecting to:', redirectUrl.substring(0, 80) + '...');
      res.redirect(redirectUrl);
    })(req, res, next);
  }
);

module.exports = router;