const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: (process.env.SMTP_PORT === '465'), // secure connection for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify connection configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('[Email SMTP] Configuration error:', error.message);
  } else {
    console.log('[Email SMTP] Connected successfully to SMTP server. Ready to send emails.');
  }
});

module.exports = transporter;
