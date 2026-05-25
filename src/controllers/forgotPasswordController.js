const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendPasswordResetOtp } = require('../config/email');

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('_id email');
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetOtpExpires = Date.now() + 10 * 60 * 1000;

    await User.updateOne(
      { _id: user._id },
      { resetOtp: otp, resetOtpExpires }
    );

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Forgot Password] OTP for ${normalizedEmail}: ${otp}`);
    }

    // Reply immediately — do not wait for Gmail SMTP (often 5–30s from cloud hosts)
    res.status(200).json({
      message: 'Verification code is on its way. Check your inbox (and spam) in a minute.'
    });

    sendPasswordResetOtp(user.email, otp).catch((mailError) => {
      console.error('[Forgot Password] Email delivery failed:', mailError.message);
    });

  } catch (error) {
    console.error('[Forgot Password] Error generating OTP:', error.message);
    res.status(500).json({ message: 'Could not generate OTP.', error: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetOtp: otp,
      resetOtpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    res.status(200).json({ message: 'OTP code verified successfully' });

  } catch (error) {
    console.error('[Verify OTP] Error:', error.message);
    res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetOtp: otp,
      resetOtpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired session. Please request a new OTP.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully. You can now login.' });

  } catch (error) {
    console.error('[Reset Password] Error:', error.message);
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};
