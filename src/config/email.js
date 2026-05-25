const nodemailer = require('nodemailer');

const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

// Pooled connection — reuses SMTP socket instead of reconnecting every OTP (much faster on Render)
const transporter = nodemailer.createTransport({
  pool: true,
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  maxConnections: 3,
  maxMessages: 100,
  connectionTimeout: 8000,
  greetingTimeout: 8000,
  socketTimeout: 12000
});

function getFromAddress() {
  const from = process.env.SMTP_FROM || '';
  // Invalid "noreply.applyedge.com" style addresses slow/fail Gmail delivery
  if (from.includes('@')) return from;
  return `"ApplyEdge" <${process.env.SMTP_USER}>`;
}

/** Plain-text OTP email — small payload, faster than HTML over SMTP */
function sendPasswordResetOtp(to, otp) {
  return transporter.sendMail({
    from: getFromAddress(),
    to,
    subject: 'Your ApplyEdge password reset code',
    text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, ignore this email.\n— ApplyEdge`
  });
}

// Warm up pool in background (do not block server startup or API requests)
setImmediate(() => {
  transporter.verify((error) => {
    if (error) {
      console.error('[Email SMTP] Configuration error:', error.message);
    } else {
      console.log('[Email SMTP] Pool ready');
    }
  });
});

module.exports = transporter;
module.exports.sendPasswordResetOtp = sendPasswordResetOtp;
