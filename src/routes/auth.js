const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const forgotPasswordController = require('../controllers/forgotPasswordController');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', forgotPasswordController.forgotPassword);
router.post('/verify-otp', forgotPasswordController.verifyOtp);
router.post('/reset-password', forgotPasswordController.resetPassword);


router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], state: false })
);

router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err || !user) {
        console.error('[Google OAuth] Authentication failed:', err || info);
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
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

      res.redirect(
        `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/success?token=${token}&user=${encodeURIComponent(userPayload)}`
      );
    })(req, res, next);
  }
);

module.exports = router;