const nodemailer = require('nodemailer');

const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

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

function useSmtpForLocalDev() {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

function parseEmailFromString(value) {
  const match = value.match(/<([^>]+)>/);
  if (match) {
    const name = value.replace(/<[^>]+>/, '').trim() || 'ApplyEdge';
    return { name, email: match[1].trim() };
  }
  if (value.includes('@')) {
    return { name: process.env.BREVO_SENDER_NAME || 'ApplyEdge', email: value.trim() };
  }
  return null;
}

function getBrevoSender() {
  if (process.env.BREVO_SENDER_EMAIL) {
    return {
      name: process.env.BREVO_SENDER_NAME || 'ApplyEdge',
      email: process.env.BREVO_SENDER_EMAIL
    };
  }
  const fromEnv = parseEmailFromString(process.env.EMAIL_FROM || '');
  if (fromEnv) return fromEnv;
  if (process.env.SMTP_USER) {
    return { name: 'ApplyEdge', email: process.env.SMTP_USER };
  }
  throw new Error('Set BREVO_SENDER_EMAIL to your verified Brevo sender (e.g. noreply.applyedge@gmail.com)');
}

function getSmtpFromAddress() {
  const from = process.env.SMTP_FROM || '';
  if (from.includes('@') && !from.includes('your_gmail')) return from;
  if (process.env.SMTP_USER) return `"ApplyEdge" <${process.env.SMTP_USER}>`;
  throw new Error('Set SMTP_USER (and SMTP_PASS) in .env for local email');
}

function getResendFromAddress() {
  const from = process.env.EMAIL_FROM || '';
  if (from.includes('@') && !from.includes('resend.dev')) return from;
  return 'ApplyEdge <onboarding@resend.dev>';
}

function buildOtpEmailContent(otp) {
  return {
    subject: 'Your ApplyEdge password reset code',
    text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, ignore this email.\n— ApplyEdge`
  };
}

/** Brevo HTTPS API — free tier, verify single Gmail sender (no domain required) */
async function sendViaBrevo(to, otp) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;

  const { subject, text } = buildOtpEmailContent(otp);
  const sender = getBrevoSender();

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      accept: 'application/json'
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      textContent: text
    })
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || body.error || `Brevo HTTP ${response.status}`);
  }
  return body;
}

/** Resend HTTPS API — fallback; test sender only reaches limited addresses */
async function sendViaResend(to, otp) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const { subject, text } = buildOtpEmailContent(otp);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: getResendFromAddress(),
      to: [to],
      subject,
      text
    })
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || body.error || `Resend HTTP ${response.status}`);
  }
  return body;
}

async function sendViaSmtp(to, otp) {
  const { subject, text } = buildOtpEmailContent(otp);
  return transporter.sendMail({ from: getSmtpFromAddress(), to, subject, text });
}

async function sendPasswordResetOtp(to, otp) {
  if (useSmtpForLocalDev()) {
    return sendViaSmtp(to, otp);
  }
  if (process.env.BREVO_API_KEY) {
    return sendViaBrevo(to, otp);
  }
  if (process.env.RESEND_API_KEY) {
    return sendViaResend(to, otp);
  }
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return sendViaSmtp(to, otp);
  }
  throw new Error(
    'No email provider configured. Set BREVO_API_KEY on Render, or SMTP_USER/SMTP_PASS for local dev.'
  );
}

function getEmailProvider() {
  if (useSmtpForLocalDev()) return 'smtp (local dev)';
  if (process.env.BREVO_API_KEY) return 'brevo';
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp';
  return 'none';
}

const provider = getEmailProvider();
if (provider === 'smtp') {
  setImmediate(() => {
    transporter.verify((error) => {
      if (error) console.error('[Email SMTP] Configuration error:', error.message);
      else console.log('[Email SMTP] Pool ready');
    });
  });
} else if (provider === 'brevo') {
  console.log('[Email] Using Brevo API (HTTPS) — works on Render free tier');
} else if (provider === 'resend') {
  console.log('[Email] Using Resend API (HTTPS) — OK for Render free tier');
} else if (provider === 'smtp (local dev)') {
  console.log('[Email] Using Gmail SMTP for local development');
} else {
  console.warn('[Email] No BREVO_API_KEY, RESEND_API_KEY, or SMTP credentials — OTP emails will fail');
}

module.exports = transporter;
module.exports.sendPasswordResetOtp = sendPasswordResetOtp;
module.exports.getEmailProvider = getEmailProvider;
