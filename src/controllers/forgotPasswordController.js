const bcrypt = require('bcryptjs');
const User = require('../models/User');
const transporter = require('../config/email');

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // Generate a secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store the OTP and set expiration to 10 minutes from now
    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    console.log(`[Forgot Password] Generated OTP for ${email}: ${otp}`);

    // Set up standard mail options
    const mailOptions = {
      from: process.env.SMTP_FROM || `"ApplyEdge" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Password Reset Code from ApplyEdge',
      text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
          <h2 style="color: #7c3aed; text-align: center;">ApplyEdge Password Reset</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Use the verification code below to proceed:</p>
          <div style="background-color: #f5f3ff; border: 1px dashed #7c3aed; border-radius: 8px; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #7c3aed; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 13px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
          <br>
          <hr style="border: none; border-top: 1px solid #eaeaea;">
          <p style="color: #999; font-size: 11px; text-align: center;">⚡ ApplyEdge Team</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'OTP sent to your email successfully' });
    } catch (mailError) {
      console.warn('[Forgot Password] Nodemailer failed to deliver email:', mailError.message);
      console.warn(`[Forgot Password] FALLBACK: Use the generated OTP [${otp}] from the console to verify.`);
      
      // Return 200 success with a notice so the user can test using console logs
      res.status(200).json({ 
        message: 'OTP generated successfully. (SMTP delivery failed/timed out, please check your server terminal console for the OTP code to proceed!)'
      });
    }

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

    // Hash the new password
    user.password = await bcrypt.hash(newPassword, 10);
    
    // Clear OTP fields to prevent reuse
    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully. You can now login.' });

  } catch (error) {
    console.error('[Reset Password] Error:', error.message);
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};
